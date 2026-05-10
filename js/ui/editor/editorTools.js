/**
 * editorTools.js — Editor Top Toolbar Component
 *
 * Faithfully ported from components/editor/EditorTools.tsx
 * Provides search bar, move mode toggle, and export button.
 * Sticky below the header.
 */

import { Events } from '../../state/eventBus.js';

// ---- Cleanup (event listener memory leak prevention) ----
let _unsubs = [];

export function destroyEditorTools() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
}

/**
 * Initialize the editor tools bar.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/theme.js').ThemeManager} theme
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initEditorTools(container, eventBus, theme, appState) {
    _render(container, eventBus, theme, appState);

    // Re-render when move mode changes
    _unsubs.push(eventBus.on(Events.MOVE_MODE_TOGGLED, () => {
        _render(container, eventBus, theme, appState);
    }));
}

/**
 * Render the editor tools bar.
 * @private
 */
function _render(container, eventBus, theme, appState) {
    const isMoveMode = appState.getIsMoveMode();

    container.innerHTML = `
        <div class="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 sticky top-16 z-40 shadow-sm">
            <div class="max-w-[100rem] mx-auto flex flex-row items-center justify-between gap-3">

                <!-- Search Bar -->
                <div class="relative flex-grow">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                    <input
                        type="text"
                        id="editor-search-input"
                        placeholder="Search..."
                        class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <!-- Controls Area -->
                <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Move Mode Toggle -->
                    <button
                        id="move-mode-toggle-btn"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all border whitespace-nowrap
                            ${isMoveMode
                                ? 'bg-blue-100 text-blue-700 border-blue-300 ring-2 ring-blue-400 ring-offset-1'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                            }"
                        title="Toggle Move Mode"
                    >
                        <i data-lucide="move" class="w-4 h-4"></i>
                        <span class="hidden sm:inline">${isMoveMode ? 'Move Mode On' : 'Move Mode'}</span>
                    </button>

                    <!-- Export Button -->
                    <button
                        id="editor-export-btn"
                        class="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white shadow-md hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                        style="background-color: #10B981;"
                        title="Export Save"
                    >
                        <i data-lucide="save" class="w-4 h-4"></i>
                        <span class="hidden sm:inline">Export</span>
                    </button>
                </div>

            </div>
        </div>
    `;

    // Move mode toggle
    document.getElementById('move-mode-toggle-btn')?.addEventListener('click', () => {
        appState.handleMoveModeToggle(!appState.getIsMoveMode());
    });

    // Export button
    document.getElementById('editor-export-btn')?.addEventListener('click', () => {
        appState.setExportModalOpen(true);
    });

    if (window.lucide) window.lucide.createIcons();
}
