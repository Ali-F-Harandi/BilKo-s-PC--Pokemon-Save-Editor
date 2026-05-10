/**
 * PokemonStatsPanel.js — Stats Display + IV/EV Editing Panel
 *
 * Refactored: Uses adapter schema for stat keys/labels instead of hard-coded STAT_KEYS.
 * The adapter is passed in as a parameter.
 */

export function render(localMon, stats, bs, generation = 1, adapter = null) {
    // Determine stat keys/labels based on adapter schema
    let statKeys, statLabels;
    if (adapter) {
        const schema = adapter.getPokemonSchema();
        const statsSection = schema.sections.find(s => s.id === 'ivs') || schema.sections.find(s => s.id === 'stats');
        if (statsSection) {
            statKeys = statsSection.fields
                .filter(f => f.type === 'number' && f.key.startsWith('iv'))
                .map(f => f.key.replace('iv', '').toLowerCase());
            statLabels = {};
            statsSection.fields
                .filter(f => f.type === 'number' && f.key.startsWith('iv'))
                .forEach(f => { statLabels[f.key.replace('iv', '').toLowerCase()] = f.label; });
        } else {
            statKeys = ['hp', 'attack', 'defense', 'speed', 'special'];
            statLabels = { hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spe', special: 'Spc' };
        }
    } else {
        statKeys = generation >= 2
            ? ['hp', 'attack', 'defense', 'speed', 'spAttack', 'spDefense']
            : ['hp', 'attack', 'defense', 'speed', 'special'];
        statLabels = generation >= 2
            ? { hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spe', spAttack: 'SpA', spDefense: 'SpD' }
            : { hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spe', special: 'Spc' };
    }

    let html = `
        <!-- MIDDLE: Stats -->
        <div class="lg:col-span-4 space-y-4">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">IVs <span class="text-gray-400 dark:text-gray-500 font-normal">(0-15)</span></h3>
          ${statKeys.filter(k => k !== 'hp').map(k => `<div class="flex items-center gap-2">
            <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${statLabels[k] || k}</span>
            <input type="range" min="0" max="15" value="${localMon.iv?.[k]||0}" data-iv="${k}" class="pe-iv-range flex-1 accent-yellow-400 h-1.5">
            <input type="number" min="0" max="15" value="${localMon.iv?.[k]||0}" data-ivn="${k}"
              class="w-12 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>`).join('')}
          <div class="flex items-center gap-2 opacity-60">
            <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">HP</span>
            <input type="range" min="0" max="15" value="${localMon.iv?.hp||0}" data-iv="hp" class="pe-iv-range flex-1 accent-yellow-400 h-1.5" disabled>
            <input type="number" min="0" max="15" value="${localMon.iv?.hp||0}" data-ivn="hp"
              class="w-12 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" readonly>
            <span class="text-[10px] text-gray-400">(auto)</span>
          </div>

          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">EVs <span class="text-gray-400 dark:text-gray-500 font-normal">(0-65535)</span></h3>
          ${statKeys.map(k => `<div class="flex items-center gap-2">
            <span class="w-12 text-xs text-gray-500 dark:text-gray-400 font-bold">${statLabels[k] || k}</span>
            <input type="range" min="0" max="65535" value="${localMon.ev?.[k]||0}" data-ev="${k}" class="pe-ev-range flex-1 accent-green-400 h-1.5">
            <input type="number" min="0" max="65535" value="${localMon.ev?.[k]||0}" data-evn="${k}"
              class="w-16 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-xs text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>`).join('')}

          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">Calculated Stats</h3>
          <div class="grid grid-cols-3 gap-2 text-center">
            ${(() => {
                const gen = adapter ? adapter.generationId : generation;
                if (gen >= 2) {
                    return [['HP',stats.hp,bs.hp],['Atk',stats.atk,bs.atk||bs.attack],['Def',stats.def,bs.def||bs.defense],['Spe',stats.spe,bs.spe||bs.speed],['SpA',stats.spAtk,bs.spc||bs.spAttack],['SpD',stats.spDef,bs.spc||bs.spDefense]].map(([l,v,b])=>
                      `<div class="bg-gray-100 dark:bg-white/5 rounded-lg p-2"><div class="text-lg font-black text-gray-900 dark:text-white">${v}</div><div class="text-xs text-gray-400 dark:text-gray-500">${l} <span class="text-gray-300 dark:text-gray-600">(${b})</span></div></div>`
                    ).join('');
                } else {
                    return [['HP',stats.hp,bs.hp],['Atk',stats.atk,bs.atk||bs.attack],['Def',stats.def,bs.def||bs.defense],['Spe',stats.spe,bs.spe||bs.speed],['SpA',stats.spAtk,bs.spc],['SpD',stats.spDef,bs.spc]].map(([l,v,b])=>
                      `<div class="bg-gray-100 dark:bg-white/5 rounded-lg p-2"><div class="text-lg font-black text-gray-900 dark:text-white">${v}</div><div class="text-xs text-gray-400 dark:text-gray-500">${l} <span class="text-gray-300 dark:text-gray-600">(${b})</span></div></div>`
                    ).join('');
                }
            })()}
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-600 text-center">Base stats in parentheses</p>
        </div>`;

    return html;
}

export function bindEvents(container, eventBus, appState, localMon, generation = 1, adapter = null) {
    // Events are bound by the parent modal
}
