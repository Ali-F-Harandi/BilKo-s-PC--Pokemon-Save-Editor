/**
 * PartyPanel.js — Party Grid Panel
 *
 * Extracted from editorDashboard.js _renderHomeTab party section.
 * Renders 6 party slots with sprites, type badges, HP bars, drag/drop.
 */

import { Events } from '../../state/eventBus.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { spriteUrl, typeBadgeHTML, hpBarHTML, matchesSearchFilter, _renderEmptySlot, sectionHeaderHTML } from '../editor/shared/helpers.js';

function _renderPartyCard(mon, index) {
    if (!mon) return _renderEmptySlot('party', index);
    const types = getPokemonTypes(mon.dexId);
    const spriteUrl_ = spriteUrl(mon.dexId);

    return `
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow group"
             data-party-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'party', index })}'>
            <div class="flex items-start gap-2">
                <img src="${spriteUrl_}" alt="${mon.speciesName}" class="w-12 h-12 pixelated group-hover:scale-110 transition-transform" onerror="this.style.display='none'">
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm text-gray-900 dark:text-white truncate">${mon.nickname || mon.speciesName}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Lv.${mon.level} ${mon.speciesName}</div>
                    <div class="flex gap-1 mt-0.5">${types.map(t => typeBadgeHTML(t)).join('')}</div>
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
    return `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        ${sectionHeaderHTML('heart', `Party (${data.party?.length || 0}/6)`, theme,
            `<span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">${data.party?.length || 0}</span>`)}
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
            ${(data.party || []).map((mon, i) => matchesSearchFilter(mon) ? _renderPartyCard(mon, i) : _renderEmptySlot('party', i)).join('')}
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
