/**
 * HeldItemSection.js — Gen2 Held Item Extension
 *
 * Extends PokemonMovesPanel (or PokemonInfoPanel) with a held item selector.
 * Gen 2 introduced held items, allowing Pokemon to carry and use items in battle.
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';
import { GEN2_ITEM_NAMES, GEN2_HELD_ITEM_IDS } from '../data/itemData.js';

export class HeldItemSection extends PanelExtension {
    constructor() {
        super('gen2-held-item', 'Held Item', 2);
    }

    render(data) {
        const heldItemId = data.genExtension?.heldItem || 0;
        const heldItemName = data.genExtension?.heldItemName || (heldItemId > 0 ? GEN2_ITEM_NAMES[heldItemId] : 'None');

        // Build options for held items
        let optionsHtml = '<option value="0">None</option>';
        for (const id of GEN2_HELD_ITEM_IDS) {
            const name = GEN2_ITEM_NAMES[id] || `Item ${id}`;
            const selected = id === heldItemId ? 'selected' : '';
            optionsHtml += `<option value="${id}" ${selected}>${name}</option>`;
        }

        return `
          <div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2 mt-4">
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Held Item</label>
            <select id="pe-held-item" class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
              ${optionsHtml}
            </select>
            <p class="text-xs text-blue-600 dark:text-blue-400/70">Gen 2: Pokemon can hold items for battle effects.</p>
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        const select = container.querySelector('#pe-held-item');
        if (select) {
            select.addEventListener('change', (e) => {
                // The parent modal handles the actual data update
                // This just provides the UI element
            });
        }
    }
}
