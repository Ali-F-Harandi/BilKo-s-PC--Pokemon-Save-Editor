/**
 * PokemonStatsPanel.js — Stats Display + IV/EV Editing Panel
 *
 * Extracted from pokemonEditorModal.js MIDDLE column (stats section).
 * Renders IVs, EVs, and calculated stats.
 * Supports extension system for generation-specific stat displays (e.g., Gen1 unified Special).
 */

import { PanelExtension } from './PanelExtension.js';

const STAT_KEYS = ['hp', 'attack', 'defense', 'speed', 'special'];
const STAT_LABELS = { hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spe', special: 'Spc' };

// Extension registry: Map<generation, PanelExtension[]>
const _extensions = new Map();

/**
 * Register an extension for this panel.
 * @param {PanelExtension} extension
 */
export function registerExtension(extension) {
    if (!(extension instanceof PanelExtension)) return;
    if (!_extensions.has(extension.generation)) {
        _extensions.set(extension.generation, []);
    }
    _extensions.get(extension.generation).push(extension);
}

export function render(localMon, stats, bs, generation = 1) {
    let html = `
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
          <p class="text-xs text-gray-400 dark:text-gray-600 text-center">Base stats in parentheses</p>`;

    // Render extensions for the current generation
    const genExtensions = _extensions.get(generation) || [];
    for (const ext of genExtensions) {
        html += ext.render(localMon);
    }

    html += `
        </div>`;

    return html;
}

export function bindEvents(container, eventBus, appState, localMon, generation = 1) {
    // Extension event bindings
    const genExtensions = _extensions.get(generation) || [];
    for (const ext of genExtensions) {
        ext.bindEvents(container, eventBus, appState);
    }
}
