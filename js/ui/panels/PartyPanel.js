/**
 * PartyPanel.js — Party Grid Panel
 *
 * Extracted from editorDashboard.js _renderHomeTab party section.
 * Renders 6 party slots with sprites, type badges, HP bars, drag/drop.
 * Supports selection highlighting via appState.getCurrentTabSelections().
 *
 * MODIFIED: Taller party cards with more vertical layout, bigger sprites,
 * species + nickname display, type badges with icons and color.
 */

import { Events } from '../../state/eventBus.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { spriteUrl, typeBadgeWithIconHTML, hpBarHTML, matchesSearchFilter, _renderEmptySlot, sectionHeaderHTML } from '../editor/shared/helpers.js';

function _renderPartyCard(mon, index, isSelected) {
    if (!mon) return _renderEmptySlot('party', index);
    const types = getPokemonTypes(mon.dexId);
    const spriteUrl_ = spriteUrl(mon.dexId);
    const selectedClasses = isSelected
        ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20'
        : 'bg-gray-50 dark:bg-gray-800';

    // Show nickname if different from species name
    const hasNickname = mon.nickname && mon.nickname !== mon.speciesName;
    const nicknameHTML = hasNickname
        ? `<div class="text-xs text-gray-500 dark:text-gray-400 italic">"${mon.nickname}"</div>`
        : '';

    return `
        <div class="${selectedClasses} rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all group min-h-[140px]"
             data-party-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'party', index })}'>
            <div class="flex flex-col items-center text-center gap-2">
                <img src="${spriteUrl_}" alt="${mon.speciesName}" class="w-16 h-16 pixelated group-hover:scale-110 transition-transform" onerror="this.style.display='none'">
                <div class="flex-1 min-w-0 w-full">
                    <div class="font-bold text-sm text-gray-900 dark:text-white truncate">${mon.speciesName}</div>
                    ${nicknameHTML}
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lv.${mon.level}</div>
                    <div class="flex flex-wrap justify-center gap-1 mt-1">${types.map(t => typeBadgeWithIconHTML(t)).join('')}</div>
                </div>
            </div>
            ${hpBarHTML(mon.hp, mon.maxHp)}
        </div>`;
}

function _renderEmptyPartySlots(count) {
    let html = '';
    for (let i = count; i < 6; i++) html += _renderEmptySlot('party', i);
    return html;
}

export function render(data, appState, theme, eventBus, localState) {
    const selections = appState.getCurrentTabSelections();
    return `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        ${sectionHeaderHTML('heart', `Party (${data.party?.length || 0}/6)`, theme,
            `<span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">${data.party?.length || 0}</span>`)}
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            ${(data.party || []).map((mon, i) => {
                const isSelected = selections.some(s => s.type === 'party' && s.index === i);
                return matchesSearchFilter(mon) ? _renderPartyCard(mon, i, isSelected) : _renderEmptySlot('party', i);
            }).join('')}
            ${_renderEmptyPartySlots(data.party?.length || 0)}
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Party Cards ----
    container.querySelectorAll('[data-party-index]').forEach(card => {
        card.addEventListener('click', (e) => {
            const idx = Number(card.dataset.partyIndex);
            const loc = { type: 'party', index: idx };
            if (appState.getIsMoveMode()) {
                appState.handleGlobalPokemonSelect(loc, e);
            } else {
                const tab = appState.getActiveTab();
                const mon = tab?.data?.party?.[idx];
                if (mon) {
                    eventBus.emit(Events.OPEN_POKEMON_EDITOR, { mon, source: 'party', index: idx });
                }
            }
        });

        card.addEventListener('dragstart', (e) => {
            const idx = Number(card.dataset.partyIndex);
            const data = JSON.stringify({ type: 'party', index: idx });
            e.dataTransfer.setData('text/plain', data);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const idx = Number(card.dataset.partyIndex);
            appState.handleGlobalDrop({ type: 'party', index: idx }, e);
        });

        // Long press for move mode
        let longPressTimer = null;
        card.addEventListener('pointerdown', () => {
            longPressTimer = setTimeout(() => {
                if (!appState.getIsMoveMode()) {
                    appState.handleMoveModeToggle(true);
                }
            }, 600);
        });
        card.addEventListener('pointerup', () => clearTimeout(longPressTimer));
        card.addEventListener('pointerleave', () => clearTimeout(longPressTimer));
    });
}
