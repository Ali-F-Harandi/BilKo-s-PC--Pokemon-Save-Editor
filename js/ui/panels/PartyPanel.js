/**
 * PartyPanel.js — Party Grid Panel
 *
 * Redesigned with premium card styling: rounded-3xl cards,
 * level pills, sprite boxes, bold type badges, HP bars.
 * Selection highlighting via appState.getCurrentTabSelections().
 * Supports drag/drop and long-press move mode.
 */

import { Events } from '../../state/eventBus.js';
import { spriteUrl, typeBadgeHTML, hpBarHTML, matchesSearchFilter, _renderEmptySlot, sectionHeaderHTML } from '../editor/shared/helpers.js';

/**
 * Get types for a Pokemon using the adapter if available, falling back to typeNames from parsed data.
 * This ensures Gen 2 Pokemon types are correctly resolved.
 * Handles solo-type Pokemon where typeNames[1] is '' (empty).
 */
function _getTypesForMon(mon, adapter) {
    // First check if the Pokemon has typeNames from parsing
    if (mon.typeNames && mon.typeNames.length > 0) {
        // Filter out empty strings (solo-type Pokemon have typeNames[1] = '')
        // and duplicate types (legacy Gen1 data where type1 === type2)
        return mon.typeNames.filter((t, i) => {
            if (!t || t === '') return false;
            if (i === 1 && mon.typeNames[0] && t === mon.typeNames[0]) return false;
            return true;
        });
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

    // HP bar color
    const hpPct = mon.maxHp > 0 ? Math.max(0, Math.min(100, (mon.hp / mon.maxHp) * 100)) : 0;
    const hpColor = hpPct > 50 ? 'bg-green-500' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-500';

    const selectedClasses = isSelected
        ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-500/20'
        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1';

    return `
        <div class="rounded-3xl p-5 border-2 shadow-lg transition-all duration-300 relative group cursor-pointer ${selectedClasses}"
             data-party-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'party', index })}'>

            <!-- Level Pill -->
            <div class="absolute top-4 right-4 bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">
                LV <span class="text-gray-900">${mon.level || 1}</span>
            </div>

            <div class="flex items-start gap-4">
                <!-- Sprite Box -->
                <div class="bg-gray-50 rounded-2xl p-2 w-20 h-20 flex items-center justify-center shrink-0 border-2 border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <img src="${spriteUrl_}" alt="${mon.speciesName}" class="w-16 h-16 pixelated drop-shadow-sm group-hover:scale-110 transition-transform duration-300" onerror="this.src='${spriteUrl(0)}'">
                </div>

                <!-- Info -->
                <div class="flex-1 pt-1">
                    <div class="font-black text-xl text-gray-900 dark:text-white truncate tracking-tight uppercase">${mon.nickname || mon.speciesName}</div>
                    <div class="text-xs font-bold text-gray-400 capitalize mb-2">${mon.speciesName}</div>
                    <div class="flex gap-2">${types.map(t => typeBadgeHTML(t)).join('')}</div>
                </div>
            </div>

            <!-- HP Bar -->
            <div class="mt-5">
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[9px] font-black tracking-widest text-gray-400 uppercase">HP</span>
                    <div class="flex-grow bg-gray-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full transition-all duration-500 ${hpColor}" style="width:${hpPct}%"></div>
                    </div>
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 tracking-wider">${mon.hp}/${mon.maxHp}</span>
                </div>
            </div>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
