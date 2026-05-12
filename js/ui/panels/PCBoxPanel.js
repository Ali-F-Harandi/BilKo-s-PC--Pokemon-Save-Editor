/**
 * PCBoxPanel.js — PC Box Grid Panel
 *
 * Extracted from editorDashboard.js _renderStorageTab PC section.
 * Renders 20 box slots with navigation header, drag/drop.
 * Supports selection highlighting via appState.getCurrentTabSelections().
 */

import { Events } from '../../state/eventBus.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { spriteUrl, typeDotsHTML, matchesSearchFilter } from '../editor/shared/helpers.js';
import * as PCBoxNavigator from './PCBoxNavigator.js';

function _renderBoxSlot(mon, index, selectedBox, isSelected) {
    const types = getPokemonTypes(mon.dexId);
    const selectedClasses = isSelected
        ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20'
        : 'bg-gray-50 dark:bg-gray-800';

    return `
        <div class="${selectedClasses} rounded-lg p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all text-center"
             data-box-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'box', boxIndex: selectedBox, index })}'>
            <img src="${spriteUrl(mon.dexId)}" alt="${mon.speciesName}" class="w-10 h-10 mx-auto pixelated" onerror="this.style.display='none'">
            <div class="font-bold text-[11px] text-gray-900 dark:text-white truncate mt-0.5">${mon.nickname || mon.speciesName}</div>
            <div class="text-[10px] text-gray-400">Lv.${mon.level}</div>
            <div class="flex justify-center gap-0.5 mt-0.5">${typeDotsHTML(types)}</div>
        </div>`;
}

function _renderEmptyBoxSlot(index) {
    return `
        <div class="rounded-lg p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[70px] text-gray-300 dark:text-gray-600 text-xs"
             data-box-index="${index}">
        </div>`;
}

export function render(data, appState, theme, eventBus, localState) {
    const boxIdx = localState.selectedBox;
    const box = data.pcBoxes?.[boxIdx] || [];
    const isMoveMode = appState.getIsMoveMode();
    const selections = appState.getCurrentTabSelections();

    return `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        ${PCBoxNavigator.render(data, boxIdx, theme)}
        <div class="grid grid-cols-5 gap-2" id="pc-box-grid">
            ${Array.from({ length: 20 }, (_, i) => {
                const mon = box[i];
                const isSelected = selections.some(s => s.type === 'box' && s.boxIndex === boxIdx && s.index === i);
                if (mon && matchesSearchFilter(mon)) return _renderBoxSlot(mon, i, localState.selectedBox, isSelected);
                if (mon && !matchesSearchFilter(mon)) return _renderEmptyBoxSlot(i);
                return _renderEmptyBoxSlot(i);
            }).join('')}
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // PC Box Navigator events
    PCBoxNavigator.bindEvents(container, eventBus, theme, appState, localState, updateFn);

    // ---- PC Box Slots ----
    container.querySelectorAll('[data-box-index]').forEach(slot => {
        slot.addEventListener('click', (e) => {
            const idx = Number(slot.dataset.boxIndex);
            const loc = { type: 'box', boxIndex: localState.selectedBox, index: idx };
            if (appState.getIsMoveMode()) {
                appState.handleGlobalPokemonSelect(loc, e);
            } else {
                const tab = appState.getActiveTab();
                const mon = tab?.data?.pcBoxes?.[localState.selectedBox]?.[idx];
                if (mon) {
                    eventBus.emit(Events.OPEN_POKEMON_EDITOR, { mon, source: 'box', index: idx, boxIndex: localState.selectedBox });
                }
            }
        });

        slot.addEventListener('dragstart', (e) => {
            const idx = Number(slot.dataset.boxIndex);
            const data = JSON.stringify({ type: 'box', boxIndex: localState.selectedBox, index: idx });
            e.dataTransfer.setData('text/plain', data);
            e.dataTransfer.effectAllowed = 'move';
        });

        slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const idx = Number(slot.dataset.boxIndex);
            appState.handleGlobalDrop({ type: 'box', boxIndex: localState.selectedBox, index: idx }, e);
        });
    });
}
