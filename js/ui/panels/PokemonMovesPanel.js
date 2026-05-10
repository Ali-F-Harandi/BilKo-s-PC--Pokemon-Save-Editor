/**
 * PokemonMovesPanel.js — Move Slots Editing Panel
 *
 * Extracted from pokemonEditorModal.js RIGHT column (moves section).
 * Renders 4 move slots with autocomplete, PP, PP Ups.
 * Supports extension system for generation-specific move fields (e.g., Gen1 catch rate).
 */

import { MOVES_LIST, MOVES_PP } from '../../data/moves.js';
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

export function render(localMon, generation = 1) {
    let html = `
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
                <div class="relative">
                  <input id="pe-move-${i}" type="text" value="${MOVES_LIST[m.id]||'-'}" placeholder="Move..."
                    class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
                  <div id="pe-move-${i}-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-gray-500 dark:text-gray-400">PP: <span class="text-gray-900 dark:text-white font-bold" id="pe-pp-${i}">${m.pp||0}</span>/${maxPP}</span>
                <label class="text-gray-500 dark:text-gray-400">PP Ups:
                  <input type="number" min="0" max="3" value="${m.ppUps||0}" data-ppups="${i}"
                    class="w-10 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                </label>
              </div>
            </div>`;
          }).join('')}`;

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
