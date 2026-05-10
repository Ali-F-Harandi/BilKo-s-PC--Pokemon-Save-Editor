/**
 * manipulation.js — Pokémon Moving/Transferring Logic
 *
 * Refactored: Works with CanonicalPokemon objects and uses adapter
 * for stat recalculation instead of importing Gen1-specific modules.
 * Accepts an adapter parameter for recalculation.
 */

import { CanonicalPokemon } from '../core/CanonicalModel.js';
import { GenerationRegistry } from '../core/GenerationRegistry.js';
import { AdapterFactory } from '../core/AdapterFactory.js';

// Lazy adapter factory
let _adapterFactory = null;
function getAdapterFactory() {
    if (!_adapterFactory) {
        const registry = new GenerationRegistry();
        _adapterFactory = new AdapterFactory(registry);
    }
    return _adapterFactory;
}

// Helper to check equality of locations
export function isSameLocation(a, b) {
  if (a.type === 'party' && b.type === 'party') {
    return a.index === b.index;
  }
  if (a.type === 'box' && b.type === 'box') {
    return a.boxIndex === b.boxIndex && a.index === b.index;
  }
  return false;
}

// Helper to prepare stats when moving to/from Party/Box
const prepareForLocation = (mon, isGoingToParty, adapter = null) => {
  const newMon = { ...mon, isParty: isGoingToParty };
  if (isGoingToParty && adapter) {
    const base = adapter.getBaseStats(newMon.dexId);
    if (base) {
      const iv = newMon.iv || {};
      const ev = newMon.ev || {};
      const level = newMon.level || 1;

      const spcIv = iv.special !== undefined ? iv.special : (iv.spAttack || 0);
      const spcEv = ev.special !== undefined ? ev.special : (ev.spAttack || 0);

      newMon.maxHp = adapter.calculateStat(base.hp, iv.hp || 0, ev.hp || 0, level, true);
      newMon.hp = Math.min(newMon.hp || newMon.maxHp, newMon.maxHp);
      newMon.attack = adapter.calculateStat(base.attack, iv.attack || 0, ev.attack || 0, level, false);
      newMon.defense = adapter.calculateStat(base.defense, iv.defense || 0, ev.defense || 0, level, false);
      newMon.speed = adapter.calculateStat(base.speed, iv.speed || 0, ev.speed || 0, level, false);
      const special = adapter.calculateStat(base.special || base.spAttack, spcIv, spcEv, level, false);
      newMon.special = special;
      newMon.spAtk = special;
      newMon.spDef = special;

      if (adapter.generationId >= 2) {
        newMon.spAtk = adapter.calculateStat(base.spAttack || base.special, spcIv, spcEv, level, false);
        newMon.spDef = adapter.calculateStat(base.spDefense || base.special, spcIv, spcEv, level, false);
      }
    }
  }
  return newMon;
};

/**
 * Same-Container Reordering (Shift/Insert Logic)
 * Used ONLY when Source Container == Target Container (e.g. Box 1 -> Box 1)
 */
export function movePokemonBatch(
  data,
  sources,
  target,
  adapter = null
) {
  // Get adapter from save data if not provided
  if (!adapter) {
    const genId = data?.generationId || data?.generation || 1;
    adapter = getAdapterFactory().createForGeneration(genId);
  }

  // Capacity check: ensure target container won't exceed its limit
  const maxCapacity = target.type === 'party' ? (adapter?.getMaxPartySize() || 6) : (adapter?.getBoxCapacity() || 20);
  const originalTargetList = target.type === 'party' ? data.party : data.pcBoxes[target.boxIndex];
  const currentOccupied = originalTargetList.filter(m => m !== null && m !== undefined).length;
  // In same-container reorders, sources are removed first so capacity is preserved
  // But we still check for cross-type moves via this function being called incorrectly
  const isSameContainer = sources.every(s =>
    s.type === target.type && (s.type === 'party' || s.boxIndex === target.boxIndex)
  );
  if (!isSameContainer && currentOccupied + sources.length > maxCapacity) {
    return {
      success: false,
      error: `Not enough space! Target ${target.type === 'party' ? 'party' : 'box'} has ${maxCapacity - currentOccupied} slot(s) free, but you're moving ${sources.length} Pokémon.`
    };
  }

  // Sort sources to ensure predictable order
  const sortedSources = [...sources].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'party' ? -1 : 1;
    if (a.type === 'box' && b.type === 'box') {
      if (a.boxIndex !== b.boxIndex) return a.boxIndex - b.boxIndex;
    }
    return a.index - b.index;
  });

  // Deep clone arrays
  const newParty = [...data.party];
  const newBoxes = data.pcBoxes.map(box => [...box]);

  const getList = (loc) => loc.type === 'party' ? newParty : newBoxes[loc.boxIndex];
  const targetList = getList(target);

  // 1. Extract Moving Mons
  const movingMons = sortedSources.map(src => {
    const list = getList(src);
    return { ...list[src.index] }; // Clone
  });

  // 2. Remove Sources (Descending order to preserve indices during removal)
  const reverseSources = [...sortedSources].sort((a, b) => b.index - a.index);
  reverseSources.forEach(src => {
    const list = getList(src);
    list.splice(src.index, 1);
  });

  // 3. Calculate Insertion Index
  // Adjust target index based on how many items *before* it were removed from the same container
  let insertIndex = target.index;
  const removedBeforeTarget = sources.filter(s => s.index < target.index).length;

  insertIndex -= removedBeforeTarget;
  if (insertIndex < 0) insertIndex = 0;
  insertIndex = Math.min(insertIndex, targetList.length);

  // 4. Insert
  for (const mon of movingMons) {
    let readyMon = { ...mon };
    // prepareForLocation usually strictly for Box<->Party, but harmless here
    readyMon = prepareForLocation(readyMon, target.type === 'party', adapter);
    targetList.splice(insertIndex, 0, readyMon);
    insertIndex++;
  }

  return {
    success: true,
    newData: {
      ...data,
      party: newParty,
      partyCount: newParty.length,
      pcBoxes: newBoxes,
      currentBoxPokemon: newBoxes[data.currentBoxId],
      currentBoxCount: newBoxes[data.currentBoxId].length
    }
  };
}

/**
 * Cross-Container / Cross-Save Batch Transfer (Swap/Move Logic)
 * Used for Box 1 -> Box 2 (Same Save) OR Save 1 -> Save 2
 */
export function transferPokemonBatch(
  sourceSave,
  targetSave,
  sources,
  targetStart,
  adapter = null
) {
  // Determine if we are operating on the same save file
  const isSameSave = sourceSave === targetSave;

  // Get adapter from save data if not provided
  if (!adapter) {
    const genId = sourceSave?.generationId || sourceSave?.generation || 1;
    adapter = getAdapterFactory().createForGeneration(genId);
  }

  const maxPartySize = adapter?.getMaxPartySize() || 6;
  const boxCapacity = adapter?.getBoxCapacity() || 20;

  // 1. Create Working Copies
  let sourceParty = [...sourceSave.party];
  let sourceBoxes = sourceSave.pcBoxes.map(b => [...b]);
  let targetParty;
  let targetBoxes;

  if (isSameSave) {
    targetParty = sourceParty;
    targetBoxes = sourceBoxes;
  } else {
    targetParty = [...targetSave.party];
    targetBoxes = targetSave.pcBoxes.map(b => [...b]);
  }

  const getList = (isSource, loc) => {
    const party = isSource ? sourceParty : targetParty;
    const boxes = isSource ? sourceBoxes : targetBoxes;
    return loc.type === 'party' ? party : boxes[loc.boxIndex];
  };

  // 2. Sort Sources (Ascending)
  const sortedSources = [...sources].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'party' ? -1 : 1;
    if (a.type === 'box' && b.type === 'box') {
      if (a.boxIndex !== b.boxIndex) return a.boxIndex - b.boxIndex;
    }
    return a.index - b.index;
  });

  // 3. Execution Loop
  for (let i = 0; i < sortedSources.length; i++) {
    const srcLoc = sortedSources[i];

    // Calculate Target Location sequentially
    const currentTgtIndex = targetStart.index + i;
    const tgtLoc = { ...targetStart, index: currentTgtIndex };

    const srcList = getList(true, srcLoc);
    const tgtList = getList(false, tgtLoc);

    // Check limits
    const tgtLimit = tgtLoc.type === 'party' ? maxPartySize : boxCapacity;
    const tgtCurrentOccupied = tgtList.filter(m => m !== null && m !== undefined).length;
    if (tgtCurrentOccupied >= tgtLimit) {
      continue;
    }
    if (tgtLoc.index >= tgtLimit) break;

    // Get Mons
    const srcMon = srcList[srcLoc.index];
    if (!srcMon) continue;

    const tgtMon = tgtList[tgtLoc.index];

    // Validate Party Safety (Min 1 Pokemon)
    if (srcLoc.type === 'party' && !tgtMon) {
      const nonNullCount = srcList.filter(m => m !== null).length;
      if (nonNullCount <= 1) {
        continue;
      }
    }

    // Prepare Stats
    const isTgtParty = tgtLoc.type === 'party';
    const isSrcParty = srcLoc.type === 'party';

    const readySource = prepareForLocation({ ...srcMon }, isTgtParty, adapter);

    if (tgtMon) {
      // --- SWAP ---
      const readyTarget = prepareForLocation({ ...tgtMon }, isSrcParty, adapter);

      srcList[srcLoc.index] = readyTarget;
      tgtList[tgtLoc.index] = readySource;
    } else {
      // --- MOVE (Source -> Empty Target) ---
      if (tgtLoc.index >= tgtList.length) {
        tgtList.push(readySource);
      } else {
        tgtList[tgtLoc.index] = readySource;
      }

      srcList[srcLoc.index] = null;
    }
  }

  // 4. Cleanup Nulls & Reconstruct Save Objects
  const cleanList = (list) => list.filter(m => m !== null);

  const buildNewSave = (original, newParty, newBoxes) => {
    const cleanedParty = cleanList(newParty);
    const cleanedBoxes = newBoxes.map(b => cleanList(b));

    return {
      ...original,
      party: cleanedParty,
      partyCount: cleanedParty.length,
      pcBoxes: cleanedBoxes,
      currentBoxPokemon: cleanedBoxes[original.currentBoxId],
      currentBoxCount: cleanedBoxes[original.currentBoxId].length
    };
  };

  if (isSameSave) {
    const resultSave = buildNewSave(sourceSave, sourceParty, sourceBoxes);
    return { success: true, newSource: resultSave, newTarget: resultSave };
  } else {
    const newSrc = buildNewSave(sourceSave, sourceParty, sourceBoxes);
    const newTgt = buildNewSave(targetSave, targetParty, targetBoxes);
    return { success: true, newSource: newSrc, newTarget: newTgt };
  }
}

// Legacy single transfer wrapper
export function transferPokemon(
  sourceData,
  targetData,
  sourceLoc,
  targetLoc,
  adapter = null
) {
  return transferPokemonBatch(sourceData, targetData, [sourceLoc], targetLoc, adapter);
}
