/**
 * BattleTab.js — Battle Guide with Defense/Offense Mode
 *
 * Refactored: Uses adapter for type chart and type colors.
 * Falls back to Gen1 data if no adapter is provided.
 */

import { sectionHeaderHTML } from '../shared/helpers.js';
import * as TypeChartPanel from '../../panels/TypeChartPanel.js';

export function render(data, appState, theme, eventBus, localState) {
    const adapter = appState?.getActiveAdapter?.() || null;
    return `
    <div class="w-full">
        ${sectionHeaderHTML('swords', 'Battle Guide', theme)}
        ${TypeChartPanel.render(theme, localState, adapter)}
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    TypeChartPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
}
