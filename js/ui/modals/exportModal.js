/**
 * exportModal.js — Export Save File Modal
 *
 * Ported from components/editor/ExportModal.tsx
 *
 * Features:
 * - Header with Save icon, title, and close button
 * - Two format selection buttons (.sav and .srm) with themed colors
 * - Hover effects with border, background, and color shifts
 * - Cancel link at bottom
 * - Backdrop click or Escape to dismiss
 */

import { Events } from '../../state/eventBus.js';

/** @type {boolean} Whether the modal is currently visible */
let _isOpen = false;

/** @type {HTMLElement|null} The container element reference */
let _container = null;

/** @type {import('../../state/eventBus.js').EventBus|null} */
let _eventBus = null;

/** @type {import('../../state/appState.js').AppState|null} */
let _appState = null;

/**
 * Initialize the export modal.
 * Listens for OPEN_EXPORT_MODAL / CLOSE_EXPORT_MODAL events.
 *
 * @param {HTMLElement} container - DOM element to render the modal into
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initExportModal(container, eventBus, appState) {
    _container = container;
    _eventBus = eventBus;
    _appState = appState;

    eventBus.on(Events.OPEN_EXPORT_MODAL, () => {
        _isOpen = true;
        _render();
    });

    eventBus.on(Events.CLOSE_EXPORT_MODAL, () => {
        _close();
    });
}

/**
 * Render the full export modal into the container.
 * @private
 */
function _render() {
    if (!_container) return;

    _container.innerHTML = `
        <!-- Backdrop -->
        <div
            id="export-modal-backdrop"
            class="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm animate-fade-in"
        ></div>

        <!-- Modal Content -->
        <div
            id="export-modal-content"
            class="fixed inset-0 z-[251] flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="w-full max-w-sm rounded-2xl overflow-hidden
                        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                        border border-slate-700 dark:border-slate-600
                        animate-zoom-in-95">

                <!-- Header -->
                <div class="bg-slate-800 px-5 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                            <i data-lucide="save" class="w-4 h-4 text-slate-300"></i>
                        </div>
                        <h3 class="text-base font-bold text-white tracking-wide">
                            Export Save File
                        </h3>
                    </div>
                    <button
                        id="export-modal-close-btn"
                        class="w-8 h-8 flex items-center justify-center
                               rounded-lg bg-slate-700/50 hover:bg-slate-600
                               text-slate-400 hover:text-white
                               transition-colors duration-150"
                        aria-label="Close export modal"
                    >
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="bg-white dark:bg-slate-900 px-5 py-5 space-y-3">

                    <!-- Format: .sav -->
                    <button
                        id="export-sav-btn"
                        class="w-full group flex items-start gap-3.5 p-4 rounded-xl
                               border-2 border-green-200 dark:border-green-900/50
                               bg-green-50/50 dark:bg-green-900/10
                               hover:border-green-400 dark:hover:border-green-500
                               hover:bg-green-50 dark:hover:bg-green-900/20
                               transition-all duration-150 text-left"
                    >
                        <div class="flex-shrink-0 w-10 h-10 rounded-lg
                                    bg-green-100 dark:bg-green-900/30
                                    group-hover:bg-green-200 dark:group-hover:bg-green-800/40
                                    flex items-center justify-center
                                    transition-colors duration-150">
                            <i data-lucide="save" class="w-5 h-5 text-green-600 dark:text-green-400
                                                        group-hover:text-green-700 dark:group-hover:text-green-300
                                                        transition-colors duration-150"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-sm text-green-700 dark:text-green-400
                                        group-hover:text-green-800 dark:group-hover:text-green-300
                                        transition-colors duration-150">
                                Standard (.sav)
                            </div>
                            <div class="text-xs text-green-600/70 dark:text-green-500/60
                                        group-hover:text-green-700/80 dark:group-hover:text-green-400/70
                                        mt-0.5 leading-relaxed transition-colors duration-150">
                                Compatible with most emulators and flash carts.
                            </div>
                        </div>
                    </button>

                    <!-- Format: .srm -->
                    <button
                        id="export-srm-btn"
                        class="w-full group flex items-start gap-3.5 p-4 rounded-xl
                               border-2 border-blue-200 dark:border-blue-900/50
                               bg-blue-50/50 dark:bg-blue-900/10
                               hover:border-blue-400 dark:hover:border-blue-500
                               hover:bg-blue-50 dark:hover:bg-blue-900/20
                               transition-all duration-150 text-left"
                    >
                        <div class="flex-shrink-0 w-10 h-10 rounded-lg
                                    bg-blue-100 dark:bg-blue-900/30
                                    group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40
                                    flex items-center justify-center
                                    transition-colors duration-150">
                            <i data-lucide="settings" class="w-5 h-5 text-blue-600 dark:text-blue-400
                                                            group-hover:text-blue-700 dark:group-hover:text-blue-300
                                                            transition-colors duration-150"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-sm text-blue-700 dark:text-blue-400
                                        group-hover:text-blue-800 dark:group-hover:text-blue-300
                                        transition-colors duration-150">
                                RetroArch (.srm)
                            </div>
                            <div class="text-xs text-blue-600/70 dark:text-blue-500/60
                                        group-hover:text-blue-700/80 dark:group-hover:text-blue-400/70
                                        mt-0.5 leading-relaxed transition-colors duration-150">
                                Commonly used by RetroArch cores (Gambatte/mGBA).
                            </div>
                        </div>
                    </button>
                </div>

                <!-- Footer -->
                <div class="bg-slate-50 dark:bg-slate-950/50 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        id="export-cancel-link"
                        class="w-full text-center text-sm font-medium
                               text-slate-400 hover:text-slate-600
                               dark:text-slate-500 dark:hover:text-slate-300
                               transition-colors duration-150 py-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    _attachEventListeners();
    _initLucideIcons();
}

/**
 * Attach all event listeners to the modal elements.
 * @private
 */
function _attachEventListeners() {
    const backdrop = document.getElementById('export-modal-backdrop');
    const closeBtn = document.getElementById('export-modal-close-btn');
    const savBtn = document.getElementById('export-sav-btn');
    const srmBtn = document.getElementById('export-srm-btn');
    const cancelLink = document.getElementById('export-cancel-link');

    // --- Close handlers ---

    if (backdrop) {
        backdrop.addEventListener('click', () => _handleCancel());
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => _handleCancel());
    }

    if (cancelLink) {
        cancelLink.addEventListener('click', () => _handleCancel());
    }

    // Escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape' && _isOpen) {
            _handleCancel();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // --- Export handlers ---

    if (savBtn) {
        savBtn.addEventListener('click', () => {
            if (_appState) {
                _appState.handleExportConfirmed('sav');
            }
        });
    }

    if (srmBtn) {
        srmBtn.addEventListener('click', () => {
            if (_appState) {
                _appState.handleExportConfirmed('srm');
            }
        });
    }
}

/**
 * Handle cancel / close action.
 * Delegates to appState so it can clean up internal state (exportingTabId, etc.)
 * @private
 */
function _handleCancel() {
    if (_appState) {
        _appState.handleExportCancelled();
    } else {
        _close();
    }
}

/**
 * Close the modal and clean up.
 * @private
 */
function _close() {
    _isOpen = false;
    if (_container) {
        _container.innerHTML = '';
    }
}

/**
 * Initialize Lucide icons within the modal.
 * @private
 */
function _initLucideIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
