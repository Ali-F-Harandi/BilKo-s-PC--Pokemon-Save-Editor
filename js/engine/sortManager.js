/**
 * sortManager.js — PC Box Sorting Logic
 *
 * Ported from lib/utils/sortManager.ts
 * Supports single-box, all-individual, all-global, and Living Dex sorting.
 */

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
 * Strict Living Dex Logic
 */
function sortLivingDex(
  targetSave,
  externalSaves
) {
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

  // Initialize Target Boxes (12 Boxes)
  // Boxes 0-7 (1-8): Living Dex (ID 1-151)
  // Boxes 8-11 (9-12): Overflow
  const newBoxes = Array.from({ length: 12 }, () => []);

  const dexKeepers = new Map(); // ID -> Candidate
  const overflow = [];

  // Group Target Pokemon by ID
  const targetGroups = new Map();

  targetCandidates.forEach(c => {
    if (c.mon.dexId >= 1 && c.mon.dexId <= 151) {
      if (!targetGroups.has(c.mon.dexId)) targetGroups.set(c.mon.dexId, []);
      targetGroups.get(c.mon.dexId).push(c);
    } else {
      // Glitch mons or outside gen 1 range immediately to overflow
      overflow.push(c);
    }
  });

  // Select Keepers from Target Save
  for (let id = 1; id <= 151; id++) {
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
  // Only if externalSaves are provided (checkbox checked)

  const usedExternalCandidates = new Set();

  if (externalSaves.length > 0) {
    for (let id = 1; id <= 151; id++) {
      // If we ALREADY have a keeper from Target save, skip.
      // We do NOT replace Target mons with External mons, nor do we move extra external mons.
      if (dexKeepers.has(id)) continue;

      // Slot is empty. Look in external saves.
      let bestExternal = null;

      for (const ext of externalSaves) {
        // Collect matching ID from this save
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
          // Pick best from this save
          matches.sort((a, b) => b.mon.level - a.mon.level);
          const candidate = matches[0];

          // Compare with current best external found so far
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
  // Box 0: 1-20, Box 1: 21-40 ...
  for (let id = 1; id <= 151; id++) {
    const keeper = dexKeepers.get(id);
    if (keeper) {
      const boxIndex = Math.floor((id - 1) / 20);
      if (boxIndex < 8) {
        newBoxes[boxIndex].push(keeper.mon);
      } else {
        // Should not happen mathematically for 1-151, but safety
        overflow.push(keeper);
      }
    }
  }

  // 3b. Place Overflow (Target Save Only)
  // Sort overflow by ID for neatness
  overflow.sort((a, b) => a.mon.dexId - b.mon.dexId);

  // Fill Boxes 8-11
  let currentOvBox = 8;
  for (const item of overflow) {
    while (currentOvBox < 12 && newBoxes[currentOvBox].length >= 20) {
      currentOvBox++;
    }
    if (currentOvBox < 12) {
      newBoxes[currentOvBox].push(item.mon);
    } else {
      console.warn("Storage Full! Dropping pokemon:", item.mon.nickname);
    }
  }

  // --- Phase 4: Party Safety ---
  // Rule: Party must not be empty.
  // Strategy: Take the LAST available Pokemon from Overflow.
  // If Overflow empty, take LAST Pokemon from Living Dex.

  let partyMon = undefined;

  // Try finding one in overflow (Boxes 11 -> 8)
  for (let i = 11; i >= 8; i--) {
    if (newBoxes[i].length > 0) {
      partyMon = newBoxes[i].pop();
      if (partyMon) break;
    }
  }

  // If still no party mon, steal from Living Dex (Boxes 7 -> 0)
  if (!partyMon) {
    for (let i = 7; i >= 0; i--) {
      if (newBoxes[i].length > 0) {
        partyMon = newBoxes[i].pop();
        if (partyMon) break;
      }
    }
  }

  // Ensure Party Mon is set to Party Mode
  const finalParty = [];
  if (partyMon) {
    // Recalculate stats for Party if needed (Box mons might rely on Base Stats)
    // Ideally we assume the stats are valid or use helper, simply flagging isParty=true triggers recalc in UI usually
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
 * Main Sort Function
 */
export function sortPCBoxes(
  targetSave,
  scope,
  criteria,
  direction,
  externalSaves = []
) {
  if (scope === 'living-dex') {
    return sortLivingDex(targetSave, externalSaves);
  }

  // -- Standard Sorting (Current Save Only) --

  let newBoxes = targetSave.pcBoxes.map(box => [...box]); // Deep clone

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

    newBoxes = Array.from({ length: 12 }, () => []);
    for (let i = 0; i < 12; i++) {
      const start = i * 20;
      const end = start + 20;
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
