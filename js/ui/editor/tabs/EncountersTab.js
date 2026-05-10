/**
 * EncountersTab.js — Mystery Gift Search + Event Cards
 *
 * Extracted from editorDashboard.js _renderEncountersTab.
 */

import { Events } from '../../../state/eventBus.js';
import { EVENT_DISTRIBUTIONS } from '../../../data/eventDistributions.js';
import { parsePk1 } from '../../../engine/parser.js';
import { spriteUrl, typeBadgeHTML, gameHeaderColor, sectionHeaderHTML } from '../shared/helpers.js';
import { getPokemonTypes } from '../../../data/pokemonTypes.js';

function _renderEventCard(event, theme) {
    const headerColor = gameHeaderColor(theme);
    const types = getPokemonTypes(event.previewDexId);

    return `
    <div class="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex gap-3 p-4">
            <img src="${spriteUrl(event.previewDexId)}" alt="${event.title}" class="w-16 h-16 pixelated shrink-0" onerror="this.style.display='none'">
            <div class="flex-1 min-w-0">
                <div class="font-bold text-sm text-gray-900 dark:text-white">${event.title}</div>
                <div class="flex gap-1 mt-1">${types.map(t => typeBadgeHTML(t)).join('')}</div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">${event.description}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                    ${event.tags.map(t => `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">${t}</span>`).join('')}
                </div>
            </div>
        </div>
        <div class="px-4 pb-3">
            <button class="add-to-box-btn w-full py-1.5 rounded-lg text-xs font-bold text-white transition-colors hover:brightness-110" style="background-color:${headerColor}" data-event-id="${event.id}">
                <i data-lucide="plus" class="w-3 h-3 inline mr-1"></i>Add to Box
            </button>
        </div>
    </div>`;
}

export function render(data, appState, theme, eventBus, localState) {
    const search = localState.encounterSearch.toLowerCase();
    const filtered = EVENT_DISTRIBUTIONS.filter(e =>
        !search || e.title.toLowerCase().includes(search) || e.description.toLowerCase().includes(search) || e.tags.some(t => t.includes(search))
    );

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('gift', 'Mystery Gift', theme)}
            <!-- Search -->
            <div class="relative mb-6">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                <input id="encounter-search" type="text" placeholder="Search events..." value="${localState.encounterSearch}"
                    class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <!-- Event Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${filtered.map(e => _renderEventCard(e, theme)).join('')}
                ${filtered.length === 0 ? '<div class="col-span-2 text-center text-gray-400 py-8">No events found</div>' : ''}
            </div>
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Encounter Search ----
    const encSearch = container.querySelector('#encounter-search');
    if (encSearch) {
        encSearch.addEventListener('input', (e) => {
            localState.encounterSearch = e.target.value;
            updateFn();
        });
    }

    // Add to Box buttons
    container.querySelectorAll('.add-to-box-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const event = EVENT_DISTRIBUTIONS.find(e => e.id === eventId);
            if (event && event.bytes) {
                const bytes = event.bytes;
                let pk1Data = new Uint8Array(bytes);

                if (pk1Data.length === 71) {
                    pk1Data = pk1Data.slice(0, 69);
                }

                const mon = parsePk1(pk1Data);
                if (mon) {
                    mon.isParty = false;
                    appState.handleAddPokemon(mon, 'pc');
                    eventBus.emit(Events.POKEMON_ADDED, { mon, target: 'pc' });
                } else {
                    appState.showToast('Failed to parse event Pokémon data.');
                }
            }
        });
    });
}
