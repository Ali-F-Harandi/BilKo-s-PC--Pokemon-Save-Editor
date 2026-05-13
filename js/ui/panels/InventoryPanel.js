/**
 * InventoryPanel.js — Bag/PC Items Panel
 *
 * Extracted from editorDashboard.js _renderInventoryPanel.
 * Renders item list with tab switching (bag/pc) and sorting.
 * Uses game theme color for active tab state.
 */

import { gameHeaderColor } from '../editor/shared/helpers.js';

export function render(data, theme, localState) {
    const view = localState.itemView;
    const items = view === 'bag' ? (data.items || []) : (data.pcItems || []);
    const sortBy = localState.itemSortBy;
    const activeColor = gameHeaderColor(theme);

    let sorted = [...items];
    if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else sorted.sort((a, b) => (a.id || 0) - (b.id || 0));

    return `
        <!-- Tabs -->
        <div class="flex gap-1 mb-3">
            <button class="item-tab-btn flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'bag' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" ${view === 'bag' ? `style="background-color:${activeColor}"` : ''} data-item-view="bag">
                <i data-lucide="shopping-bag" class="w-3 h-3 inline mr-1"></i>Bag
            </button>
            <button class="item-tab-btn flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'pc' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" ${view === 'pc' ? `style="background-color:${activeColor}"` : ''} data-item-view="pc">
                <i data-lucide="monitor" class="w-3 h-3 inline mr-1"></i>PC
            </button>
        </div>
        <!-- Sort -->
        <div class="flex gap-1 mb-2">
            <button class="item-sort-btn px-2 py-1 rounded text-[10px] font-bold transition-colors ${sortBy === 'id' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-item-sort="id">ByID</button>
            <button class="item-sort-btn px-2 py-1 rounded text-[10px] font-bold transition-colors ${sortBy === 'name' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-item-sort="name">ByName</button>
        </div>
        <!-- Item List -->
        <div class="flex-1 overflow-y-auto max-h-[420px] space-y-1.5 pr-1" style="scrollbar-width:thin;">
            ${sorted.length === 0
                ? `<div class="text-center text-gray-400 text-xs py-8">No items</div>`
                : sorted.map((item, i) => `
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors" data-item-index="${i}">
                        <span class="text-gray-700 dark:text-gray-300 text-xs flex-1 truncate">${item.name || `Item ${item.id}`}</span>
                        <span class="font-mono text-[10px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">x${item.count ?? 1}</span>
                    </div>`).join('')
            }
        </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Inventory ----
    container.querySelectorAll('.item-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localState.itemView = btn.dataset.itemView;
            updateFn();
        });
    });

    container.querySelectorAll('.item-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localState.itemSortBy = btn.dataset.itemSort;
            updateFn();
        });
    });
}
