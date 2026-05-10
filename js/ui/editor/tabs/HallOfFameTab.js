/**
 * HallOfFameTab.js — Hall of Fame Team Viewer
 *
 * Refactored: Uses adapter for Pokemon types. For unsupported generations,
 * shows a "Coming Soon" placeholder.
 */

import { spriteUrl, typeDotsHTML, gameHeaderColor } from '../shared/helpers.js';

export function render(data, appState, theme, eventBus, localState) {
    const adapter = appState?.getActiveAdapter?.() || null;
    const teams = data.hallOfFame || [];

    if (teams.length === 0) {
        return `
        <div class="w-full">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12">
                <div class="flex flex-col items-center text-center">
                    <i data-lucide="trophy" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 class="text-lg font-black text-gray-400 dark:text-gray-600 mb-2">No Records Found</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-600">Beat the Elite Four to record your first Hall of Fame team!</p>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="w-full space-y-6">
        ${teams.map((team, ti) => {
            const pokemon = Array.isArray(team) ? team : (team.pokemon || []);
            return `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <!-- Golden Header -->
                <div class="p-4 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 flex items-center gap-2">
                    <i data-lucide="crown" class="w-5 h-5 text-yellow-900"></i>
                    <span class="font-black text-yellow-900 text-sm uppercase tracking-wider">Champion Team #${ti + 1}</span>
                </div>
                <!-- Team Grid -->
                <div class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    ${pokemon.map(mon => {
                        if (!mon) return '<div class="text-center text-gray-400 text-xs py-4">Empty</div>';
                        let types = ['Normal'];
                        if (adapter) {
                            types = adapter.getPokemonTypes(mon.dexId);
                        }
                        return `
                        <div class="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <img src="${spriteUrl(mon.dexId)}" alt="${mon.speciesName || mon.nickname}" class="w-14 h-14 pixelated" onerror="this.style.display='none'">
                            <div class="font-bold text-xs text-gray-900 dark:text-white mt-1 truncate w-full text-center">${mon.nickname || mon.speciesName || '???'}</div>
                            <div class="text-[10px] text-gray-400">Lv.${mon.level || '?'}</div>
                            <div class="flex gap-0.5 mt-0.5">${typeDotsHTML(types)}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // No interactive events for Hall of Fame viewer
}
