/**
 * loadSaveModal.js — Load Save File Modal (Retro CRT Monitor Edition)
 *
 * Ported from components/editor/LoadSaveModal.tsx
 *
 * Features:
 * - Retro CRT monitor design (scaled-down version of home DropZone)
 * - Drag-and-drop file loading with visual feedback
 * - File picker fallback
 * - Backdrop click to dismiss
 * - Keyboard Escape to close
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

/** @type {boolean} Whether files are being dragged over the monitor */
let _isDragOver = false;

/** @type {Function|null} Reference to the Escape key handler so we can clean it up */
let _escHandler = null;

/**
 * Initialize the load save modal.
 * Listens for OPEN_LOAD_MODAL / CLOSE_LOAD_MODAL events.
 *
 * @param {HTMLElement} container - DOM element to render the modal into
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initLoadSaveModal(container, eventBus, appState) {
    _container = container;
    _eventBus = eventBus;
    _appState = appState;

    eventBus.on(Events.OPEN_LOAD_MODAL, () => {
        _isOpen = true;
        _isDragOver = false;
        _render();
    });

    eventBus.on(Events.CLOSE_LOAD_MODAL, () => {
        _close();
    });
}

/**
 * Render the full modal into the container.
 * @private
 */
function _render() {
    if (!_container) return;

    _container.innerHTML = `
        <!-- Backdrop -->
        <div
            id="load-modal-backdrop"
            class="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md animate-fade-in"
        ></div>

        <!-- Modal Content -->
        <div
            id="load-modal-content"
            class="fixed inset-0 z-[251] flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="relative w-full max-w-sm">

                <!-- Close Button (above the modal) -->
                <button
                    id="load-modal-close-btn"
                    class="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center
                           rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
                           transition-colors duration-150 z-10"
                    aria-label="Close load modal"
                >
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

                <!-- CRT Monitor Housing -->
                <div
                    id="load-modal-monitor"
                    class="bg-stone-200 dark:bg-stone-700 rounded-3xl p-3 sm:p-4
                           shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_3px_rgba(0,0,0,0.1)]
                           dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_3px_rgba(255,255,255,0.05)]
                           border-4 border-stone-300 dark:border-stone-600 relative"
                >
                    <!-- Screen Bezel -->
                    <div
                        id="load-modal-bezel"
                        class="bg-stone-800 rounded-xl p-2.5 sm:p-3 ring-0 transition-all duration-200"
                    >
                        <!-- CRT Screen -->
                        <div
                            id="load-modal-screen"
                            class="bg-[#98D8D8] dark:bg-[#1a2e3a] rounded-lg p-4 sm:p-5
                                   relative overflow-hidden cursor-pointer select-none"
                        >
                            <!-- Scanlines overlay -->
                            <div class="absolute inset-0 pointer-events-none z-[1]"
                                 style="background: repeating-linear-gradient(
                                     0deg,
                                     transparent,
                                     transparent 2px,
                                     rgba(0,0,0,0.12) 2px,
                                     rgba(0,0,0,0.12) 4px
                                 );"
                            ></div>

                            <!-- Glare overlay -->
                            <div class="absolute inset-0 pointer-events-none z-[2]"
                                 style="background: linear-gradient(
                                     135deg,
                                     rgba(255,255,255,0.1) 0%,
                                     transparent 40%,
                                     transparent 60%,
                                     rgba(255,255,255,0.04) 100%
                                 );"
                            ></div>

                            <!-- Screen Content -->
                            <div class="relative z-[3] text-center">
                                <!-- Upload Icon -->
                                <div class="flex items-center justify-center mb-3">
                                    <i data-lucide="upload" class="w-8 h-8 text-stone-600 dark:text-[#7eb8c4]"></i>
                                </div>

                                <!-- Title -->
                                <h3 class="font-mono text-sm sm:text-base font-bold text-stone-700 dark:text-[#b8dce4] uppercase tracking-wider mb-1.5">
                                    Load Save File(s)
                                </h3>

                                <!-- Status Text -->
                                <p id="load-modal-status"
                                   class="font-mono text-[10px] sm:text-xs font-bold tracking-widest
                                          text-stone-500 dark:text-[#6aa8b8] uppercase transition-all duration-200">
                                    SELECT OR DROP FILES
                                </p>

                                <!-- Accepted Formats -->
                                <div class="flex items-center justify-center gap-2 mt-3">
                                    <span class="px-2 py-0.5 rounded bg-stone-300/60 dark:bg-white/10
                                                 text-[9px] sm:text-[10px] font-mono font-bold
                                                 text-stone-600 dark:text-[#7eb8c4]">.sav</span>
                                    <span class="px-2 py-0.5 rounded bg-stone-300/60 dark:bg-white/10
                                                 text-[9px] sm:text-[10px] font-mono font-bold
                                                 text-stone-600 dark:text-[#7eb8c4]">.srm</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Power LED -->
                    <div class="absolute bottom-3 right-4 sm:bottom-4 sm:right-5 flex items-center gap-1.5">
                        <span class="text-[8px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase">Power</span>
                        <div class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444,0_0_12px_rgba(239,68,68,0.5)] animate-pulse"></div>
                    </div>
                </div>

                <!-- Monitor Stand -->
                <div class="mx-auto w-[40%] h-3 bg-gradient-to-b from-stone-300 to-stone-400
                            dark:from-stone-600 dark:to-stone-700 rounded-b-sm"></div>

                <!-- Monitor Base -->
                <div class="mx-auto w-[55%] h-2 bg-gradient-to-b from-stone-400 to-stone-500
                            dark:from-stone-700 dark:to-stone-800 rounded-b-lg
                            shadow-[0_2px_8px_rgba(0,0,0,0.3)]"></div>
            </div>
        </div>

        <!-- Hidden file input -->
        <input
            type="file"
            id="load-modal-file-input"
            accept=".sav,.srm"
            multiple
            class="hidden"
        />
    `;

    _attachEventListeners();
    _initLucideIcons();
}

/**
 * Attach all event listeners to the modal elements.
 * @private
 */
function _attachEventListeners() {
    const backdrop = document.getElementById('load-modal-backdrop');
    const content = document.getElementById('load-modal-content');
    const closeBtn = document.getElementById('load-modal-close-btn');
    const screen = document.getElementById('load-modal-screen');
    const bezel = document.getElementById('load-modal-bezel');
    const fileInput = document.getElementById('load-modal-file-input');
    const statusText = document.getElementById('load-modal-status');

    // --- Close handlers ---

    // Click backdrop to close
    if (backdrop) {
        backdrop.addEventListener('click', () => _close());
    }

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => _close());
    }

    // Escape key to close
    _escHandler = (e) => {
        if (e.key === 'Escape' && _isOpen) {
            _close();
        }
    };
    document.addEventListener('keydown', _escHandler);

    // --- File handling ---

    // Click screen to open file picker
    if (screen && fileInput) {
        screen.addEventListener('click', () => {
            fileInput.value = ''; // Reset so same file can be re-selected
            fileInput.click();
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0 && _appState) {
                _appState.handleFilesSelected(files);
                _close();
            }
        });
    }

    // --- Drag and drop on the screen/bezel ---

    if (screen && bezel && statusText) {
        // Use a drag counter to handle nested element events
        let dragCounter = 0;

        screen.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            if (!_isDragOver) {
                _isDragOver = true;
                _updateDragState(bezel, screen, statusText, true);
            }
        });

        screen.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        screen.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                _isDragOver = false;
                _updateDragState(bezel, screen, statusText, false);
            }
        });

        screen.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter = 0;
            _isDragOver = false;
            _updateDragState(bezel, screen, statusText, false);

            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length > 0 && _appState) {
                _appState.handleFilesSelected(files);
                _close();
            }
        });
    }

    // Prevent default drag behavior on the content wrapper to avoid browser opening files
    if (content) {
        content.addEventListener('dragover', (e) => e.preventDefault());
        content.addEventListener('drop', (e) => e.preventDefault());
    }
}

/**
 * Update visual state during drag-over.
 * @param {HTMLElement} bezel
 * @param {HTMLElement} screen
 * @param {HTMLElement} statusText
 * @param {boolean} isDragging
 * @private
 */
function _updateDragState(bezel, screen, statusText, isDragging) {
    if (isDragging) {
        // Bezel: add blue ring
        bezel.classList.remove('ring-0');
        bezel.classList.add('ring-4', 'ring-blue-400');

        // Screen: darken tint
        screen.classList.add('!bg-[#7ec8c8]', 'dark:!bg-[#0f1e28]');

        // Status text
        statusText.textContent = 'INSERT NOW';
        statusText.classList.add('!text-blue-600', 'dark:!text-blue-400');
    } else {
        // Bezel: remove blue ring
        bezel.classList.remove('ring-4', 'ring-blue-400');
        bezel.classList.add('ring-0');

        // Screen: restore normal
        screen.classList.remove('!bg-[#7ec8c8]', 'dark:!bg-[#0f1e28]');

        // Status text
        statusText.textContent = 'SELECT OR DROP FILES';
        statusText.classList.remove('!text-blue-600', 'dark:!text-blue-400');
    }
}

/**
 * Close the modal and clean up.
 * @private
 */
function _close() {
    _isOpen = false;
    _isDragOver = false;
    // Remove the Escape key handler to prevent memory leak
    if (_escHandler) {
        document.removeEventListener('keydown', _escHandler);
        _escHandler = null;
    }
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
