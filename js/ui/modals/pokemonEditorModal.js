/**
 * pokemonEditorModal.js — Full Pokémon Editor Modal (Schema-Driven)
 *
 * Phase 2+ Refactor: Now fully schema-driven. Reads adapter.getPokemonSchema()
 * and dynamically renders all fields. No more hard-coded Gen1 field layout.
 * The adapter is obtained from the save data's generationId and provides:
 * - getPokemonSchema() → sections/fields for dynamic rendering
 * - getPokemonList(), getMoveList(), getTypeList(), getItemList() → dropdown data
 * - recalculateStats() → stat calculations delegated to adapter
 * - getMovePP(moveId) → PP lookup
 * - All data lookups go through the adapter
 */

import { Events } from '../../state/eventBus.js';
import { CanonicalPokemon } from '../../core/CanonicalModel.js';
import { GenerationRegistry } from '../../core/GenerationRegistry.js';
import { AdapterFactory } from '../../core/AdapterFactory.js';
import { getFieldValidator } from '../../core/validation/FieldValidator.js';

// Lazy adapter factory
let _adapterFactory = null;
function getAdapterFactory() {
    if (!_adapterFactory) {
        const registry = new GenerationRegistry();
        _adapterFactory = new AdapterFactory(registry);
    }
    return _adapterFactory;
}

function getAdapterForGeneration(generationId) {
    return getAdapterFactory().createForGeneration(generationId || 1);
}

const GAME_COLORS = { red: '#FF3B3B', blue: '#3B4CCA', yellow: '#FFD733', gold: '#DAA520', silver: '#C0C0C0', crystal: '#4FD0E7' };

let localMon = null, isDirty = false, editorMeta = null, currentAdapter = null;

/**
 * Normalize a Pokemon object from parser format to editor format.
 * Handles solo-type Pokemon: if type1 === type2, sets type2 to empty (solo-type).
 */
function normalizeForEditor(mon) {
    const normalized = { ...mon };

    if (!normalized.otName && normalized.originalTrainerName) {
        normalized.otName = normalized.originalTrainerName;
    }

    if (!normalized.otId && normalized.originalTrainerId) {
        normalized.otId = normalized.originalTrainerId;
    }

    if (normalized.moveIds && Array.isArray(normalized.moveIds)) {
        normalized.moves = normalized.moveIds.map((id, i) => ({
            id: id || 0,
            pp: (normalized.movePp && normalized.movePp[i]) || 0,
            ppUps: (normalized.movePpUps && normalized.movePpUps[i]) || 0
        }));
    } else if (!normalized.moves || !normalized.moves.length || typeof normalized.moves[0] === 'string') {
        normalized.moves = [0,1,2,3].map(i => {
            const existing = normalized.moves?.[i];
            if (existing && typeof existing === 'object') return existing;
            return { id: 0, pp: 0, ppUps: 0 };
        });
    }

    // Fix solo-type Pokemon: if type1Name === type2Name, set type2 to empty
    // This applies to Gen 1 saves where both type bytes are the same for solo-type Pokemon
    if (normalized.typeNames && normalized.typeNames.length >= 2) {
        if (normalized.typeNames[0] && normalized.typeNames[1] && normalized.typeNames[0] === normalized.typeNames[1]) {
            normalized.typeNames = [normalized.typeNames[0], ''];
            normalized.types = [normalized.types?.[0] ?? 0, 0];
        }
    } else if (normalized.type1Name && normalized.type2Name && normalized.type1Name === normalized.type2Name) {
        // Legacy format with separate type1Name/type2Name fields
        normalized.type2Name = '';
        normalized.typeNames = [normalized.type1Name, ''];
        normalized.types = [normalized.types?.[0] ?? normalized.type1 ?? 0, 0];
    } else if (!normalized.typeNames) {
        // Build typeNames from individual fields
        normalized.typeNames = [normalized.type1Name || normalized.typeNames?.[0] || '', normalized.type2Name || normalized.typeNames?.[1] || ''];
    }

    return normalized;
}

/**
 * Denormalize a Pokemon object from editor format back to parser/writer format.
 * Handles solo-type Pokemon: if type2 is empty, sets type2 = type1 for binary writers
 * (Gen 1/2 binary format requires both type bytes, and solo-type stores same type in both).
 */
function denormalizeForWriter(mon) {
    const denormed = { ...mon };

    if (mon.otName !== undefined) {
        denormed.originalTrainerName = mon.otName;
    }

    if (mon.otId !== undefined) {
        denormed.originalTrainerId = mon.otId;
    }

    if (mon.dexId && currentAdapter) {
        const pokemonList = currentAdapter.getPokemonList();
        denormed.speciesName = pokemonList[mon.dexId] || mon.speciesName || '';
    }

    if (mon.moves && Array.isArray(mon.moves) && typeof mon.moves[0] === 'object') {
        const moveList = currentAdapter ? currentAdapter.getMoveList() : [];
        denormed.moveIds = mon.moves.map(m => m.id || 0);
        denormed.movePp = mon.moves.map(m => m.pp || 0);
        denormed.movePpUps = mon.moves.map(m => m.ppUps || 0);
        denormed.moves = mon.moves.map(m => moveList[m.id] || '-');
    }

    // Handle type denormalization for binary writers
    // Gen 1/2 binary format stores type1 and type2 as separate bytes.
    // For solo-type Pokemon, both bytes should contain the same type ID.
    // In the editor, solo-type has type2Name='' and types[1]=0.
    // We must fill in the correct values for the writer.
    if (mon.typeNames) {
        denormed.type1Name = mon.typeNames[0] || 'Normal';
        // If Type 2 is empty (solo-type), use same type as Type 1 for binary format
        denormed.type2Name = mon.typeNames[1] || mon.typeNames[0] || 'Normal';
    }
    if (mon.types) {
        denormed.type1 = mon.types[0] || 0;
        // If Type 2 is 0/empty (solo-type), use same type as Type 1 for binary format
        denormed.type2 = mon.types[1] || mon.types[0] || 0;
    }
    // Also handle the legacy type1/type2 and type1Name/type2Name fields
    if (mon.type1Name !== undefined) denormed.type1Name = mon.type1Name;
    if (mon.type2Name !== undefined && mon.type2Name !== '') denormed.type2Name = mon.type2Name;
    else if (mon.typeNames && !mon.typeNames[1]) denormed.type2Name = mon.typeNames[0] || 'Normal';

    return denormed;
}

export function initPokemonEditorModal(container, eventBus, theme, appState) {
  eventBus.on(Events.OPEN_POKEMON_EDITOR, (payload) => {
    localMon = normalizeForEditor(JSON.parse(JSON.stringify(payload.mon)));
    editorMeta = { source: payload.source, index: payload.index, boxIndex: payload.boxIndex };
    // Get adapter from the active tab's generation
    const generationId = appState?.getActiveTab()?.data?.generationId || appState?.getActiveTab()?.data?.generation || 1;
    currentAdapter = getAdapterForGeneration(generationId);
    isDirty = false;
    render(container, eventBus, theme, appState);
  });
  eventBus.on(Events.CLOSE_POKEMON_EDITOR, () => { container.innerHTML = ''; localMon = null; currentAdapter = null; });
}

function markDirty(container, eventBus) {
  if (!isDirty) { isDirty = true; const dot = document.getElementById('pe-dirty-dot'); if (dot) dot.classList.remove('hidden'); }
}

function calcAllStats(mon) {
  if (!currentAdapter) return { bs: { hp:50, atk:50, def:50, spe:50, spc:50 }, stats: { hp: 100, atk: 50, def: 50, spe: 50, spAtk: 50, spDef: 50 } };

  const bs = currentAdapter.getBaseStats(mon.dexId) || { hp:50, attack:50, defense:50, speed:50, special:50, spAttack:50, spDefense:50 };
  const lv = mon.level || 1;

  const iv = mon.iv || {};
  const ev = mon.ev || {};

  // Calculate all stats using the adapter
  const spcIv = iv.special !== undefined ? iv.special : (iv.spAttack || 0);
  const spcEv = ev.special !== undefined ? ev.special : (ev.spAttack || 0);

  const maxHp = currentAdapter.calculateStat(bs.hp, iv.hp || 0, ev.hp || 0, lv, true);
  const hp = maxHp;
  const attack = currentAdapter.calculateStat(bs.attack, iv.attack || 0, ev.attack || 0, lv, false);
  const defense = currentAdapter.calculateStat(bs.defense, iv.defense || 0, ev.defense || 0, lv, false);
  const speed = currentAdapter.calculateStat(bs.speed, iv.speed || 0, ev.speed || 0, lv, false);
  const special = currentAdapter.calculateStat(bs.special || bs.spAttack, spcIv, spcEv, lv, false);

  mon.maxHp = maxHp;
  if (!mon.hp || mon.hp > mon.maxHp) mon.hp = mon.maxHp;
  mon.attack = attack;
  mon.defense = defense;
  mon.speed = speed;
  mon.special = special;
  mon.spAtk = special;
  mon.spDef = special;

  // If Gen2+ with split special, calculate separately
  if (currentAdapter.generationId >= 2) {
    mon.spAtk = currentAdapter.calculateStat(bs.spAttack || bs.special, spcIv, spcEv, lv, false);
    mon.spDef = currentAdapter.calculateStat(bs.spDefense || bs.special, spcIv, spcEv, lv, false);
  }

  return {
    bs,
    stats: {
      hp: maxHp, atk: attack, def: defense, spe: speed,
      spAtk: mon.spAtk, spDef: mon.spDef
    }
  };
}

function typeBadges(dexId) {
  if (!currentAdapter) return '';
  const colors = currentAdapter.getTypeColors();

  // Use localMon's typeNames if available (reflects user edits), otherwise fall back to adapter lookup
  if (localMon && localMon.typeNames && localMon.typeNames.length > 0) {
    // Filter out empty/null type names (solo-type Pokemon have typeNames[1] = '')
    // Also filter out duplicates where type1 === type2 (legacy Gen1 data)
    const displayTypes = localMon.typeNames.filter((t, i) => {
      if (!t || t === '') return false; // No empty type badges
      // For index 1, skip if it's the same as type 1 (solo-type)
      if (i === 1 && localMon.typeNames[0] && t === localMon.typeNames[0]) return false;
      return true;
    });
    return displayTypes.map(t =>
      `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background:${colors[t]||'#999'}">${t}</span>`
    ).join(' ');
  }
  // Fallback to adapter lookup
  const types = currentAdapter.getPokemonTypes(dexId);
  return types.filter(t => t && t !== '').map(t =>
    `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background:${colors[t]||'#999'}">${t}</span>`
  ).join(' ');
}

function filteredList(items, query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return items.filter(n => n && n.toLowerCase().includes(q)).slice(0, 12);
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

/**
 * Dynamically render fields from the schema.
 */
function renderSchemaSection(section, localMon, adapter) {
  const pokemonList = adapter.getPokemonList();
  const moveList = adapter.getMoveList();
  const typeList = adapter.getTypeList();
  const itemList = adapter.getItemList();

  let html = `<div class="space-y-3">
    <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">${section.label}</h3>`;

  for (const field of section.fields) {
    // Skip hidden fields
    if (field.type === 'hidden') continue;

    const inputCls = 'w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30';
    const numCls = inputCls + ' [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

    if (field.type === 'select' && field.source === 'pokemonList') {
      const value = pokemonList[localMon.dexId] || '';
      html += `<div>
        <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}</label>
        ${autoCompleteHTML(`pe-schema-${field.key}`, pokemonList, value, 'Search species...')}
      </div>`;
    } else if (field.type === 'select' && field.source === 'typeList') {
      const typeIdx = field.key === 'type1' ? 0 : 1;
      // Determine the current type for this select
      // For Type 2 on solo-type Pokemon (typeNames[1] === '' or same as typeNames[0]),
      // show "—" (empty value) as selected
      let currentType = '';
      if (typeIdx === 0) {
        currentType = localMon.typeNames?.[0] || localMon.type1Name || '';
      } else {
        const t2 = localMon.typeNames?.[1];
        const t1 = localMon.typeNames?.[0];
        // Solo-type if: t2 is empty/null, OR t2 equals t1 (legacy Gen1 data)
        if (!t2 || t2 === '' || (t1 && t2 === t1)) {
          currentType = ''; // "—" selected
        } else {
          currentType = t2;
        }
      }
      html += `<div>
        <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}</label>
        <select id="pe-schema-${field.key}" class="${inputCls}">
          <option value="" ${currentType === '' ? 'selected' : ''}>—</option>
          ${typeList.map((t, i) => `<option value="${i}" ${t === currentType ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>`;
    } else if (field.type === 'select' && field.source === 'itemList') {
      const heldItemId = localMon.genExtension?.heldItem ?? localMon.heldItem ?? 0;
      html += `<div>
        <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}</label>
        <select id="pe-schema-${field.key}" class="${inputCls}">
          <option value="0">None</option>
          ${itemList.map((item, i) => i > 0 ? `<option value="${i}" ${i === heldItemId ? 'selected' : ''}>${item}</option>` : '').join('')}
        </select>
      </div>`;
    } else if (field.type === 'select' && field.options) {
      let currentValue = '';
      if (field.key === 'status') currentValue = localMon.status || 'OK';
      else if (field.key === 'gender') currentValue = localMon.genExtension?.gender ?? localMon.gender ?? 'Genderless';
      else currentValue = localMon[field.key] || field.options[0];
      html += `<div>
        <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}</label>
        <select id="pe-schema-${field.key}" class="${inputCls}">
          ${field.options.map(opt => `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      </div>`;
    } else if (field.type === 'move-select') {
      const idx = field.index;
      const m = localMon.moves?.[idx] || { id:0, pp:0, ppUps:0 };
      const basePP = adapter.getMovePP(m.id);
      const maxPP = basePP + Math.floor(basePP * (m.ppUps||0) / 5);
      html += `<div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400 dark:text-gray-500 font-bold w-5">#${idx+1}</span>
          <div class="relative">
            <input id="pe-move-${idx}" type="text" value="${moveList[m.id]||'-'}" placeholder="Move..."
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
            <div id="pe-move-${idx}-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="text-gray-500 dark:text-gray-400">PP: <span class="text-gray-900 dark:text-white font-bold" id="pe-pp-${idx}">${m.pp||0}</span>/${maxPP}</span>
          <label class="text-gray-500 dark:text-gray-400">PP Ups:
            <input type="number" min="0" max="3" value="${m.ppUps||0}" data-ppups="${idx}"
              class="w-10 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </label>
        </div>
      </div>`;
    } else if (field.type === 'text') {
      const value = field.key === 'nickname' ? (localMon.nickname || '') :
                    field.key === 'otName' ? (localMon.otName || '') :
                    localMon[field.key] || '';
      html += `<div>
        <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}</label>
        <input id="pe-schema-${field.key}" type="text" value="${value}" maxlength="${field.maxLength || 50}"
          class="${inputCls}">
      </div>`;
    } else if (field.type === 'number') {
      let value;
      const key = field.key;
      if (key === 'level') value = localMon.level || 1;
      else if (key === 'experience') value = localMon.exp || localMon.experience || 0;
      else if (key === 'otId') value = localMon.otId || 0;
      else if (key === 'maxHp') value = localMon.maxHp || 0;
      else if (key === 'hp') value = localMon.hp || 0;
      else if (key === 'attack') value = localMon.attack || 0;
      else if (key === 'defense') value = localMon.defense || 0;
      else if (key === 'speed') value = localMon.speed || 0;
      else if (key === 'special') value = localMon.special || 0;
      else if (key === 'spAttack' || key === 'spAtk') value = localMon.spAtk || localMon.spAttack || 0;
      else if (key === 'spDefense' || key === 'spDef') value = localMon.spDef || localMon.spDefense || 0;
      else if (key.startsWith('ev')) {
        const evKey = key.replace('ev', '');
        const mappedKey = evKey.charAt(0).toLowerCase() + evKey.slice(1);
        value = localMon.ev?.[mappedKey] ?? 0;
      } else if (key.startsWith('iv')) {
        const ivKey = key.replace('iv', '');
        const mappedKey = ivKey.charAt(0).toLowerCase() + ivKey.slice(1);
        value = localMon.iv?.[mappedKey] ?? 0;
      } else if (key === 'catchRate') value = localMon.catchRate || 0;
      else if (key === 'pokerus') value = localMon.pokerus || localMon.genExtension?.pokerus || 0;
      else if (key === 'friendship') value = localMon.genExtension?.friendship ?? localMon.friendship ?? 0;
      else if (key === 'eggSteps') value = localMon.genExtension?.eggSteps ?? 0;
      else value = localMon[key] || 0;

      const readOnly = field.readOnly ? 'readonly tabindex="-1" opacity-60' : '';
      const isEvKey = key.startsWith('ev');
      const isIvKey = key.startsWith('iv');
      const rangeMax = isEvKey ? 65535 : isIvKey ? 15 : (field.max || 999);
      const rangeMin = field.min !== undefined ? field.min : 0;

      if (isIvKey) {
        html += `<div class="flex items-center gap-2">
          <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${field.label}</span>
          <input type="range" min="${rangeMin}" max="${rangeMax}" value="${value}" data-iv="${key.replace('iv','').toLowerCase()}" class="pe-iv-range flex-1 accent-yellow-400 h-1.5">
          <input type="number" min="${rangeMin}" max="${rangeMax}" value="${value}" data-ivn="${key.replace('iv','').toLowerCase()}"
            class="w-12 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
        </div>`;
      } else if (isEvKey) {
        html += `<div class="flex items-center gap-2">
          <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${field.label}</span>
          <input type="range" min="${rangeMin}" max="${rangeMax}" value="${value}" data-ev="${key.replace('ev','').toLowerCase()}" class="pe-ev-range flex-1 accent-green-400 h-1.5">
          <input type="number" min="${rangeMin}" max="${rangeMax}" value="${value}" data-evn="${key.replace('ev','').toLowerCase()}"
            class="w-16 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
        </div>`;
      } else {
        html += `<div>
          <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">${field.label}${field.computed ? ' (auto)' : ''}</label>
          <input id="pe-schema-${field.key}" type="number" min="${rangeMin}" max="${field.max || 999999}" value="${value}" ${readOnly}
            class="${numCls}">
        </div>`;
      }
    } else if (field.type === 'checkbox') {
      let checked = false;
      if (field.key === 'shiny') checked = localMon.genExtension?.isShiny ?? localMon.isShiny ?? false;
      else checked = localMon[field.key] ?? false;
      html += `<div class="flex items-center gap-2">
        <input id="pe-schema-${field.key}" type="checkbox" ${checked ? 'checked' : ''} class="accent-yellow-400">
        <label for="pe-schema-${field.key}" class="text-xs text-gray-500 dark:text-gray-400 font-bold">${field.label}</label>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}

function render(container, eventBus, theme, appState) {
  const gameTheme = theme?.getGameTheme();
  const sourceKey = editorMeta?.source === 'party' ? 'red' : 'blue';
  const versionStr = appState?.getActiveTab()?.version?.toLowerCase() || '';
  const bgColor = gameTheme?.color || GAME_COLORS[versionStr] || GAME_COLORS[sourceKey] || '#3B4CCA';
  const { bs, stats } = calcAllStats(localMon);
  const dexId = localMon.dexId || 0;
  const adapter = currentAdapter;
  const pokemonList = adapter ? adapter.getPokemonList() : [];
  const schema = adapter ? adapter.getPokemonSchema() : { sections: [] };

  // Build schema-driven content columns
  let leftHtml = '', middleHtml = '', rightHtml = '';
  for (const section of schema.sections) {
    if (section.id === 'identity' || section.id === 'types') {
      leftHtml += renderSchemaSection(section, localMon, adapter);
    } else if (section.id === 'stats' || section.id === 'evs' || section.id === 'ivs') {
      middleHtml += renderSchemaSection(section, localMon, adapter);
    } else if (section.id === 'moves' || section.id === 'misc') {
      rightHtml += renderSchemaSection(section, localMon, adapter);
    } else {
      // Default: put unknown sections in the right column
      rightHtml += renderSchemaSection(section, localMon, adapter);
    }
  }

  // Build calculated stats grid
  const calcStatsGrid = (() => {
    const gen = adapter ? adapter.generationId : 1;
    if (gen >= 2) {
      return [['HP',stats.hp,bs.hp],['Atk',stats.atk,bs.atk||bs.attack],['Def',stats.def,bs.def||bs.defense],['Spe',stats.spe,bs.spe||bs.speed],['SpA',stats.spAtk,bs.spc||bs.spAttack],['SpD',stats.spDef,bs.spc||bs.spDefense]];
    } else {
      return [['HP',stats.hp,bs.hp],['Atk',stats.atk,bs.atk||bs.attack],['Def',stats.def,bs.def||bs.defense],['Spe',stats.spe,bs.spe||bs.speed],['SpA',stats.spAtk,bs.spc],['SpD',stats.spDef,bs.spc]];
    }
  })();

  // Append calculated stats display to middle column if stats section exists
  middleHtml += `
    <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">Calculated Stats</h3>
    <div class="grid grid-cols-3 gap-2 text-center">
      ${calcStatsGrid.map(([l,v,b]) =>
        `<div class="bg-gray-100 dark:bg-white/5 rounded-lg p-2"><div class="text-lg font-black text-gray-900 dark:text-white">${v}</div><div class="text-xs text-gray-400 dark:text-gray-500">${l} <span class="text-gray-300 dark:text-gray-600">(${b})</span></div></div>`
      ).join('')}
    </div>
    <p class="text-xs text-gray-400 dark:text-gray-600 text-center">Base stats in parentheses</p>`;

  container.innerHTML = `
  <div class="fixed inset-0 z-[700] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="pe-backdrop"></div>
    <div class="relative w-full max-w-6xl bg-white dark:bg-gray-900/95 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in-95 flex flex-col max-h-[95vh]">
      <!-- HEADER -->
      <div class="flex flex-wrap items-center gap-2 px-4 py-3" style="background:${bgColor}">
        <input id="pe-nick" type="text" value="${localMon.nickname || pokemonList[dexId] || ''}" maxlength="10"
          class="bg-transparent border-b-2 border-white/30 text-2xl lg:text-3xl font-black italic text-white focus:outline-none focus:border-white/60 w-36 placeholder-white/30" placeholder="Nickname">
        <div class="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
          <span class="text-white/70 text-xs font-bold">Lv</span>
          <input id="pe-level" type="number" min="1" max="100" value="${localMon.level||1}"
            class="w-12 bg-transparent text-white text-sm font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
        </div>
        <div class="flex-1"></div>
        <span id="pe-dirty-dot" class="hidden flex items-center gap-1 text-yellow-300 text-xs font-bold animate-pulse"><span class="w-2 h-2 bg-yellow-300 rounded-full"></span>Unsaved</span>
        <button id="pe-dex" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Pokédex Entry"><i data-lucide="book-open" class="w-5 h-5 text-white"></i></button>
        <button id="pe-export" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Export Pokémon"><i data-lucide="download" class="w-5 h-5 text-white"></i></button>
        <button id="pe-save" class="px-3 py-1.5 bg-white text-gray-900 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Save</button>
        <button id="pe-close" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><i data-lucide="x" class="w-5 h-5 text-white"></i></button>
      </div>

      <!-- CONTENT -->
      <div class="overflow-y-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 flex-1">
        <div class="lg:col-span-4 space-y-4">
          <div class="flex justify-center">
            <img id="pe-sprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png" alt="${pokemonList[dexId]||'Pokémon'}"
              class="w-32 h-32 pixelated hover:scale-110 transition-transform cursor-pointer" onerror="this.style.display='none'">
          </div>
          <div id="pe-types" class="flex gap-2 flex-wrap">${typeBadges(dexId)}</div>
          ${leftHtml}
        </div>
        <div class="lg:col-span-4 space-y-4">
          ${middleHtml}
        </div>
        <div class="lg:col-span-4 space-y-4">
          ${rightHtml}
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
      <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2">#${dexId} ${pokemonList[dexId]||''}</h3>
      <p id="pe-dex-text" class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"></p>
    </div>
  </div>`;

  if (window.lucide) window.lucide.createIcons();

  // --- Autocomplete setup ---
  setupAutoComplete('pe-schema-species', pokemonList, (idx) => {
    if (idx > 0 && adapter) {
      const maxDex = adapter.getPokedexSize();
      if (idx > maxDex) return;
      localMon.dexId = idx;
      localMon.speciesName = pokemonList[idx] || '';
      const internalMap = adapter.getInternalToDexMap();
      const internalIdx = internalMap.indexOf(idx);
      if (internalIdx >= 0) localMon.speciesId = internalIdx;
      const types = adapter.getPokemonTypes(idx);
      // Set type names - for solo-type Pokemon (single element), Type 2 is empty
      localMon.type1Name = types[0] || 'Normal';
      localMon.type2Name = types[1] || '';  // Empty string for single-type Pokemon
      localMon.typeNames = [types[0] || 'Normal', types[1] || ''];
      // Set type IDs - for solo-type Pokemon, types[1] = 0
      const typeList = adapter.getTypeList();
      const type1Idx = typeList.indexOf(types[0]);
      const type2Idx = types[1] ? typeList.indexOf(types[1]) : 0;
      localMon.types = [type1Idx >= 0 ? type1Idx : 0, type2Idx >= 0 ? type2Idx : 0];
      calcAllStats(localMon);
      if (adapter.getCatchRate) localMon.catchRate = adapter.getCatchRate(idx);
      if (!localMon.isNicknamed && localMon.nickname) {
        localMon.nickname = localMon.speciesName;
      }
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    }
  }, container);

  const moveList = adapter ? adapter.getMoveList() : [];
  [0,1,2,3].forEach(i => {
    setupAutoComplete(`pe-move-${i}`, moveList, (idx) => {
      if (!localMon.moves) localMon.moves = [{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0},{id:0,pp:0,ppUps:0}];
      const basePP = adapter ? adapter.getMovePP(idx) : 0;
      localMon.moves[i] = { id: idx, pp: basePP, ppUps: 0 };
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    }, container);
  });

  // --- Schema-driven input bindings ---
  // Species select (from autocomplete)
  // Nickname
  const nickEl = document.getElementById('pe-nick');
  if (nickEl) nickEl.addEventListener('change', () => { localMon.nickname = nickEl.value; markDirty(container, eventBus); });

  // Level
  const levelEl = document.getElementById('pe-level');
  if (levelEl) levelEl.addEventListener('change', () => {
    localMon.level = Math.max(1, Math.min(100, Number(levelEl.value)));
    recalcAndRefresh(container, eventBus, theme, appState);
  });

  // Experience
  const expEl = document.getElementById('pe-schema-experience');
  if (expEl) expEl.addEventListener('change', () => {
    const exp = Math.max(0, Number(expEl.value));
    localMon.exp = exp;
    if (adapter) {
      const rate = adapter.getGrowthRate(localMon.dexId);
      localMon.level = adapter.getLevelFromExp(exp, rate);
    }
    recalcAndRefresh(container, eventBus, theme, appState);
  });

  // OT Name
  const otEl = document.getElementById('pe-schema-otName');
  if (otEl) otEl.addEventListener('change', () => { localMon.otName = otEl.value; markDirty(container, eventBus); });

  // OT ID
  const otIdEl = document.getElementById('pe-schema-otId');
  if (otIdEl) otIdEl.addEventListener('change', () => { localMon.otId = Math.max(0, Math.min(65535, Number(otIdEl.value))); markDirty(container, eventBus); });

  // Catch Rate
  const crEl = document.getElementById('pe-schema-catchRate');
  if (crEl) crEl.addEventListener('change', () => { localMon.catchRate = Math.max(0, Math.min(255, Number(crEl.value))); markDirty(container, eventBus); });

  // Pokerus
  const pkEl = document.getElementById('pe-schema-pokerus');
  if (pkEl) pkEl.addEventListener('change', () => { localMon.pokerus = Math.max(0, Math.min(255, Number(pkEl.value))); markDirty(container, eventBus); });

  // Friendship
  const frEl = document.getElementById('pe-schema-friendship');
  if (frEl) frEl.addEventListener('change', () => {
    if (!localMon.genExtension) localMon.genExtension = {};
    localMon.genExtension.friendship = Math.max(0, Math.min(255, Number(frEl.value)));
    markDirty(container, eventBus);
  });

  // Egg Steps
  const eggEl = document.getElementById('pe-schema-eggSteps');
  if (eggEl) eggEl.addEventListener('change', () => {
    if (!localMon.genExtension) localMon.genExtension = {};
    localMon.genExtension.eggSteps = Math.max(0, Math.min(65535, Number(eggEl.value)));
    markDirty(container, eventBus);
  });

  // Shiny
  const shinyEl = document.getElementById('pe-schema-shiny');
  if (shinyEl) shinyEl.addEventListener('change', () => {
    if (!localMon.genExtension) localMon.genExtension = {};
    localMon.genExtension.isShiny = shinyEl.checked;
    markDirty(container, eventBus);
  });

  // Gender
  const genderEl = document.getElementById('pe-schema-gender');
  if (genderEl) genderEl.addEventListener('change', () => {
    if (!localMon.genExtension) localMon.genExtension = {};
    localMon.genExtension.gender = genderEl.value;
    markDirty(container, eventBus);
  });

  // Status
  const statusEl = document.getElementById('pe-schema-status');
  if (statusEl) statusEl.addEventListener('change', () => { localMon.status = statusEl.value; markDirty(container, eventBus); });

  // Held Item
  const heldEl = document.getElementById('pe-schema-heldItem');
  if (heldEl) heldEl.addEventListener('change', () => {
    if (!localMon.genExtension) localMon.genExtension = {};
    localMon.genExtension.heldItem = Number(heldEl.value);
    markDirty(container, eventBus);
  });

  // Type selects - update both typeNames and types arrays on localMon
  const type1El = document.getElementById('pe-schema-type1');
  if (type1El) type1El.addEventListener('change', () => {
    // Type 1 should never be empty — it's the primary type
    const newType1 = adapter.getTypeList()[Number(type1El.value)] || 'Normal';
    localMon.type1Name = newType1;
    // Update typeNames array and types array for consistency across the app
    localMon.typeNames = [newType1, localMon.typeNames?.[1] || ''];
    localMon.types = [Number(type1El.value), localMon.types?.[1] ?? 0];
    // Update pe-types display immediately
    const peTypes = document.getElementById('pe-types');
    if (peTypes) peTypes.innerHTML = typeBadges(localMon.dexId);
    markDirty(container, eventBus);
  });
  const type2El = document.getElementById('pe-schema-type2');
  if (type2El) type2El.addEventListener('change', () => {
    // When user selects "—" (value=""), it means NO secondary type (solo-type Pokemon)
    // Bug fix: Number("") === 0, and typeList[0] === "Normal", which incorrectly
    // sets the secondary type to Normal. Instead, we must treat "" as null/empty.
    const isEmptyType = type2El.value === '';
    const newType2 = isEmptyType ? '' : (adapter.getTypeList()[Number(type2El.value)] || '');
    localMon.type2Name = newType2;
    // Update typeNames array and types array for consistency across the app
    // For solo-type: typeNames[1] = '', types[1] = 0 (null type)
    localMon.typeNames = [localMon.typeNames?.[0] || 'Normal', newType2];
    localMon.types = [localMon.types?.[0] ?? 0, isEmptyType ? 0 : Number(type2El.value)];
    // Update pe-types display immediately
    const peTypes = document.getElementById('pe-types');
    if (peTypes) peTypes.innerHTML = typeBadges(localMon.dexId);
    markDirty(container, eventBus);
  });

  // IV sliders & inputs
  document.querySelectorAll('.pe-iv-range').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.iv; const v = parseInt(el.value);
      if (!localMon.iv) localMon.iv = {};
      localMon.iv[k] = v;
      const numEl = document.querySelector(`[data-ivn="${k}"]`); if (numEl) numEl.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });
  document.querySelectorAll('[data-ivn]').forEach(el => {
    el.addEventListener('change', () => {
      const k = el.dataset.ivn; const v = Math.max(0, Math.min(15, parseInt(el.value)||0));
      if (!localMon.iv) localMon.iv = {};
      localMon.iv[k] = v; el.value = v;
      const range = document.querySelector(`[data-iv="${k}"]`); if (range) range.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // EV sliders & inputs
  document.querySelectorAll('.pe-ev-range').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.ev; const v = parseInt(el.value);
      if (!localMon.ev) localMon.ev = {};
      localMon.ev[k] = v;
      const numEl = document.querySelector(`[data-evn="${k}"]`); if (numEl) numEl.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });
  document.querySelectorAll('[data-evn]').forEach(el => {
    el.addEventListener('change', () => {
      const k = el.dataset.evn; const v = Math.max(0, Math.min(65535, parseInt(el.value)||0));
      if (!localMon.ev) localMon.ev = {};
      localMon.ev[k] = v; el.value = v;
      const range = document.querySelector(`[data-ev="${k}"]`); if (range) range.value = v;
      recalcAndRefresh(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // PP Ups
  document.querySelectorAll('[data-ppups]').forEach(el => {
    el.addEventListener('change', () => {
      const i = parseInt(el.dataset.ppups); const v = Math.max(0, Math.min(3, parseInt(el.value)||0));
      if (localMon.moves?.[i]) { localMon.moves[i].ppUps = v; const basePP = adapter ? adapter.getMovePP(localMon.moves[i].id) : 0; localMon.moves[i].pp = basePP + Math.floor(basePP*v/5); }
      refreshAll(container, eventBus, theme, appState); markDirty(container, eventBus);
    });
  });

  // --- Buttons ---
  const doSave = () => {
    // Validate using FieldValidator before saving
    const genId = adapter ? adapter.generationId : 1;
    const validator = getFieldValidator(genId);

    // Clamp level to valid range
    localMon.level = validator.clamp('pokemon', 'level', localMon.level || 1);

    // Clamp species to valid range
    if (localMon.dexId) {
      localMon.dexId = validator.clamp('pokemon', 'species', localMon.dexId);
    }

    // Clamp EVs
    if (localMon.ev) {
      for (const key of Object.keys(localMon.ev)) {
        const evField = 'ev' + key.charAt(0).toUpperCase() + key.slice(1);
        localMon.ev[key] = validator.clamp('pokemon', evField, localMon.ev[key]);
      }
    }

    // Clamp IVs/DVs
    if (localMon.iv) {
      for (const key of Object.keys(localMon.iv)) {
        const ivField = 'iv' + key.charAt(0).toUpperCase() + key.slice(1);
        localMon.iv[key] = validator.clamp('pokemon', ivField, localMon.iv[key]);
      }
    }

    // Clamp friendship
    if (localMon.genExtension?.friendship !== undefined) {
      localMon.genExtension.friendship = validator.clamp('pokemon', 'friendship', localMon.genExtension.friendship);
    }

    // Clamp pokerus
    if (localMon.pokerus !== undefined) {
      localMon.pokerus = validator.clamp('pokemon', 'pokerus', localMon.pokerus);
    }

    // Clamp PP Ups per move
    if (localMon.moves) {
      for (const move of localMon.moves) {
        if (move) {
          move.ppUps = Math.max(0, Math.min(3, move.ppUps || 0));
          const basePP = adapter ? adapter.getMovePP(move.id) : 0;
          const maxPP = basePP + Math.floor(basePP * move.ppUps / 5);
          move.pp = Math.max(0, Math.min(maxPP, move.pp || 0));
        }
      }
    }

    // Clamp catch rate (Gen1)
    if (localMon.catchRate !== undefined) {
      localMon.catchRate = validator.clamp('pokemon', 'catchRate', localMon.catchRate);
    }

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

  // Export Pokémon
  document.getElementById('pe-export')?.addEventListener('click', () => {
    try {
      const denormedMon = denormalizeForWriter(localMon);
      if (adapter) {
        adapter.writePokemon(denormedMon).then(data => {
          const ext = adapter.generationId === 2 ? 'pk2' : 'pk1';
          const blob = new Blob([data], { type: 'application/octet-stream' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = `${localMon.nickname || pokemonList[localMon.dexId] || 'pokemon'}.${ext}`;
          a.click(); URL.revokeObjectURL(a.href);
        }).catch(err => console.error('Failed to export', err));
      }
    } catch (err) {
      console.error('Failed to export Pokémon', err);
    }
  });

  // Pokédex entry
  document.getElementById('pe-dex')?.addEventListener('click', () => {
    const entry = (window.POKEDEX_ENTRIES || {})[localMon.dexId];
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
  const { bs, stats } = calcAllStats(localMon);
  const gen = currentAdapter ? currentAdapter.generationId : 1;
  const labels = gen >= 2 ? ['HP','Atk','Def','Spe','SpA','SpD'] : ['HP','Atk','Def','Spe','SpA','SpD'];
  const vals = [stats.hp, stats.atk, stats.def, stats.spe, stats.spAtk, stats.spDef];
  const bases = gen >= 2 ? [bs.hp, bs.atk||bs.attack, bs.def||bs.defense, bs.spe||bs.speed, bs.spc||bs.spAttack, bs.spc||bs.spDefense] : [bs.hp, bs.atk||bs.attack, bs.def||bs.defense, bs.spe||bs.speed, bs.spc, bs.spc];
  container.querySelectorAll('.grid.grid-cols-3 > div').forEach((el, i) => {
    if (i < 6) {
      el.querySelector('.text-lg').textContent = vals[i];
      const label = el.querySelector('.text-xs');
      if (label) label.innerHTML = `${labels[i]} <span class="text-gray-300 dark:text-gray-600">(${bases[i]})</span>`;
    }
  });
  const levelInput = document.getElementById('pe-level');
  if (levelInput) levelInput.value = localMon.level;
}

function refreshAll(container, eventBus, theme, appState) {
  render(container, eventBus, theme, appState);
}
