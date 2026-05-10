/**
 * pokemonEditorModal.js — Full Pokémon Editor Modal
 * Vanilla JS port of PokemonEditorModal.tsx
 *
 * FIX: All hardcoded dark-theme classes replaced with theme-aware
 * light/dark variants using Tailwind's `dark:` prefix strategy.
 * The modal now correctly adapts to the app's light/dark mode.
 */

import { Events } from '../../state/eventBus.js';
import { POKEMON_NAMES } from '../../data/pokemonNames.js';
import { MOVES_LIST, MOVES_PP, getMoveName } from '../../data/moves.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { GEN1_BASE_STATS, GEN1_CATCH_RATES } from '../../data/baseStats.js';
import { getGrowthRate, getLevelFromExp, getExpAtLevel } from '../../data/experience.js';
import { TYPE_COLORS } from '../../data/gameData.js';
import { GEN1_INTERNAL_TO_DEX } from '../../data/offsets.js';
import { GEN1_TYPE_ID_MAP } from '../../data/pokemonTypes.js';
import { POKEDEX_ENTRIES } from '../../data/pokedexEntries.js';
import { calculateGen1Stat } from '../../engine/statCalculator.js';
import { createPk1Binary } from '../../engine/writer.js';

const GAME_COLORS = { red: '#FF3B3B', blue: '#3B4CCA', yellow: '#FFD733' };
const STAT_KEYS = ['hp', 'attack', 'defense', 'speed', 'special'];
const STAT_LABELS = { hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spe', special: 'Spc' };

let localMon = null, isDirty = false, editorMeta = null;

/**
 * Normalize a Pokemon object from parser format to editor format.
 * The parser stores:
 *   - originalTrainerName / originalTrainerId (editor uses otName / otId)
 *   - moves: string[], moveIds: number[], movePp: number[], movePpUps: number[]
 * The editor expects:
 *   - otName / otId
 *   - moves: {id, pp, ppUps}[]
 */
function normalizeForEditor(mon) {
  const normalized = { ...mon };

  // OT Name: parser uses originalTrainerName
  if (!normalized.otName && normalized.originalTrainerName) {
    normalized.otName = normalized.originalTrainerName;
  }

  // OT ID: parser uses originalTrainerId
  if (!normalized.otId && normalized.originalTrainerId) {
    normalized.otId = normalized.originalTrainerId;
  }

  // Moves: parser has separate arrays (moveIds, movePp, movePpUps, moves as strings)
  // Editor expects moves = [{id, pp, ppUps}, ...]
  if (normalized.moveIds && Array.isArray(normalized.moveIds)) {
    normalized.moves = normalized.moveIds.map((id, i) => ({
      id: id || 0,
      pp: (normalized.movePp && normalized.movePp[i]) || 0,
      ppUps: (normalized.movePpUps && normalized.movePpUps[i]) || 0
    }));
  } else if (!normalized.moves || !normalized.moves.length || typeof normalized.moves[0] === 'string') {
    // Fallback: ensure moves is an array of objects
    normalized.moves = [0,1,2,3].map(i => {
      const existing = normalized.moves?.[i];
      if (existing && typeof existing === 'object') return existing;
      return { id: 0, pp: 0, ppUps: 0 };
    });
  }

  return normalized;
}

/**
 * Denormalize a Pokemon object from editor format back to parser/writer format.
 * Ensures originalTrainerName, originalTrainerId, moveIds, movePp, movePpUps
 * are all set correctly for the writer.
 */
function denormalizeForWriter(mon) {
  const denormed = { ...mon };

  // Sync OT Name
  if (mon.otName !== undefined) {
    denormed.originalTrainerName = mon.otName;
  }

  // Sync OT ID
  if (mon.otId !== undefined) {
    denormed.originalTrainerId = mon.otId;
  }

  // Sync species-related fields that the writer needs
  // The writer uses dexId -> DEX_TO_INTERNAL lookup, so ensure dexId is current
  // Also ensure speciesName is up to date for display
  if (mon.dexId) {
    denormed.speciesName = POKEMON_NAMES[mon.dexId] || mon.speciesName || '';
  }

  // Sync moves: editor format {id, pp, ppUps}[] → parser format
  if (mon.moves && Array.isArray(mon.moves) && typeof mon.moves[0] === 'object') {
    denormed.moveIds = mon.moves.map(m => m.id || 0);
    denormed.movePp = mon.moves.map(m => m.pp || 0);
    denormed.movePpUps = mon.moves.map(m => m.ppUps || 0);
    denormed.moves = mon.moves.map(m => getMoveName(m.id || 0)); // string names for display
  }

  return denormed;
}

export function initPokemonEditorModal(container, eventBus, theme, appState) {
  eventBus.on(Events.OPEN_POKEMON_EDITOR, (payload) => {
    localMon = normalizeForEditor(JSON.parse(JSON.stringify(payload.mon)));
    editorMeta = { source: payload.source, index: payload.index, boxIndex: payload.boxIndex };
    isDirty = false;
    render(container, eventBus, theme, appState);
  });
  eventBus.on(Events.CLOSE_POKEMON_EDITOR, () => { container.innerHTML = ''; localMon = null; });
}

function markDirty(container, eventBus) {
  if (!isDirty) { isDirty = true; const dot = document.getElementById('pe-dirty-dot'); if (dot) dot.classList.remove('hidden'); }
}

function calcAllStats(mon) {
  const bs = GEN1_BASE_STATS[mon.dexId] || { hp:50, atk:50, def:50, spe:50, spc:50 };
  const lv = mon.level || 1;
  mon.maxHp = calculateGen1Stat(bs.hp, mon.iv.hp, mon.ev.hp, lv, true);
  // Only reset HP to maxHp if HP is 0 or exceeds maxHp (e.g. species change)
  if (!mon.hp || mon.hp > mon.maxHp) mon.hp = mon.maxHp;
  mon.attack = calculateGen1Stat(bs.atk, mon.iv.attack, mon.ev.attack, lv, false);
  mon.defense = calculateGen1Stat(bs.def, mon.iv.defense, mon.ev.defense, lv, false);
  mon.speed = calculateGen1Stat(bs.spe, mon.iv.speed, mon.ev.speed, lv, false);
  const spc = calculateGen1Stat(bs.spc, mon.iv.special, mon.ev.special, lv, false);
  mon.special = spc; mon.spAtk = spc; mon.spDef = spc;
  return { bs, stats: { hp: mon.maxHp, atk: mon.attack, def: mon.defense, spe: mon.speed, spAtk: spc, spDef: spc } };
}

function typeBadges(dexId) {
  return getPokemonTypes(dexId).map(t =>
    `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background:${TYPE_COLORS[t]||'#999'}">${t}</span>`
  ).join(' ');
}

function filteredList(items, query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return items.filter(n => n.toLowerCase().includes(q)).slice(0, 12);
}

function autoCompleteHTML(id, list, value, placeholder) {
  return `<div class="relative">
    <input id="${id}" type="text" value="${value}" placeholder="${placeholder}"
      class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
    <div id="${id}-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
  </div>`;
}

function setupAutoComplete(inputId, items, onSelect, container) {
  const inp = document.getElementById(inputId); const dd = document.getElementById(inputId + '-dd');
  if (!inp || !dd) return;
  inp.addEventListener('input', () => {
    const matches = filteredList(items, inp.value);
    if (!matches.length) { dd.classList.add('hidden'); return; }
    dd.innerHTML = matches.map((m,i) => `<div class="px-3 py-1.5 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 cursor-pointer" data-idx="${i}">${m}</div>`).join('');
    dd.classList.remove('hidden');
    dd.querySelectorAll('[data-idx]').forEach(el => el.addEventListener('click', () => {
      onSelect(items.indexOf(el.textContent)); inp.value = el.textContent; dd.classList.add('hidden');
    }));
  });
  inp.addEventListener('blur', () => setTimeout(() => dd.classList.add('hidden'), 150));
}

function render(container, eventBus, theme, appState) {
  const gameTheme = theme?.getGameTheme();
  const bgColor = gameTheme?.color || GAME_COLORS[editorMeta?.source === 'party' ? 'red' : 'blue'] || '#3B4CCA';
  const { bs, stats } = calcAllStats(localMon);
  const dexId = localMon.dexId || 0;
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
  const isYellow = appState?.getActiveTab()?.version === 'Yellow';

  container.innerHTML = `
  <div class="fixed inset-0 z-[700] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="pe-backdrop"></div>
    <div class="relative w-full max-w-6xl bg-white dark:bg-gray-900/95 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in-95 flex flex-col max-h-[95vh]">
      <!-- HEADER (always uses game color background, so text stays white) -->
      <div class="flex flex-wrap items-center gap-2 px-4 py-3" style="background:${bgColor}">
        <input id="pe-nick" type="text" value="${localMon.nickname || POKEMON_NAMES[dexId] || ''}" maxlength="10"
          class="bg-transparent border-b-2 border-white/30 text-2xl lg:text-3xl font-black italic text-white focus:outline-none focus:border-white/60 w-36 placeholder-white/30" placeholder="Nickname">
        <div class="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
          <span class="text-white/70 text-xs font-bold">Lv</span>
          <input id="pe-level" type="number" min="1" max="100" value="${localMon.level||1}"
            class="w-12 bg-transparent text-white text-sm font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
        </div>
        <div class="flex-1"></div>
        <span id="pe-dirty-dot" class="hidden flex items-center gap-1 text-yellow-300 text-xs font-bold animate-pulse"><span class="w-2 h-2 bg-yellow-300 rounded-full"></span>Unsaved</span>
        <button id="pe-dex" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Pokédex Entry"><i data-lucide="book-open" class="w-5 h-5 text-white"></i></button>
        <button id="pe-export" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Export .pk1"><i data-lucide="download" class="w-5 h-5 text-white"></i></button>
        <button id="pe-save" class="px-3 py-1.5 bg-white text-gray-900 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Save</button>
        <button id="pe-close" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><i data-lucide="x" class="w-5 h-5 text-white"></i></button>
      </div>

      <!-- CONTENT -->
      <div class="overflow-y-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 flex-1">

        <!-- LEFT: Identity -->
        <div class="lg:col-span-4 space-y-4">
          <div class="flex justify-center">
            <img id="pe-sprite" src="${spriteUrl}" alt="${POKEMON_NAMES[dexId]||'Pokémon'}"
              class="w-32 h-32 pixelated hover:scale-110 transition-transform cursor-pointer" onerror="this.style.display='none'">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Species</label>
            ${autoCompleteHTML('pe-species', POKEMON_NAMES, POKEMON_NAMES[dexId]||'', 'Search species...')}
          </div>
          <div id="pe-types" class="flex gap-2 flex-wrap">${typeBadges(dexId)}</div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">OT Name</label>
            <input id="pe-ot" type="text" value="${localMon.otName||''}" maxlength="7"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">OT Trainer ID</label>
            <input id="pe-otid" type="number" min="0" max="65535" value="${localMon.otId||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Experience</label>
            <input id="pe-exp" type="number" min="0" max="2700000" value="${localMon.exp||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Growth: ${getGrowthRate(dexId)} · Lv from EXP: ${getLevelFromExp(localMon.exp||0, getGrowthRate(dexId))}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Pokérus</label>
            <input id="pe-pokerus" type="number" min="0" max="255" value="${localMon.pokerus||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>
        </div>

        <!-- MIDDLE: Stats -->
        <div class="lg:col-span-4 space-y-4">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">IVs <span class="text-gray-400 dark:text-gray-500 font-normal">(0-15)</span></h3>
          ${STAT_KEYS.map(k => `<div class="flex items-center gap-2">
            <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${STAT_LABELS[k]}</span>
            <input type="range" min="0" max="15" value="${localMon.iv[k]||0}" data-iv="${k}" class="pe-iv-range flex-1 accent-yellow-400 h-1.5">
            <input type="number" min="0" max="15" value="${localMon.iv[k]||0}" data-ivn="${k}"
              class="w-12 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>`).join('')}

          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">EVs <span class="text-gray-400 dark:text-gray-500 font-normal">(0-65535)</span></h3>
          ${STAT_KEYS.map(k => `<div class="flex items-center gap-2">
            <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${STAT_LABELS[k]}</span>
            <input type="range" min="0" max="65535" value="${localMon.ev[k]||0}" data-ev="${k}" class="pe-ev-range flex-1 accent-green-400 h-1.5">
            <input type="number" min="0" max="65535" value="${localMon.ev[k]||0}" data-evn="${k}"
              class="w-16 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>`).join('')}

          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">Calculated Stats</h3>
          <div class="grid grid-cols-3 gap-2 text-center">
            ${[['HP',stats.hp,bs.hp],['Atk',stats.atk,bs.atk],['Def',stats.def,bs.def],['Spe',stats.spe,bs.spe],['SpA',stats.spAtk,bs.spc],['SpD',stats.spDef,bs.spc]].map(([l,v,b])=>
              `<div class="bg-gray-100 dark:bg-white/5 rounded-lg p-2"><div class="text-lg font-black text-gray-900 dark:text-white">${v}</div><div class="text-xs text-gray-400 dark:text-gray-500">${l} <span class="text-gray-300 dark:text-gray-600">(${b})</span></div></div>`
            ).join('')}
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-600 text-center">Base stats in parentheses</p>
        </div>

        <!-- RIGHT: Moves -->
        <div class="lg:col-span-4 space-y-4">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">Moves</h3>
          ${[0,1,2,3].map(i => {
            const m = localMon.moves?.[i] || { id:0, pp:0, ppUps:0 };
            const basePP = MOVES_PP[m.id] || 0;
            const maxPP = basePP + Math.floor(basePP * (m.ppUps||0) / 5);
            return `<div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 dark:text-gray-500 font-bold w-5">#${i+1}</span>
                ${autoCompleteHTML(`pe-move-${i}`, MOVES_LIST, MOVES_LIST[m.id]||'-', 'Move...')}
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-gray-500 dark:text-gray-400">PP: <span class="text-gray-900 dark:text-white font-bold" id="pe-pp-${i}">${m.pp||0}</span>/${maxPP}</span>
                <label class="text-gray-500 dark:text-gray-400">PP Ups:
                  <input type="number" min="0" max="3" value="${m.ppUps||0}" data-ppups="${i}"
                    class="w-10 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                </label>
              </div>
            </div>`;
          }).join('')}

          <div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2 mt-4">
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Catch Rate / Friendship</label>
            <input id="pe-catchrate" type="number" min="0" max="255" value="${localMon.catchRate ?? GEN1_CATCH_RATES[dexId] ?? 0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
            ${isYellow ? '<p class="text-xs text-yellow-600 dark:text-yellow-400/70">Yellow: Pikachu friendship value</p>' : ''}
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/50">
        <button id="pe-cancel" class="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
        <button id="pe-save2" class="px-6 py-2 text-sm font-black bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Save Changes</button>
      </div>
    </div>
  </div>
  <!-- Dex entry popup (hidden) -->
  <div id="pe-dex-popup" class="fixed inset-0 z-[800] items-center justify-center hidden">
    <div class="absolute inset-0 bg-black/50" id="pe-dex-close"></div>
    <div class="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 max-w-md mx-auto mt-24 shadow-2xl">
      <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2">#${dexId} ${POKEMON_NAMES[dexId]||''}</h3>
      <p id="pe-dex-text" class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"></p>
    </div>
  </div>`;

  if (window.lucide) window.lucide.createIcons();

  // --- Autocomplete setup ---
  setupAutoComplete('pe-species', POKEMON_NAMES, (idx) => {
    if (idx > 0 && idx <= 151) {
      localMon.dexId = idx;
      // Update species name
      localMon.speciesName = POKEMON_NAMES[idx] || '';
      // Update internal species ID (reverse lookup from dex ID)
      const internalIdx = GEN1_INTERNAL_TO_DEX.indexOf(idx);
      if (internalIdx >= 0) localMon.speciesId = internalIdx;
      // Update types
      const types = getPokemonTypes(idx);
      localMon.type1Name = types[0] || 'Normal';
      localMon.type2Name = types[1] || types[0] || 'Normal';
      localMon.type1 = GEN1_TYPE_ID_MAP[localMon.type1Name] ?? 0;
      localMon.type2 = GEN1_TYPE_ID_MAP[localMon.type2Name] ?? 0;
      // Recalculate stats with new species base stats immediately
      calcAllStats(localMon);
      // Also reset catch rate to the new species default
      localMon.catchRate = GEN1_CATCH_RATES[idx] ?? localMon.catchRate;
      // Update nickname if it matched the old species name
      if (!localMon.isNicknamed && localMon.nickname) {
        localMon.nickname = localMon.speciesName;
      }
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    }
  }, container);
  [0,1,2,3].forEach(i => {
    setupAutoComplete(`pe-move-${i}`, MOVES_LIST, (idx) => {
      if (!localMon.moves) localMon.moves = [{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0}];
      const basePP = MOVES_PP[idx] || 0;
      localMon.moves[i] = { id: idx, pp: basePP, ppUps: 0 };
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    }, container);
  });

  // --- Input bindings ---
  const bind = (id, prop, parser = v => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const val = parser(el.value);
      if (prop === 'nickname') localMon.nickname = val;
      else if (prop === 'level') { localMon.level = Math.max(1, Math.min(100, val)); recalcAndRefresh(container, eventBus, theme, appState); }
      else if (prop === 'exp') { localMon.exp = Math.max(0, val); localMon.level = getLevelFromExp(localMon.exp, getGrowthRate(localMon.dexId)); recalcAndRefresh(container, eventBus, theme, appState); }
      else if (prop === 'otName') localMon.otName = val;
      else if (prop === 'otId') localMon.otId = Math.max(0, Math.min(65535, val));
      else if (prop === 'pokerus') localMon.pokerus = Math.max(0, Math.min(255, val));
      else if (prop === 'catchRate') localMon.catchRate = Math.max(0, Math.min(255, val));
      markDirty(container, eventBus);
    });
  };
  bind('pe-nick', 'nickname'); bind('pe-level', 'level', Number); bind('pe-exp', 'exp', Number);
  bind('pe-ot', 'otName'); bind('pe-otid', 'otId', Number); bind('pe-pokerus', 'pokerus', Number);
  bind('pe-catchrate', 'catchRate', Number);

  // IV sliders & inputs
  document.querySelectorAll('.pe-iv-range').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.iv; const v = parseInt(el.value);
      localMon.iv[k] = v;
      const numEl = document.querySelector(`[data-ivn="${k}"]`); if (numEl) numEl.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });
  document.querySelectorAll('[data-ivn]').forEach(el => {
    el.addEventListener('change', () => {
      const k = el.dataset.ivn; const v = Math.max(0, Math.min(15, parseInt(el.value)||0));
      localMon.iv[k] = v; el.value = v;
      const range = document.querySelector(`[data-iv="${k}"]`); if (range) range.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // EV sliders & inputs
  document.querySelectorAll('.pe-ev-range').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.ev; const v = parseInt(el.value);
      localMon.ev[k] = v;
      const numEl = document.querySelector(`[data-evn="${k}"]`); if (numEl) numEl.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });
  document.querySelectorAll('[data-evn]').forEach(el => {
    el.addEventListener('change', () => {
      const k = el.dataset.evn; const v = Math.max(0, Math.min(65535, parseInt(el.value)||0));
      localMon.ev[k] = v; el.value = v;
      const range = document.querySelector(`[data-ev="${k}"]`); if (range) range.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // PP Ups
  document.querySelectorAll('[data-ppups]').forEach(el => {
    el.addEventListener('change', () => {
      const i = parseInt(el.dataset.ppups); const v = Math.max(0, Math.min(3, parseInt(el.value)||0));
      if (localMon.moves?.[i]) { localMon.moves[i].ppUps = v; const basePP = MOVES_PP[localMon.moves[i].id]||0; localMon.moves[i].pp = basePP + Math.floor(basePP*v/5); }
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // --- Buttons ---
  const doSave = () => {
    // Denormalize back to parser/writer format before saving
    const denormedMon = denormalizeForWriter(localMon);
    const payload = { ...denormedMon, _source: editorMeta.source, _index: editorMeta.index, _boxIndex: editorMeta.boxIndex };
    eventBus.emit(Events.POKEMON_UPDATED, payload);
    eventBus.emit(Events.CLOSE_POKEMON_EDITOR);
  };
  const doClose = () => { eventBus.emit(Events.CLOSE_POKEMON_EDITOR); };

  document.getElementById('pe-save')?.addEventListener('click', doSave);
  document.getElementById('pe-save2')?.addEventListener('click', doSave);
  document.getElementById('pe-cancel')?.addEventListener('click', doClose);
  document.getElementById('pe-close')?.addEventListener('click', doClose);
  document.getElementById('pe-backdrop')?.addEventListener('click', doClose);

  // Export .pk1
  document.getElementById('pe-export')?.addEventListener('click', () => {
    try {
      const denormedMon = denormalizeForWriter(localMon);
      const data = createPk1Binary(denormedMon);
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${localMon.nickname || POKEMON_NAMES[localMon.dexId] || 'pokemon'}.pk1`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Failed to export .pk1', err);
    }
  });

  // Pokédex entry
  document.getElementById('pe-dex')?.addEventListener('click', () => {
    const entry = POKEDEX_ENTRIES[localMon.dexId];
    const popup = document.getElementById('pe-dex-popup');
    const text = document.getElementById('pe-dex-text');
    if (entry && popup && text) {
      const ver = appState?.getActiveTab()?.version;
      text.textContent = (ver === 'Yellow' && entry.yellow) ? entry.yellow : (entry.red_blue || 'No entry available.');
      popup.classList.remove('hidden'); popup.classList.add('flex');
    }
  });
  document.getElementById('pe-dex-close')?.addEventListener('click', () => {
    const popup = document.getElementById('pe-dex-popup');
    if (popup) { popup.classList.add('hidden'); popup.classList.remove('flex'); }
  });
}

function recalcAndRefresh(container, eventBus, theme, appState) {
  calcAllStats(localMon);
  // Update just the stats display
  const { bs, stats } = calcAllStats(localMon);
  const labels = ['HP','Atk','Def','Spe','SpA','SpD'];
  const vals = [stats.hp, stats.atk, stats.def, stats.spe, stats.spAtk, stats.spDef];
  const bases = [bs.hp, bs.atk, bs.def, bs.spe, bs.spc, bs.spc];
  container.querySelectorAll('.grid.grid-cols-3 > div').forEach((el, i) => {
    if (i < 6) {
      el.querySelector('.text-lg').textContent = vals[i];
      const label = el.querySelector('.text-xs');
      if (label) label.innerHTML = `${labels[i]} <span class="text-gray-300 dark:text-gray-600">(${bases[i]})</span>`;
    }
  });
  // Update level from exp display
  const levelInput = document.getElementById('pe-level');
  if (levelInput) levelInput.value = localMon.level;
}

function refreshAll(container, eventBus, theme, appState) {
  render(container, eventBus, theme, appState);
}
