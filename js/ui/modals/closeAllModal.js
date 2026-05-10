/**
 * closeAllModal.js — Close All Tabs Confirmation Modal
 * 
 * Ported from CloseAllModal in App.tsx
 */

import { EventBus, Events } from '../../state/eventBus.js';

export function initCloseAllModal(container, eventBus, appState) {
    eventBus.on(Events.OPEN_CLOSE_ALL_CONFIRM, () => {
        _render(container, eventBus, appState);
    });

    eventBus.on(Events.CLOSE_CLOSE_ALL_CONFIRM, () => {
        container.innerHTML = '';
    });
}

function _render(container, eventBus, appState) {
    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[600]">
            <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-zoom-in-95 overflow-hidden">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="trash-2" class="w-7 h-7 text-red-600 dark:text-red-500"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Close All Tabs?</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to close all open save files? Any unsaved progress will be lost.</p>
                </div>
                <div class="flex gap-3 p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
                    <button id="closeall-cancel-btn" class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-colors">Cancel</button>
                    <button id="closeall-confirm-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/20">Close All</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('closeall-cancel-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
    });
    document.getElementById('closeall-confirm-btn')?.addEventListener('click', () => {
        appState.performCloseAll();
    });

    if (window.lucide) window.lucide.createIcons();
}
