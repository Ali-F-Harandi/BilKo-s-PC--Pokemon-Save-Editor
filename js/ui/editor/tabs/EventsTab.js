/**
 * EventsTab.js — World Events Flag Editor
 *
 * Refactored: Uses adapter for event data. For unsupported generations,
 * shows a "Coming Soon" placeholder.
 */

import { Events } from '../../../state/eventBus.js';
import { GEN1_EVENTS } from '../../../data/events.js';
import { sectionHeaderHTML } from '../shared/helpers.js';

export function render(data, appState, theme, eventBus, localState) {
    const adapter = appState?.getActiveAdapter?.() || null;
    const generationId = adapter ? adapter.generationId : (data?.generationId || data?.generation || 1);

    // Only Gen1 has events data currently
    if (generationId !== 1) {
        return `
        <div class="w-full">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12">
                <div class="flex flex-col items-center text-center">
                    <i data-lucide="clock" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 class="text-lg font-black text-gray-400 dark:text-gray-600 mb-2">Coming Soon</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-600">World Events editing is not yet supported for Generation ${generationId}. It will be available in a future update.</p>
                </div>
            </div>
        </div>`;
    }

    const flags = localState.eventFlags || data.eventFlags || [];

    // Group events by category
    const grouped = {};
    for (const ev of GEN1_EVENTS) {
        if (!grouped[ev.category]) grouped[ev.category] = [];
        grouped[ev.category].push(ev);
    }

    const categoryIcons = { Legendary: 'crown', Gift: 'gift', Interaction: 'user' };

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('map-pin', 'World Events', theme)}
            <!-- Note -->
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <div class="flex items-start gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0"></i>
                    <p class="text-xs text-yellow-700 dark:text-yellow-300"><b>Available</b> = The Pokémon or item has NOT been obtained/defeated yet. <b>Defeated/Obtained</b> = The encounter has been completed and is no longer available in the wild.</p>
                </div>
            </div>
            <!-- Categories -->
            <div class="space-y-6">
                ${Object.entries(grouped).map(([cat, events]) => `
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <i data-lucide="${categoryIcons[cat] || 'circle'}" class="w-4 h-4 text-gray-500"></i>
                            <h3 class="font-black text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">${cat}</h3>
                            <div class="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div class="space-y-2">
                            ${events.map(ev => {
                                const flagVal = flags[ev.offset] ?? false;
                                return `
                                <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <div>
                                        <div class="font-bold text-sm text-gray-900 dark:text-white">${ev.name}</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">${ev.description}</div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer event-flag-toggle" data-event-offset="${ev.offset}" ${flagVal ? 'checked' : ''}>
                                        <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-green-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                    </label>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    // ---- Event Flags ----
    container.querySelectorAll('.event-flag-toggle').forEach(toggle => {
        toggle.addEventListener('change', () => {
            const offset = Number(toggle.dataset.eventOffset);
            const flags = localState.eventFlags;
            flags[offset] = !flags[offset];
            appState.handleEventFlagsUpdate(flags);
            eventBus.emit(Events.EVENT_FLAGS_UPDATED, flags);
        });
    });
}
