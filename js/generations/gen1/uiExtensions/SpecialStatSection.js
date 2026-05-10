/**
 * SpecialStatSection.js — Gen1 Unified Special Stat Extension
 *
 * Extends PokemonStatsPanel showing unified Special stat
 * (instead of split SpAtk/SpDef in the calculated stats display).
 * In Gen1, Special is a single stat used for both offense and defense.
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';

export class SpecialStatSection extends PanelExtension {
    constructor() {
        super('gen1-special-stat', 'Special Stat (Gen 1)', 1);
    }

    render(data) {
        // In Gen1, SpAtk and SpDef are the same value (Special).
        // This extension adds a note about the unified Special stat.
        // The actual rendering is already handled by the base stats panel
        // since the calculated stats already show SpA and SpD as the same value.
        return `
          <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mt-2">
            <p class="text-xs text-yellow-700 dark:text-yellow-300"><b>Gen 1 Note:</b> Special is a unified stat — SpAtk and SpDef share the same IV/EV value.</p>
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        // No interactive events for this informational extension
    }
}
