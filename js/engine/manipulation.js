/**
 * manipulation.js — Pokémon Moving/Transferring Logic
 *
 * Ported from lib/utils/manipulation.ts
 * Handles reordering, transferring, and preparing Pokémon for moves.
 */

import { recalculateStats, deriveBaseStats } from './statCalculator.js';
import { GEN1_BASE_STATS } from '../data/baseStats.js';

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
const prepareForLocation = (mon, isGoingToParty) => {
  const newMon = { ...mon, isParty: isGoingToParty };
  if (isGoingToParty) {
    let base = deriveBaseStats(newMon, 1);
    if (!base && GEN1_BASE_STATS[newMon.dexId]) {
      const g1Stats = GEN1_BASE_STATS[newMon.dexId];
      base = {
        hp: g1Stats.hp,
        attack: g1Stats.atk,
        defense: g1Stats.def,
        speed: g1Stats.spe,
        spAtk: g1Stats.spc,
        spDef: g1Stats.spc
      };
    }

    if (base) {
      const updated = recalculateStats(newMon, base, 1);
      newMon.maxHp = updated.maxHp;
      newMon.attack = updated.attack;
      newMon.defense = updated.defense;
      newMon.speed = updated.speed;
      newMon.special = updated.special;
      newMon.spAtk = updated.special;
      newMon.spDef = updated.special;
      newMon.hp = Math.min(newMon.hp, newMon.maxHp);
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
  target
) {
  // Capacity check: ensure target container won't exceed its limit
  const maxCapacity = target.type === 'party' ? 6 : 20;
  const targetList = target.type === 'party' ? data.party : data.pcBoxes[target.boxIndex];
  const currentOccupied = targetList.filter(m => m !== null && m !== undefined).length;
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
    readyMon = prepareForLocation(readyMon, target.type === 'party');
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
  targetStart
) {
  // Determine if we are operating on the same save file
  const isSameSave = sourceSave === targetSave;

  // 1. Create Working Copies
  // If same save, source and target structure references must share the same arrays to avoid overwrites.

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
    const tgtLimit = tgtLoc.type === 'party' ? 6 : 20;
    const tgtCurrentOccupied = tgtList.filter(m => m !== null && m !== undefined).length;
    if (tgtCurrentOccupied >= tgtLimit) {
      // Target is full — cannot add more
      continue;
    }
    if (tgtLoc.index >= tgtLimit) break; // Stop if target full/out of bounds

    // Get Mons
    const srcMon = srcList[srcLoc.index];
    // If srcMon is null (already moved in a weird overlap edge case), skip
    if (!srcMon) continue;

    const tgtMon = tgtList[tgtLoc.index]; // Might be undefined/null

    // Validate Party Safety (Min 1 Pokemon)
    // If Source is Party, and we are moving (tgtMon is empty), check remaining count
    if (srcLoc.type === 'party' && !tgtMon) {
      const nonNullCount = srcList.filter(m => m !== null).length;
      if (nonNullCount <= 1) {
        continue; // Cannot empty party
      }
    }

    // Prepare Stats
    const isTgtParty = tgtLoc.type === 'party';
    const isSrcParty = srcLoc.type === 'party';

    const readySource = prepareForLocation({ ...srcMon }, isTgtParty);

    if (tgtMon) {
      // --- SWAP ---
      const readyTarget = prepareForLocation({ ...tgtMon }, isSrcParty);

      srcList[srcLoc.index] = readyTarget;
      tgtList[tgtLoc.index] = readySource;
    } else {
      // --- MOVE (Source -> Empty Target) ---
      if (tgtLoc.index >= tgtList.length) {
        tgtList.push(readySource);
      } else {
        tgtList[tgtLoc.index] = readySource;
      }

      // Mark Source as Null (to be removed later) to preserve indices for subsequent iterations
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
    // If same save, sourceBoxes AND targetBoxes point to the same arrays, so cleaning one cleans the "other".
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
  targetLoc
) {
  return transferPokemonBatch(sourceData, targetData, [sourceLoc], targetLoc);
}
