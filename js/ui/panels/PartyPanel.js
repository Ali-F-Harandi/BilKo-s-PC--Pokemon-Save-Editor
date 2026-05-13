/**
 * PartyPanel.js — Party Grid Panel
 *
 * Extracted from editorDashboard.js _renderHomeTab party section.
 * Renders 6 party slots with sprites, type badges, HP bars, drag/drop.
 * Supports selection highlighting via appState.getCurrentTabSelections().
 */

import { Events } from '../../state/eventBus.js';
import { spriteUrl, typeBadgeHTML, hpBarHTML, matchesSearchFilter, _renderEmptySlot, sectionHeaderHTML } from '../editor/shared/helpers.js';

/**
 * Get types for a Pokemon using the adapter if available, falling back to typeNames from parsed data.
 * This ensures Gen 2 Pokemon types are correctly resolved.
 */
function _getTypesForMon(mon, adapter) {
    // First check if the Pokemon has typeNames from parsing
    if (mon.typeNames && mon.typeNames.length > 0) {
        // Filter out duplicate types for single-type Pokemon
        if (mon.typeNames.length === 2 && mon.typeNames[0] === mon.typeNames[1]) {
            return [mon.typeNames[0]];
        }
        return mon.typeNames;
    }
    // Fall back to adapter lookup
    if (adapter) {
        return adapter.getPokemonTypes(mon.dexId);
    }
    return ['Normal'];
}

function _renderPartyCard(mon, index, isSelected, adapter) {
    if (!mon) return _renderEmptySlot('party', index);
    const types = _getTypesForMon(mon, adapter);
    const spriteUrl_ = spriteUrl(mon.dexId);
    const selectedClasses = isSelected
        ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20'
        : 'bg-gray-50 dark:bg-gray-800';

    return `
        <div class="${selectedClasses} rounded-xl p-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all group"
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
    const selections = appState.getCurrentTabSelections();
    const adapter = appState.getActiveAdapter();
    return `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        ${sectionHeaderHTML('heart', `Party (${data.party?.length || 0}/6)`, theme,
            `<span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">${data.party?.length || 0}</span>`)}
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
            ${(data.party || []).map((mon, i) => {
                const isSelected = selections.some(s => s.type === 'party' && s.index === i);
                return matchesSearchFilter(mon) ? _renderPartyCard(mon, i, isSelected, adapter) : _renderEmptySlot('party', i);
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
