/**
 * DashboardTab.js — Unified Editor Dashboard (Combined Layout)
 *
 * Combines Trainer Card, Bag, Party, and PC Storage into a single view:
 * - Left sidebar: Trainer Card (top) + Bag/Inventory panel (bottom)
 * - Main panel: Party (top) + PC Storage with box navigation (bottom)
 *
 * Also handles Pokemon selection highlighting.
 */

import { Events } from '../../../state/eventBus.js';
import * as TrainerCardPanel from '../../panels/TrainerCardPanel.js';
import * as PartyPanel from '../../panels/PartyPanel.js';
import * as PCBoxPanel from '../../panels/PCBoxPanel.js';
import * as InventoryPanel from '../../panels/InventoryPanel.js';
import { sectionHeaderHTML } from '../shared/helpers.js';

export function render(data, appState, theme, eventBus, localState) {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT SIDEBAR: Trainer Card + Bag -->
        <div class="lg:col-span-4 xl:col-span-3 space-y-6">
            <!-- Trainer Card -->
            <div>
                ${TrainerCardPanel.render(data, appState, theme, eventBus, localState)}
            </div>
            <!-- Bag / Inventory -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4">
                ${sectionHeaderHTML('shopping-bag', 'Bag & Items', theme)}
                <div class="max-h-[500px] overflow-hidden flex flex-col">
                    ${InventoryPanel.render(data, theme, localState)}
                </div>
            </div>
        </div>

        <!-- MAIN PANEL: Party + PC Storage -->
        <div class="lg:col-span-8 xl:col-span-9 space-y-6">
            <!-- Party -->
            ${PartyPanel.render(data, appState, theme, eventBus, localState)}
            <!-- PC Storage -->
            ${PCBoxPanel.render(data, appState, theme, eventBus, localState)}
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    TrainerCardPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
    PartyPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
    PCBoxPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
    InventoryPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
}
