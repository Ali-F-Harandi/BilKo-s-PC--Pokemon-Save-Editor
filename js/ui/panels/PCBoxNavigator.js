/**
 * PCBoxNavigator.js — PC Box Navigation Controls
 *
 * Extracted from editorDashboard.js _renderPCHeader navigation section.
 * Renders prev/next/select/set-active box controls.
 */

import { gameHeaderColor, sectionHeaderHTML } from '../editor/shared/helpers.js';

export function render(data, boxIdx, theme) {
    const headerColor = gameHeaderColor(theme);
    const boxCount = data.pcBoxes?.[boxIdx]?.length || 0;

    return `
    <div class="flex flex-wrap items-center gap-2 mb-4">
        ${sectionHeaderHTML('monitor', `BOX ${boxIdx + 1}`, theme,
            `<span class="text-xs text-gray-400 ml-1">(${boxCount}/20)</span>`)}
        <div class="ml-auto flex items-center gap-1.5">
            <!-- Box Nav -->
            <button id="box-prev" class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" ${boxIdx <= 0 ? 'disabled' : ''}>
                <i data-lucide="chevron-left" class="w-4 h-4 text-gray-600 dark:text-gray-400"></i>
            </button>
            <select id="box-select" class="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 border-none outline-none cursor-pointer">
                ${Array.from({ length: 12 }, (_, i) =>
                    `<option value="${i}" ${i === boxIdx ? 'selected' : ''}>BOX ${i + 1}${i === data.currentBoxId ? ' ★' : ''}</option>`
                ).join('')}
            </select>
            <button id="box-next" class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" ${boxIdx >= 11 ? 'disabled' : ''}>
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 dark:text-gray-400"></i>
            </button>
            ${boxIdx !== data.currentBoxId ? `<button id="set-active-box" class="px-2 py-1 rounded-lg text-xs font-bold text-white transition-colors hover:brightness-110" style="background-color:${headerColor}">Set Active</button>` : ''}
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    const boxPrev = container.querySelector('#box-prev');
    if (boxPrev) boxPrev.addEventListener('click', () => { localState.selectedBox = Math.max(0, localState.selectedBox - 1); updateFn(); });

    const boxNext = container.querySelector('#box-next');
    if (boxNext) boxNext.addEventListener('click', () => { localState.selectedBox = Math.min(11, localState.selectedBox + 1); updateFn(); });

    const boxSelect = container.querySelector('#box-select');
    if (boxSelect) boxSelect.addEventListener('change', (e) => { localState.selectedBox = Number(e.target.value); updateFn(); });

    const setActiveBox = container.querySelector('#set-active-box');
    if (setActiveBox) setActiveBox.addEventListener('click', () => { appState.handleSetActiveBox(localState.selectedBox); });
}
