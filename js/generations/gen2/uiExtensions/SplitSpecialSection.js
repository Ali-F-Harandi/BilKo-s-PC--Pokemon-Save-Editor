/**
 * SplitSpecialSection.js — Gen2 Split Special Stat Extension
 *
 * Extends PokemonStatsPanel showing split SpAtk/SpDef
 * (instead of the unified Special stat in Gen 1).
 * In Gen 2, SpAtk and SpDef are separate in battle even though
 * they share the same base stat and DV/EV.
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';

export class SplitSpecialSection extends PanelExtension {
    constructor() {
        super('gen2-split-special', 'Split Special Stat', 2);
    }

    render(data) {
        const stats = data.stats || {};
        const spAtk = stats.spAttack ?? stats.special ?? 0;
        const spDef = stats.spDefense ?? stats.special ?? 0;

        return `
          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 mt-2">
            <p class="text-xs text-purple-700 dark:text-purple-300"><b>Gen 2 Note:</b> Special is split into Sp.Atk (${spAtk}) and Sp.Def (${spDef}) for battle. They share the same base stat, DV, and EV values.</p>
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        // No interactive events for this informational extension
    }
}
