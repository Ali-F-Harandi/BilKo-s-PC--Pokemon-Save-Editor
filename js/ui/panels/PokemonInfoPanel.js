/**
 * PokemonInfoPanel.js — Pokemon Identity Section Panel
 *
 * Extracted from pokemonEditorModal.js LEFT column (identity section).
 * Renders species, types, OT, experience, pokerus.
 * Supports extension system for generation-specific fields.
 */

import { POKEMON_NAMES } from '../../data/pokemonNames.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { TYPE_COLORS } from '../../data/gameData.js';
import { getGrowthRate, getLevelFromExp } from '../../data/experience.js';
import { PanelExtension } from './PanelExtension.js';

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

export function render(localMon, appState, generation = 1) {
    const dexId = localMon.dexId || 0;
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
    const isYellow = appState?.getActiveTab()?.version === 'Yellow';

    let html = `
        <!-- LEFT: Identity -->
        <div class="lg:col-span-4 space-y-4">
          <div class="flex justify-center">
            <img id="pe-sprite" src="${spriteUrl}" alt="${POKEMON_NAMES[dexId]||'Pokémon'}"
              class="w-32 h-32 pixelated hover:scale-110 transition-transform cursor-pointer" onerror="this.style.display='none'">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Species</label>
            <div class="relative">
              <input id="pe-species" type="text" value="${POKEMON_NAMES[dexId]||''}" placeholder="Search species..."
                class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
              <div id="pe-species-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
            </div>
          </div>
          <div id="pe-types" class="flex gap-2 flex-wrap">${getPokemonTypes(dexId).map(t =>
            `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background:${TYPE_COLORS[t]||'#999'}">${t}</span>`
          ).join(' ')}</div>
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
          </div>`;

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
