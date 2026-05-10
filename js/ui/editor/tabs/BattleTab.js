/**
 * BattleTab.js — Battle Guide with Defense/Offense Mode
 *
 * Delegates to TypeChartPanel.
 * Extracted from editorDashboard.js _renderBattleTab.
 */

import { sectionHeaderHTML } from '../shared/helpers.js';
import * as TypeChartPanel from '../../panels/TypeChartPanel.js';

export function render(data, appState, theme, eventBus, localState) {
    return `
    <div class="w-full">
        ${sectionHeaderHTML('swords', 'Battle Guide', theme)}
        ${TypeChartPanel.render(theme, localState, null)}
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    TypeChartPanel.bindEvents(container, eventBus, theme, appState, localState, updateFn);
}
