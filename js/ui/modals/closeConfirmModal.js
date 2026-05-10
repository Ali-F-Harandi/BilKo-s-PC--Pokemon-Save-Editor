/**
 * closeConfirmModal.js — Close Tab Confirmation Modal
 * 
 * Ported from CloseConfirmationModal in App.tsx
 */

import { EventBus, Events } from '../../state/eventBus.js';

export function initCloseConfirmModal(container, eventBus, appState) {
    eventBus.on(Events.OPEN_CLOSE_CONFIRM, (tabId) => {
        _render(container, eventBus, appState, tabId);
    });

    eventBus.on(Events.CLOSE_CLOSE_CONFIRM, () => {
        container.innerHTML = '';
    });
}

function _render(container, eventBus, appState, tabId) {
    const tab = appState.getTabs().find(t => t.id === tabId);
    if (!tab) return;

    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[300]">
            <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-zoom-in-95 overflow-hidden">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="alert-triangle" class="w-6 h-6 text-yellow-600 dark:text-yellow-500"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                        Close "${tab.filename}"?
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">You have unsaved changes.</p>
                </div>
                <div class="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-950/50">
                    <button id="close-save-btn" class="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm">
                        <i data-lucide="save" class="w-4 h-4"></i> Save & Close
                    </button>
                    <button id="close-discard-btn" class="w-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold py-2 rounded-lg transition-colors">
                        Discard Changes
                    </button>
                    <button id="close-cancel-btn" class="w-full text-gray-500 font-bold text-sm mt-2 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('close-save-btn')?.addEventListener('click', () => {
        appState.confirmCloseTab(true);
    });
    document.getElementById('close-discard-btn')?.addEventListener('click', () => {
        appState.confirmCloseTab(false);
    });
    document.getElementById('close-cancel-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
    });

    if (window.lucide) window.lucide.createIcons();
}
