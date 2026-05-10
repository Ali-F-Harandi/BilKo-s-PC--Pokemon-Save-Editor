/**
 * sortManager.js — PC Box Sorting Logic (Generation-Agnostic)
 *
 * Refactored: Now queries the adapter for box count, pokedex size, and box capacity
 * instead of hard-coding 12 boxes / 151 species. Accepts an adapter parameter.
 */

import { GenerationRegistry } from '../core/GenerationRegistry.js';
import { AdapterFactory } from '../core/AdapterFactory.js';

// Lazy adapter factory for fallback
let _adapterFactory = null;
function getAdapterFactory() {
    if (!_adapterFactory) {
        const registry = new GenerationRegistry();
        _adapterFactory = new AdapterFactory(registry);
    }
    return _adapterFactory;
}

/**
 * Comparator function for Pokemon Stats
 */
export const comparePokemon = (a, b, criteria, direction) => {
  let valA;
  let valB;

  if (a.speciesId === 0 && b.speciesId === 0) return 0;
  if (a.speciesId === 0) return 1;
  if (b.speciesId === 0) return -1;

  switch (criteria) {
    case 'id': valA = a.dexId; valB = b.dexId; break;
    case 'species': valA = a.speciesName; valB = b.speciesName; break;
    case 'nickname': valA = a.nickname; valB = b.nickname; break;
    case 'level': valA = a.level; valB = b.level; break;
    case 'type':
      valA = a.type1Name; valB = b.type1Name;
      if (valA === valB) { valA = a.type2Name; valB = b.type2Name; }
      break;
    default: return 0;
  }

  if (valA < valB) return direction === 'asc' ? -1 : 1;
  if (valA > valB) return direction === 'asc' ? 1 : -1;
  return 0;
};

export const sortList = (list, criteria, direction) => {
  const actualMons = list.filter(p => p.speciesId !== 0);
  actualMons.sort((a, b) => comparePokemon(a, b, criteria, direction));
  return actualMons;
};

/**
 * Strict Living Dex Logic (Generation-Agnostic)
 * Uses adapter to determine pokedex size, box count, and box capacity.
 */
function sortLivingDex(
  targetSave,
  externalSaves,
  adapter = null
) {
  // Get adapter from save data if not provided
  if (!adapter) {
    const genId = targetSave?.generationId || targetSave?.generation || 1;
    adapter = getAdapterFactory().createForGeneration(genId);
  }

  const pokedexSize = adapter ? adapter.getPokedexSize() : 151;
  const boxCount = adapter ? adapter.getBoxCount() : 12;
  const boxCapacity = adapter ? adapter.getBoxCapacity() : 20;

  // --- Phase 1: Collect ALL Pokemon from Target Save ONLY ---
  const targetCandidates = [];

  targetSave.party.forEach((mon, idx) => {
    targetCandidates.push({ mon: { ...mon, isParty: false }, sourceTabId: 'current', location: 'party', index: idx });
  });
  targetSave.pcBoxes.forEach((box, boxIdx) => {
    box.forEach((mon, idx) => {
      targetCandidates.push({ mon: { ...mon, isParty: false }, sourceTabId: 'current', location: 'box', boxIndex: boxIdx, index: idx });
    });
  });

  // Initialize Target Boxes
  // Boxes for Living Dex: ceil(pokedexSize / boxCapacity) boxes for dex entries
  const livingDexBoxCount = Math.ceil(pokedexSize / boxCapacity);
  const overflowStartBox = livingDexBoxCount;
  const newBoxes = Array.from({ length: boxCount }, () => []);

  const dexKeepers = new Map(); // ID -> Candidate
  const overflow = [];

  // Group Target Pokemon by ID
  const targetGroups = new Map();

  targetCandidates.forEach(c => {
    if (c.mon.dexId >= 1 && c.mon.dexId <= pokedexSize) {
      if (!targetGroups.has(c.mon.dexId)) targetGroups.set(c.mon.dexId, []);
      targetGroups.get(c.mon.dexId).push(c);
    } else {
      // Glitch mons or outside range go to overflow
      overflow.push(c);
    }
  });

  // Select Keepers from Target Save
  for (let id = 1; id <= pokedexSize; id++) {
    const group = targetGroups.get(id);
    if (group && group.length > 0) {
      // Sort by Level Descending (Higher level wins)
      group.sort((a, b) => b.mon.level - a.mon.level);

      // Winner takes the slot
      dexKeepers.set(id, group[0]);

      // Rest go to overflow
      for (let i = 1; i < group.length; i++) {
        overflow.push(group[i]);
      }
    }
  }

  // --- Phase 2: Fill Gaps from External Saves (Move Logic) ---
  const usedExternalCandidates = new Set();

  if (externalSaves.length > 0) {
    for (let id = 1; id <= pokedexSize; id++) {
      if (dexKeepers.has(id)) continue;

      let bestExternal = null;

      for (const ext of externalSaves) {
        const matches = [];

        ext.data.party.forEach((mon, idx) => {
          if (mon.dexId === id) matches.push({ mon: { ...mon, isParty: false }, sourceTabId: ext.id, location: 'party', index: idx });
        });
        ext.data.pcBoxes.forEach((box, boxIdx) => {
          box.forEach((mon, idx) => {
            if (mon.dexId === id) matches.push({ mon: { ...mon, isParty: false }, sourceTabId: ext.id, location: 'box', boxIndex: boxIdx, index: idx });
          });
        });

        if (matches.length > 0) {
          matches.sort((a, b) => b.mon.level - a.mon.level);
          const candidate = matches[0];

          if (!bestExternal || candidate.mon.level > bestExternal.mon.level) {
            bestExternal = candidate;
          }
        }
      }

      if (bestExternal) {
        dexKeepers.set(id, bestExternal);
        usedExternalCandidates.add(bestExternal);
      }
    }
  }

  // --- Phase 3: Construct Boxes ---

  // 3a. Place Keepers (Living Dex)
  for (let id = 1; id <= pokedexSize; id++) {
    const keeper = dexKeepers.get(id);
    if (keeper) {
      const boxIndex = Math.floor((id - 1) / boxCapacity);
      if (boxIndex < livingDexBoxCount) {
        newBoxes[boxIndex].push(keeper.mon);
      } else {
        overflow.push(keeper);
      }
    }
  }

  // 3b. Place Overflow (Target Save Only)
  overflow.sort((a, b) => a.mon.dexId - b.mon.dexId);

  let currentOvBox = overflowStartBox;
  for (const item of overflow) {
    while (currentOvBox < boxCount && newBoxes[currentOvBox].length >= boxCapacity) {
      currentOvBox++;
    }
    if (currentOvBox < boxCount) {
      newBoxes[currentOvBox].push(item.mon);
    } else {
      console.warn("Storage Full! Dropping pokemon:", item.mon.nickname);
    }
  }

  // --- Phase 4: Party Safety ---
  let partyMon = undefined;

  for (let i = boxCount - 1; i >= overflowStartBox; i--) {
    if (newBoxes[i].length > 0) {
      partyMon = newBoxes[i].pop();
      if (partyMon) break;
    }
  }

  if (!partyMon) {
    for (let i = overflowStartBox - 1; i >= 0; i--) {
      if (newBoxes[i].length > 0) {
        partyMon = newBoxes[i].pop();
        if (partyMon) break;
      }
    }
  }

  const finalParty = [];
  if (partyMon) {
    finalParty.push({ ...partyMon, isParty: true });
  }

  // --- Phase 5: Calculate Removals ---
  const externalRemovals = new Map();

  usedExternalCandidates.forEach(c => {
    if (c.sourceTabId !== 'current') {
      if (!externalRemovals.has(c.sourceTabId)) {
        externalRemovals.set(c.sourceTabId, []);
      }
      externalRemovals.get(c.sourceTabId).push({
        location: c.location,
        boxIndex: c.boxIndex,
        index: c.index
      });
    }
  });

  return {
    success: true,
    newData: {
      ...targetSave,
      pcBoxes: newBoxes,
      party: finalParty,
      partyCount: finalParty.length,
      currentBoxPokemon: newBoxes[targetSave.currentBoxId] || [],
      currentBoxCount: (newBoxes[targetSave.currentBoxId] || []).length
    },
    externalRemovals
  };
}

/**
 * Main Sort Function (Generation-Agnostic)
 */
export function sortPCBoxes(
  targetSave,
  scope,
  criteria,
  direction,
  externalSaves = [],
  adapter = null
) {
  // Get adapter from save data if not provided
  if (!adapter) {
    const genId = targetSave?.generationId || targetSave?.generation || 1;
    adapter = getAdapterFactory().createForGeneration(genId);
  }

  const boxCount = adapter ? adapter.getBoxCount() : 12;
  const boxCapacity = adapter ? adapter.getBoxCapacity() : 20;

  if (scope === 'living-dex') {
    return sortLivingDex(targetSave, externalSaves, adapter);
  }

  // -- Standard Sorting (Current Save Only) --

  let newBoxes = targetSave.pcBoxes.map(box => [...box]);

  if (scope === 'single') {
    const boxIdx = targetSave.currentBoxId;
    newBoxes[boxIdx] = sortList(newBoxes[boxIdx], criteria, direction);
  }
  else if (scope === 'all-indiv') {
    for (let i = 0; i < newBoxes.length; i++) {
      newBoxes[i] = sortList(newBoxes[i], criteria, direction);
    }
  }
  else if (scope === 'all-global') {
    let allMons = [];
    newBoxes.forEach(box => allMons.push(...box));
    allMons = sortList(allMons, criteria, direction);

    newBoxes = Array.from({ length: boxCount }, () => []);
    for (let i = 0; i < boxCount; i++) {
      const start = i * boxCapacity;
      const end = start + boxCapacity;
      if (start < allMons.length) {
        newBoxes[i] = allMons.slice(start, end);
      }
    }
  }

  return {
    success: true,
    newData: {
      ...targetSave,
      pcBoxes: newBoxes,
      currentBoxPokemon: newBoxes[targetSave.currentBoxId],
      currentBoxCount: newBoxes[targetSave.currentBoxId].length
    }
  };
}
