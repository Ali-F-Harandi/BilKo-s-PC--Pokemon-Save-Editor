/**
 * DashboardTab.js — Dashboard Tab (Trainer Card + Party)
 *
 * Composes TrainerCardPanel + PartyPanel.
 * Extracted from editorDashboard.js _renderHomeTab.
 */

import * as TrainerCardPanel from '../../panels/TrainerCardPanel.js';
import * as PartyPanel from '../../panels/PartyPanel.js';

export function render(data, appState, theme, eventBus, localState) {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT: Trainer Card -->
        <div class="lg:col-span-4 xl:col-span-3">
            ${TrainerCardPanel.render(data, appState, theme, eventBus, localState)}
        </div>
        <!-- RIGHT: Party -->
        <div class="lg:col-span-8 xl:col-span-9">
            ${PartyPanel.render(data, appState, theme, eventBus, localState)}
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    TrainerCardPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
    PartyPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
}
