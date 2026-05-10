/**
 * StorageTab.js — PC & Bag Tab (PC Storage + Inventory)
 *
 * Composes PCBoxPanel + InventoryPanel.
 * Extracted from editorDashboard.js _renderStorageTab.
 */

import * as PCBoxPanel from '../../panels/PCBoxPanel.js';
import * as InventoryPanel from '../../panels/InventoryPanel.js';

export function render(data, appState, theme, eventBus, localState) {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- PC Storage (Right) -->
        <div class="lg:col-span-9 lg:order-2">
            ${PCBoxPanel.render(data, appState, theme, eventBus, localState)}
        </div>
        <!-- Inventory (Left) -->
        <div class="lg:col-span-3 lg:order-1">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 max-h-[600px] overflow-hidden flex flex-col">
                ${InventoryPanel.render(data, theme, localState)}
            </div>
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    PCBoxPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
    InventoryPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
}
