/**
 * gameVersionSelector.js — Game Version Disambiguation Modal
 *
 * Ported from components/home/GameVersionSelector.tsx
 *
 * Phase 5 Fix: Changed event from raw string 'pendingSaveDataChanged'
 * to Events.PENDING_SAVE_CHANGED constant for consistency.
 *
 * Phase 6: Will be fully implemented with cartridge UI
 */

import { EventBus, Events } from '../../state/eventBus.js';

export function initGameVersionSelector(container, eventBus, appState) {
    // Listen for pending save data changes using proper Events constant
    eventBus.on(Events.PENDING_SAVE_CHANGED, (data) => {
        if (data) {
            _render(container, eventBus, appState, data);
        } else {
            container.innerHTML = '';
        }
    });

    // Also listen for close event
    eventBus.on(Events.CLOSE_VERSION_SELECTOR, () => {
        container.innerHTML = '';
    });
}

function _render(container, eventBus, appState, pendingData) {
    const filename = pendingData.originalFilename || 'Unknown File';

    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[400]" id="version-selector-overlay">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-zoom-in-95 overflow-hidden">
                <div class="p-6 text-center">
                    <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="help-circle" class="w-7 h-7 text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Game Version</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Could not auto-detect the version.</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 font-mono truncate mb-6">${escapeHtml(filename)}</p>

                    <div class="flex gap-4 justify-center">
                        <!-- Red Cartridge -->
                        <button id="version-red-btn"
                            class="flex-1 max-w-[140px] group relative overflow-hidden rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                            style="background: linear-gradient(135deg, #FF3B3B 0%, #cc2200 100%);">
                            <div class="p-4 text-center text-white">
                                <div class="text-2xl font-black mb-1">RED</div>
                                <div class="text-xs opacity-70">Red Version</div>
                            </div>
                            <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/30"></div>
                        </button>

                        <!-- Blue Cartridge -->
                        <button id="version-blue-btn"
                            class="flex-1 max-w-[140px] group relative overflow-hidden rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                            style="background: linear-gradient(135deg, #3B4CCA 0%, #2233aa 100%);">
                            <div class="p-4 text-center text-white">
                                <div class="text-2xl font-black mb-1">BLUE</div>
                                <div class="text-xs opacity-70">Blue Version</div>
                            </div>
                            <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/30"></div>
                        </button>
                    </div>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
                    <button id="version-cancel-btn" class="w-full text-gray-500 font-bold text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-1">Skip This File</button>
                </div>
            </div>
        </div>
    `;

    // Clicking overlay backdrop also cancels
    document.getElementById('version-selector-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'version-selector-overlay') {
            appState.handleVersionCancel();
        }
    });

    document.getElementById('version-red-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
        appState.handleVersionConfirm('Red');
    });
    document.getElementById('version-blue-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
        appState.handleVersionConfirm('Blue');
    });
    document.getElementById('version-cancel-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
        appState.handleVersionCancel();
    });

    if (window.lucide) window.lucide.createIcons();
}

// Simple HTML escape
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
