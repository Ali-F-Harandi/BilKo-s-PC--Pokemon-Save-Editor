/**
 * errorModal.js — Error Display Modal
 * 
 * Ported from ErrorModal in App.tsx
 */

import { EventBus, Events } from '../../state/eventBus.js';

export function initErrorModal(container, eventBus, appState) {
    eventBus.on(Events.OPEN_ERROR_MODAL, (message) => {
        _render(container, message);
    });

    eventBus.on(Events.CLOSE_ERROR_MODAL, () => {
        container.innerHTML = '';
    });
}

function _render(container, message) {
    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[600]">
            <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 animate-zoom-in-95 overflow-hidden">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="alert-circle" class="w-8 h-8 text-red-600 dark:text-red-500"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Load Error</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">${message || ''}</p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
                    <button id="error-dismiss-btn" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/20">Dismiss</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('error-dismiss-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
    });

    if (window.lucide) window.lucide.createIcons();
}
