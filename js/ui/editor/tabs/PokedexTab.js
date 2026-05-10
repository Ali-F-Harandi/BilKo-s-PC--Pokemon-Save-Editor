/**
 * PokedexTab.js — Pokedex Grid with Owned/Seen Toggles
 *
 * Extracted from editorDashboard.js _renderPokedexTab.
 */

import { Events } from '../../../state/eventBus.js';
import { getPokemonName } from '../../../data/pokemonNames.js';
import { spriteUrl, sectionHeaderHTML } from '../shared/helpers.js';

function _renderPokedexEntry(entry, isOwned, isSeen) {
    const state = isOwned ? 'owned' : isSeen ? 'seen' : 'hidden';
    const borderCls = state === 'owned' ? 'border-green-500 ring-1 ring-green-400' : state === 'seen' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-200 dark:border-gray-700';
    const bgCls = state === 'hidden' ? 'bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800';
    const iconHtml = state === 'owned' ? '<i data-lucide="check" class="w-3 h-3 text-green-600"></i>' : state === 'seen' ? '<i data-lucide="eye" class="w-3 h-3 text-blue-500"></i>' : '';
    const showSprite = state !== 'hidden';

    return `
        <button class="pokedex-entry flex flex-col items-center p-2 rounded-lg border-2 ${borderCls} ${bgCls} cursor-pointer hover:shadow-md transition-all" data-dex-id="${entry.dexId}" data-dex-state="${state}">
            ${showSprite
                ? `<img src="${spriteUrl(entry.dexId)}" alt="${entry.name}" class="w-10 h-10 pixelated" onerror="this.style.display='none'">`
                : `<div class="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">?</div>`}
            <div class="text-[10px] text-gray-400 font-mono mt-0.5">#${String(entry.dexId).padStart(3, '0')}</div>
            <div class="text-[11px] font-bold text-gray-900 dark:text-white truncate w-full text-center">${showSprite ? entry.name : '???'}</div>
            <div class="mt-0.5">${iconHtml}</div>
        </button>`;
}

export function render(data, appState, theme, eventBus, localState) {
    const owned = localState.pokedexOwned || data.pokedexOwnedFlags || new Array(152).fill(false);
    const seen = localState.pokedexSeen || data.pokedexSeenFlags || new Array(152).fill(false);
    const sortBy = localState.pokedexSortBy;
    const search = localState.pokedexSearch.toLowerCase();

    const ownedCount = owned.slice(1, 152).filter(Boolean).length;
    const seenCount = seen.slice(1, 152).filter(Boolean).length;

    let entries = [];
    for (let i = 1; i <= 151; i++) {
        const name = getPokemonName(i);
        if (search && !name.toLowerCase().includes(search) && !String(i).includes(search)) continue;
        entries.push({ dexId: i, name });
    }
    if (sortBy === 'name') entries.sort((a, b) => a.name.localeCompare(b.name));

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('book', 'Pokédex', theme,
                `<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">Owned: <b class="text-green-600 dark:text-green-400">${ownedCount}</b>/151 | Seen: <b class="text-blue-600 dark:text-blue-400">${seenCount}</b>/151</span>`)}
            <!-- Controls -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
                <div class="relative flex-grow max-w-xs">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                    <input id="pokedex-search" type="text" placeholder="Search Pokémon..." value="${localState.pokedexSearch}"
                        class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button class="pokedex-sort-btn px-3 py-2 rounded-lg text-xs font-bold transition-colors ${sortBy === 'id' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-pokedex-sort="id">
                    <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>ID
                </button>
                <button class="pokedex-sort-btn px-3 py-2 rounded-lg text-xs font-bold transition-colors ${sortBy === 'name' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-pokedex-sort="name">
                    <i data-lucide="a-arrow-down" class="w-3 h-3 inline mr-1"></i>Name
                </button>
            </div>
            <!-- Grid -->
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                ${entries.map(e => _renderPokedexEntry(e, owned[e.dexId], seen[e.dexId])).join('')}
            </div>
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Pokédex ----
    const dexSearch = container.querySelector('#pokedex-search');
    if (dexSearch) {
        dexSearch.addEventListener('input', (e) => {
            localState.pokedexSearch = e.target.value;
            updateFn();
        });
    }

    container.querySelectorAll('.pokedex-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localState.pokedexSortBy = btn.dataset.pokedexSort;
            updateFn();
        });
    });

    container.querySelectorAll('.pokedex-entry').forEach(entry => {
        entry.addEventListener('click', () => {
            const dexId = Number(entry.dataset.dexId);
            const state = entry.dataset.dexState;
            const owned = localState.pokedexOwned;
            const seen = localState.pokedexSeen;

            if (state === 'hidden') {
                seen[dexId] = true;
            } else if (state === 'seen') {
                owned[dexId] = true;
            } else if (state === 'owned') {
                owned[dexId] = false;
                seen[dexId] = false;
            }

            appState.handlePokedexUpdate(owned, seen);
            eventBus.emit(Events.POKEDEX_UPDATED, { owned, seen });
        });
    });
}
