/**
 * CatchRateSection.js — Gen1 Catch Rate / Friendship Extension
 *
 * Extends PokemonMovesPanel with catch rate / friendship field.
 * In Yellow version, shows "Pikachu friendship" hint.
 * Extracted from pokemonEditorModal.js catch rate section.
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';
import { GEN1_CATCH_RATES } from '../../../data/baseStats.js';

export class CatchRateSection extends PanelExtension {
    constructor() {
        super('gen1-catch-rate', 'Catch Rate / Friendship', 1);
    }

    render(data) {
        const dexId = data.dexId || 0;
        const isYellow = data._isYellow || false;
        return `
          <div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2 mt-4">
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Catch Rate / Friendship</label>
            <input id="pe-catchrate" type="number" min="0" max="255" value="${data.catchRate ?? GEN1_CATCH_RATES[dexId] ?? 0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
            ${isYellow ? '<p class="text-xs text-yellow-600 dark:text-yellow-400/70">Yellow: Pikachu friendship value</p>' : ''}
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        // Event binding for catch rate is handled by the modal's main bind function
        // since it needs access to localMon for saving.
    }
}
