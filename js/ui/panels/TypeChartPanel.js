/**
 * TypeChartPanel.js — Type Effectiveness Chart Panel
 *
 * Extracted from editorDashboard.js _renderBattleTab.
 * Renders defense/offense type effectiveness results.
 * Extensible — renders from adapter.typeList and adapter.typeChart when available.
 */

import { TYPE_COLORS } from '../../data/gameData.js';
import { GEN1_TYPE_CHART, GEN1_TYPES } from '../../generations/gen1/data/typeChart.js';
import { PanelExtension } from './PanelExtension.js';

// Extension registry: Map<generation, PanelExtension[]>
const _extensions = new Map();

/**
 * Register an extension for this panel.
 * @param {PanelExtension} extension
 */
export function registerExtension(extension) {
    if (!(extension instanceof PanelExtension)) return;
    if (!_extensions.has(extension.generation)) {
        _extensions.set(extension.generation, []);
    }
    _extensions.get(extension.generation).push(extension);
}

function _renderDefenseResults(defenseType, chart, types) {
    const categories = { '4x Weak': [], '2x Weak': [], '0.5x Resist': [], '0.25x Resist': [], '0x Immune': [], '1x Neutral': [] };

    for (const atkType of types) {
        const mult = chart[atkType]?.[defenseType] ?? 1;
        if (mult === 4) categories['4x Weak'].push(atkType);
        else if (mult === 2) categories['2x Weak'].push(atkType);
        else if (mult === 0.5) categories['0.5x Resist'].push(atkType);
        else if (mult === 0.25) categories['0.25x Resist'].push(atkType);
        else if (mult === 0) categories['0x Immune'].push(atkType);
        else categories['1x Neutral'].push(atkType);
    }

    return Object.entries(categories)
        .filter(([, types]) => types.length > 0 && !categories['1x Neutral']?.includes?.(null))
        .map(([label, types]) => {
            if (label === '1x Neutral' && types.length === 0) return '';
            const colorMap = { '4x Weak': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', '2x Weak': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', '0.5x Resist': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', '0.25x Resist': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', '0x Immune': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400', '1x Neutral': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
            return `
                <div class="rounded-xl p-3 ${colorMap[label] || 'bg-gray-100'}">
                    <div class="font-black text-xs uppercase mb-2">${label}</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${types.map(t => `<span class="px-2 py-1 rounded text-xs font-bold text-white" style="background-color:${TYPE_COLORS[t]}">${t}</span>`).join('')}
                        ${types.length === 0 ? '<span class="text-xs opacity-60">None</span>' : ''}
                    </div>
                </div>`;
        }).join('');
}

function _renderOffenseResults(offenseType, chart, types) {
    const categories = { 'Super Effective (2x)': [], 'Super Effective (4x)': [], 'Not Very Effective (0.5x)': [], 'No Effect (0x)': [], 'Neutral (1x)': [] };

    for (const defType of types) {
        const mult = chart[offenseType]?.[defType] ?? 1;
        if (mult === 4) categories['Super Effective (4x)'].push(defType);
        else if (mult === 2) categories['Super Effective (2x)'].push(defType);
        else if (mult === 0.5) categories['Not Very Effective (0.5x)'].push(defType);
        else if (mult === 0) categories['No Effect (0x)'].push(defType);
        else categories['Neutral (1x)'].push(defType);
    }

    return Object.entries(categories)
        .filter(([, types]) => types.length > 0)
        .map(([label, types]) => {
            const colorMap = { 'Super Effective (4x)': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', 'Super Effective (2x)': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', 'Not Very Effective (0.5x)': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', 'No Effect (0x)': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400', 'Neutral (1x)': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
            return `
                <div class="rounded-xl p-3 ${colorMap[label] || 'bg-gray-100'}">
                    <div class="font-black text-xs uppercase mb-2">${label}</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${types.map(t => `<span class="px-2 py-1 rounded text-xs font-bold text-white" style="background-color:${TYPE_COLORS[t]}">${t}</span>`).join('')}
                    </div>
                </div>`;
        }).join('');
}

export function render(theme, localState, adapter = null) {
    const mode = localState.battleMode;
    const selectedType = localState.battleType;
    // Use adapter-provided data if available, otherwise fallback to Gen1 data
    const chart = (adapter?.typeChart) || GEN1_TYPE_CHART;
    const types = (adapter?.typeList) || GEN1_TYPES;

    let html = `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <!-- Mode Toggle -->
            <div class="flex gap-2 mb-4">
                <button class="battle-mode-btn px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'defense' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-battle-mode="defense">
                    <i data-lucide="shield" class="w-4 h-4 inline mr-1"></i>Defense
                </button>
                <button class="battle-mode-btn px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'offense' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-battle-mode="offense">
                    <i data-lucide="zap" class="w-4 h-4 inline mr-1"></i>Offense
                </button>
            </div>
            <!-- Type Selector -->
            <div class="flex flex-wrap gap-1.5 mb-6">
                ${types.map(t => `
                    <button class="battle-type-btn px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 ${t === selectedType ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-105' : 'opacity-80 hover:opacity-100'}"
                        style="background-color:${TYPE_COLORS[t]}" data-battle-type="${t}">${t}</button>
                `).join('')}
            </div>
            <!-- Results -->
            <div id="battle-results" class="space-y-4">
                ${mode === 'defense' ? _renderDefenseResults(selectedType, chart, types) : _renderOffenseResults(selectedType, chart, types)}
            </div>`;

    // Render extensions
    const genExtensions = _extensions.get(adapter?.generation || 1) || [];
    for (const ext of genExtensions) {
        html += ext.render({ mode, selectedType, chart, types });
    }

    html += `
        </div>
    </div>`;

    return html;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Battle Guide ----
    container.querySelectorAll('.battle-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localState.battleMode = btn.dataset.battleMode;
            updateFn();
        });
    });

    container.querySelectorAll('.battle-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localState.battleType = btn.dataset.battleType;
            updateFn();
        });
    });

    // Extension event bindings
    const genExtensions = _extensions.get(1) || [];
    for (const ext of genExtensions) {
        ext.bindEvents(container, eventBus, appState);
    }
}
