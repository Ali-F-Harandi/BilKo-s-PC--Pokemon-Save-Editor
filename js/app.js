/**
 * app.js — Main Application Entry Point
 *
 * Initializes the BilKo's PC Gen 1 Save Editor.
 * Sets up the theme system, state management, and renders the initial view.
 * Replaces the React-based App.tsx with vanilla JS DOM manipulation.
 *
 * Phase 6-7: Home page, modals, and full editor dashboard.
 * Phase 5: Layout & Navigation additions:
 * - Global file drag-and-drop (drag .sav/.srm anywhere on page)
 * - Keyboard shortcuts (Ctrl+O for open, Ctrl+S for save, Escape to close)
 * - View transition animations between Home ↔ Editor
 * - Proper event listener cleanup on view switch
 * - Fixed gameVersionSelector event name (was raw string, now Events constant)
 * - Toast auto-dismiss after 3 seconds
 * - Sidebar drawer closes on Escape
 *
 * Phase 1 Re-Architecture: Multi-Generation Adapter Pattern
 * - GenerationRegistry & AdapterFactory for multi-gen support
 * - Canonical Data Model (CanonicalPokemon, CanonicalSaveFile)
 * - BaseAdapter → Gen1Adapter for Gen 1 specific logic
 * - UIComponent base class for modular UI components
 * - Schema-driven UI rendering support
 */

// ---- Import Dependencies ----
import { EventBus, Events } from './state/eventBus.js';
import { ThemeManager } from './state/theme.js';
import { AppState } from './state/appState.js';
import { EditorState } from './state/editorState.js';

// ---- Phase 1: Multi-Generation Architecture ----
import { GenerationRegistry } from './core/GenerationRegistry.js';
import { AdapterFactory } from './core/AdapterFactory.js';
import { SaveManager } from './core/SaveManager.js';
import { Gen1Adapter } from './generations/gen1/Gen1Adapter.js';
import { Gen2Adapter } from './generations/gen2/Gen2Adapter.js';
import { UIRegistry } from './ui/components/UIRegistry.js';
import { initHeader, destroyHeader } from './ui/layout/header.js';
import { initFooter } from './ui/layout/footer.js';
import { initGlobalDropZone, destroyGlobalDropZone } from './ui/layout/globalDropZone.js';
import { initHomePage } from './ui/home/homePage.js';
import { destroyHomePage } from './ui/home/homePage.js';
import { initEditorDashboard } from './ui/editor/editorDashboard.js';
import { destroyEditorDashboard } from './ui/editor/editorDashboard.js';
import { destroyEditorTools } from './ui/editor/editorTools.js';
import { destroyMoveModeFAB } from './ui/components/moveModeFAB.js';
import { initLoadSaveModal } from './ui/modals/loadSaveModal.js';
import { initExportModal } from './ui/modals/exportModal.js';
import { initGameVersionSelector } from './ui/modals/gameVersionSelector.js';
import { initToast } from './ui/modals/toast.js';
import { initCloseConfirmModal } from './ui/modals/closeConfirmModal.js';
import { initErrorModal } from './ui/modals/errorModal.js';
import { initCloseAllModal } from './ui/modals/closeAllModal.js';
import { initSortSettingsModal } from './ui/modals/sortSettingsModal.js';
import { initPokemonEditorModal } from './ui/modals/pokemonEditorModal.js';
import { initMoveModeFAB } from './ui/components/moveModeFAB.js';

// ---- Phase 2: Gen1 UI Extensions ----
import { CatchRateSection } from './generations/gen1/uiExtensions/CatchRateSection.js';
import { SpecialStatSection } from './generations/gen1/uiExtensions/SpecialStatSection.js';
import { registerExtension as registerInfoExtension } from './ui/panels/PokemonInfoPanel.js';
import { registerExtension as registerStatsExtension } from './ui/panels/PokemonStatsPanel.js';
import { registerExtension as registerMovesExtension } from './ui/panels/PokemonMovesPanel.js';

// ---- Phase 3: Gen2 UI Extensions ----
import { HeldItemSection } from './generations/gen2/uiExtensions/HeldItemSection.js';
import { ShinyFlagSection } from './generations/gen2/uiExtensions/ShinyFlagSection.js';
import { GenderSection } from './generations/gen2/uiExtensions/GenderSection.js';
import { SplitSpecialSection } from './generations/gen2/uiExtensions/SplitSpecialSection.js';

// ---- Global Instances ----
export const eventBus = new EventBus();
export const theme = new ThemeManager(eventBus);
export const appState = new AppState(eventBus, theme);
export const editorState = new EditorState(eventBus, appState);

// ---- Phase 1+3: Adapter Architecture Instances ----
export const generationRegistry = new GenerationRegistry();
export const adapterFactory = new AdapterFactory(generationRegistry);
export const uiRegistry = new UIRegistry();
export const saveManager = new SaveManager(adapterFactory);

// Convenience: Get adapters for each registered generation
export const gen1Adapter = adapterFactory.createForGeneration(1);
export const gen2Adapter = adapterFactory.createForGeneration(2);

// ---- Phase 2: Register Gen1 UI Extensions ----
const catchRateExt = new CatchRateSection();
const specialStatExt = new SpecialStatSection();
registerMovesExtension(catchRateExt);
registerStatsExtension(specialStatExt);

// ---- Phase 3: Register Gen2 UI Extensions ----
const heldItemExt = new HeldItemSection();
const shinyExt = new ShinyFlagSection();
const genderExt = new GenderSection();
const splitSpecialExt = new SplitSpecialSection();
registerMovesExtension(heldItemExt);
registerInfoExtension(shinyExt);
registerInfoExtension(genderExt);
registerStatsExtension(splitSpecialExt);

// ---- Enable debug logging if ?debug param is present ----
if (typeof URLSearchParams !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('debug')) {
        eventBus.setDebug(true, [
            Events.FILE_QUEUE_UPDATED,  // too noisy
        ]);
        console.log('[BilKo\'s PC] Debug mode enabled. EventBus will log all events.');
    }
}

// ---- Root Element ----
const root = document.getElementById('root');

// ---- Track current view for cleanup ----
let _currentView = 'home'; // 'home' | 'editor'

/**
 * Build the top-level app shell DOM structure.
 * This mirrors the React App component's JSX tree.
 */
function buildAppShell() {
    root.innerHTML = `
        <!-- Toast Notification Container -->
        <div id="toast-container"></div>

        <!-- Scroll-to-Top Button -->
        <button id="scroll-top-btn" class="scroll-top-btn" aria-label="Scroll to top">
            <i data-lucide="arrow-up" class="w-5 h-5"></i>
        </button>

        <!-- Move Mode FAB Container -->
        <div id="move-mode-fab-container"></div>

        <!-- Global Drop Zone Overlay Container -->
        <div id="global-drop-container"></div>

        <!-- Game Version Selector Container -->
        <div id="game-version-selector-container"></div>

        <!-- Load Save Modal Container -->
        <div id="load-save-modal-container"></div>

        <!-- Export Modal Container -->
        <div id="export-modal-container"></div>

        <!-- Close Confirmation Modal Container -->
        <div id="close-confirm-modal-container"></div>

        <!-- Error Modal Container -->
        <div id="error-modal-container"></div>

        <!-- Close All Modal Container -->
        <div id="close-all-modal-container"></div>

        <!-- Sort Settings Modal Container -->
        <div id="sort-settings-modal-container"></div>

        <!-- Pokemon Editor Modal Container -->
        <div id="pokemon-editor-modal-container"></div>

        <!-- Hidden File Input for Global Open -->
        <input type="file" id="global-file-input" accept=".sav,.srm,.pk1,.pk2" multiple class="hidden">

        <!-- App Wrapper -->
        <div id="app-wrapper" class="flex flex-col min-h-screen relative bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden font-sans">

            <!-- Dotted Background -->
            <div class="dotted-bg"></div>

            <!-- Header -->
            <header id="app-header"></header>

            <!-- Tab Bar -->
            <div id="tab-bar-container"></div>

            <!-- Main Content -->
            <main id="main-content" class="flex-grow flex flex-col relative z-0">
                <!-- Dynamic content injected here -->
            </main>

            <!-- Footer -->
            <footer id="app-footer"></footer>
        </div>
    `;
}

/**
 * Initialize all UI modules.
 */
function initModules() {
    // Layout
    initHeader(document.getElementById('app-header'), eventBus, theme, appState);
    initFooter(document.getElementById('app-footer'), eventBus, theme);

    // Global File Drag-and-Drop
    initGlobalDropZone(
        document.getElementById('global-drop-container'),
        eventBus,
        appState
    );

    // Home Page (initial view)
    initHomePage(document.getElementById('main-content'), eventBus, theme, appState);

    // Modals
    initLoadSaveModal(document.getElementById('load-save-modal-container'), eventBus, appState);
    initExportModal(document.getElementById('export-modal-container'), eventBus, appState);
    initGameVersionSelector(document.getElementById('game-version-selector-container'), eventBus, appState);
    initCloseConfirmModal(document.getElementById('close-confirm-modal-container'), eventBus, appState);
    initErrorModal(document.getElementById('error-modal-container'), eventBus, appState);
    initCloseAllModal(document.getElementById('close-all-modal-container'), eventBus, appState);
    initSortSettingsModal(document.getElementById('sort-settings-modal-container'), eventBus, appState);
    initPokemonEditorModal(document.getElementById('pokemon-editor-modal-container'), eventBus, theme, appState);

    // Toast
    initToast(document.getElementById('toast-container'), eventBus);

    // Move Mode FAB
    initMoveModeFAB(document.getElementById('move-mode-fab-container'), eventBus, appState);
}

/**
 * Wire up global event handlers that bridge UI modules to AppState.
 * These replace the direct prop-passing pattern from React.
 */
function setupGlobalEventHandlers() {
    // ---- File Selection (from DropZone / Load Modal / Global DnD) ----
    eventBus.on(Events.FILES_SELECTED, (files) => {
        appState.handleFilesSelected(files);
    });

    // ---- Version Confirmation / Cancellation ----
    eventBus.on(Events.VERSION_CONFIRMED, (selectedVersion) => {
        appState.handleVersionConfirm(selectedVersion);
    });

    eventBus.on(Events.VERSION_CANCELLED, () => {
        appState.handleVersionCancel();
    });

    // ---- Export ----
    eventBus.on(Events.EXPORT_CONFIRMED, (extension) => {
        appState.handleExportConfirmed(extension);
    });

    eventBus.on(Events.EXPORT_CANCELLED, () => {
        appState.handleExportCancelled();
    });

    // ---- Error Dismissal ----
    eventBus.on(Events.CLOSE_ERROR_MODAL, () => {
        appState.dismissError();
    });

    // ---- Close Confirm Actions ----
    eventBus.on(Events.CLOSE_CLOSE_CONFIRM, () => {
        // Modal closed — no action needed, tabToClose already cleared by AppState
    });

    // ---- Sort ----
    eventBus.on(Events.SORT_REQUESTED, ({ scope, criteria, direction, includeAllSaves }) => {
        appState.handleGlobalSort(scope, criteria, direction, includeAllSaves);
    });

    // ---- Move Mode ----
    eventBus.on(Events.MOVE_MODE_TOGGLED, (isMoveMode) => {
        document.body.classList.toggle('move-mode-active', isMoveMode);
    });

    // ---- Pokemon Drop (from drag events in editor) ----
    eventBus.on(Events.POKEMON_DROPPED, ({ location, event: dragEvent }) => {
        appState.handleGlobalDrop(location, dragEvent);
    });

    // ---- Pokemon Selection (from editor slots) ----
    eventBus.on(Events.POKEMON_SELECTED, ({ location, event: mouseEvent }) => {
        appState.handleGlobalPokemonSelect(location, mouseEvent);
    });

    // ---- Pokemon Updated (from PokemonEditorModal) ----
    eventBus.on(Events.POKEMON_UPDATED, (updatedMon) => {
        if (updatedMon) {
            const source = updatedMon._source;
            const index = updatedMon._index;
            const boxIndex = updatedMon._boxIndex;
            if (source !== undefined && index !== undefined) {
                // Remove internal metadata before saving
                const cleanMon = { ...updatedMon };
                delete cleanMon._source;
                delete cleanMon._index;
                delete cleanMon._boxIndex;
                appState.handleSavePokemon(cleanMon, source, index, boxIndex);
                appState.showToast("Pokémon updated!");
            }
        }
    });

    // ---- Selection Toggle (from editor slots) ----
    eventBus.on(Events.SELECTION_TOGGLED, () => {
        // UI modules will re-render based on AppState.getSelectedMoveLocations()
    });

    // ---- Theme Mode Toggle ----
    eventBus.on(Events.THEME_MODE_CHANGED, () => {
        // Already handled by ThemeManager; this hook is for any additional side effects
    });
}

/**
 * Handle view switching between Home and Editor.
 * Listens to state changes and swaps the main content
 * with a smooth transition animation.
 */
function setupViewSwitching() {
    eventBus.on(Events.ACTIVE_TAB_CHANGED, () => {
        const mainContent = document.getElementById('main-content');
        const activeTab = appState.getActiveTab();
        const newView = activeTab ? 'editor' : 'home';

        // Only switch if the view actually changed
        if (newView !== _currentView) {
            // Clean up old view's event listeners before switching
            if (_currentView === 'editor') {
                destroyEditorDashboard();
                destroyEditorTools();
            } else if (_currentView === 'home') {
                destroyHomePage();
            }

            _currentView = newView;

            // Add fade-out class before switching
            mainContent.classList.add('animate-fade-out');

            setTimeout(() => {
                if (activeTab) {
                    // Switch to editor dashboard
                    initEditorDashboard(mainContent, eventBus, theme, appState);
                } else {
                    // Switch to home page
                    initHomePage(mainContent, eventBus, theme, appState);
                }

                // Add fade-in class for smooth entrance
                mainContent.classList.remove('animate-fade-out');
                mainContent.classList.add('view-transition');

                // Clean up animation class after it completes
                setTimeout(() => {
                    mainContent.classList.remove('view-transition');
                }, 300);
            }, 150); // Wait for fade-out to complete
        }
    });
}

/**
 * Set up the tab bar rendering.
 * Re-renders tabs whenever the tab list changes.
 */
function setupTabBar() {
    eventBus.on(Events.TABS_CHANGED, () => {
        renderTabBar();
    });
    eventBus.on(Events.ACTIVE_TAB_CHANGED, () => {
        renderTabBar();
    });
    // Re-render tab bar when save data is updated (for dirty indicator)
    eventBus.on(Events.SAVE_UPDATED, () => {
        renderTabBar();
    });
}

/**
 * Render the multi-save tab bar.
 * Mirrors the original App.tsx tab bar JSX.
 * Phase 5 enhancements:
 * - Tab item animations
 * - Version stripe with transition
 * - Keyboard shortcut hints on hover
 */
function renderTabBar() {
    const container = document.getElementById('tab-bar-container');
    const tabs = appState.getTabs();
    const activeTabId = appState.getActiveTabId();

    if (tabs.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="bg-gray-200 dark:bg-gray-900 pt-2 px-2 flex items-end gap-1 overflow-x-auto border-b border-gray-300 dark:border-gray-800 z-10 relative scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 no-scrollbar">
            ${tabs.map((tab, i) => {
                const isActive = tab.id === activeTabId;
                const versionColor = tab.version === 'Red' ? 'bg-red-500' : tab.version === 'Blue' ? 'bg-blue-500' : tab.version === 'Yellow' ? 'bg-yellow-400' : tab.version === 'Gold' ? 'bg-amber-500' : tab.version === 'Silver' ? 'bg-slate-400' : tab.version === 'Crystal' ? 'bg-cyan-400' : 'bg-gray-400';
                return `
                    <div class="tab-item group relative pl-4 pr-8 py-2 min-w-[160px] max-w-[240px] shrink-0 rounded-t-lg cursor-pointer select-none transition-all duration-200 no-select
                        ${isActive
                            ? 'tab-active bg-gray-50 dark:bg-gray-950 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] translate-y-[1px]'
                            : 'bg-gray-300 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 opacity-80 hover:opacity-100'
                        }"
                        data-tab-id="${tab.id}"
                        style="animation-delay: ${i * 30}ms">
                        ${isActive ? `<div class="tab-stripe absolute top-0 left-0 right-0 h-1 rounded-t-lg ${versionColor}"></div>` : ''}
                        <div class="flex flex-col">
                            <span class="text-xs font-bold uppercase tracking-wide truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}">
                                ${escapeHtml(tab.filename)}
                            </span>
                            <span class="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                ${tab.version} Version ${tab.isDirty ? '<span class="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-1 inline-block" title="Unsaved Changes"></span>' : ''}
                            </span>
                        </div>
                        <button class="tab-close-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}" data-close-tab-id="${tab.id}" aria-label="Close Tab">
                            <i data-lucide="x" class="w-3 h-3 text-gray-500"></i>
                        </button>
                    </div>
                `;
            }).join('')}

            <button id="tab-open-btn" class="p-2 h-10 rounded-lg bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 transition-colors shadow-sm mb-1 ml-1 touch-target" title="Open New Save (Ctrl+O)">
                <i data-lucide="plus" class="w-[18px] h-[18px]"></i>
            </button>
            <button id="tab-close-all-btn" class="p-2 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors shadow-sm mb-1 touch-target" title="Close All Tabs">
                <i data-lucide="trash-2" class="w-[18px] h-[18px]"></i>
            </button>
        </div>
    `;

    // Bind tab click events
    container.querySelectorAll('[data-tab-id]').forEach(el => {
        el.addEventListener('click', (e) => {
            // Don't switch tab if clicking close button (including its padding area)
            if (e.target.closest('.tab-close-btn')) return;
            const tabId = el.dataset.tabId;
            appState.switchToTab(tabId);
        });
    });

    // Bind close tab events
    container.querySelectorAll('[data-close-tab-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = btn.dataset.closeTabId;
            appState.initiateCloseTab(tabId);
        });
    });

    // Open new save button
    document.getElementById('tab-open-btn')?.addEventListener('click', () => {
        _openFilePicker();
    });

    // Close all tabs button
    document.getElementById('tab-close-all-btn')?.addEventListener('click', () => {
        appState.requestCloseAll();
    });

    // Re-render Lucide icons in the tab bar
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Open the hidden file picker for loading save files.
 * Used by keyboard shortcut (Ctrl+O) and tab bar "+" button.
 * @private
 */
function _openFilePicker() {
    const input = document.getElementById('global-file-input');
    if (input) {
        // Reset value so same file can be re-selected
        input.value = '';
        input.click();
    }
}

/**
 * Set up keyboard shortcuts for the application.
 * - Ctrl+O / Cmd+O: Open save file dialog
 * - Ctrl+S / Cmd+S: Export save file
 * - Escape: Close sidebar, modals, exit move mode
 * @private
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isCtrl = e.ctrlKey || e.metaKey;

        // Ctrl+O — Open File
        if (isCtrl && e.key === 'o') {
            e.preventDefault();
            _openFilePicker();
            return;
        }

        // Ctrl+S — Export/Save
        if (isCtrl && e.key === 's') {
            e.preventDefault();
            const activeTab = appState.getActiveTab();
            if (activeTab) {
                appState.setExportModalOpen(true);
            }
            return;
        }

        // Escape — Close various overlays in priority order
        if (e.key === 'Escape') {
            // 1. Close sidebar drawer
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.remove();
                return;
            }

            // 2. Close modals by emitting proper close events (keeps AppState in sync)
            const modalCloseMap = {
                'game-version-selector-container': Events.CLOSE_VERSION_SELECTOR,
                'export-modal-container': Events.CLOSE_EXPORT_MODAL,
                'load-save-modal-container': Events.CLOSE_LOAD_MODAL,
                'close-confirm-modal-container': Events.CLOSE_CLOSE_CONFIRM,
                'error-modal-container': Events.CLOSE_ERROR_MODAL,
                'close-all-modal-container': Events.CLOSE_CLOSE_ALL_CONFIRM,
                'sort-settings-modal-container': Events.SORT_MODAL_TOGGLED,
                'pokemon-editor-modal-container': Events.CLOSE_POKEMON_EDITOR,
            };

            for (const [containerId, closeEvent] of Object.entries(modalCloseMap)) {
                const el = document.getElementById(containerId);
                if (el && el.innerHTML.trim()) {
                    eventBus.emit(closeEvent);
                    el.innerHTML = '';
                    return;
                }
            }

            // 3. Exit move mode
            if (appState.getIsMoveMode()) {
                appState.handleMoveModeToggle(false);
                return;
            }
        }
    });

    // Handle global file input change
    const globalFileInput = document.getElementById('global-file-input');
    if (globalFileInput) {
        globalFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                appState.handleFilesSelected(files);
            }
        });
    }
}

/**
 * Set up the toast auto-dismiss behavior.
 * NOTE: AppState.showToast() already manages a 3-second timer that emits
 * SHOW_TOAST(null). We only need to handle the exit animation here.
 * @private
 */
function setupToastAutoDismiss() {
    eventBus.on(Events.SHOW_TOAST, (msg) => {
        // When the toast is being cleared (msg is null), add exit animation
        if (msg === null) {
            const toastEl = document.querySelector('.toast-notification');
            if (toastEl) {
                toastEl.classList.add('toast-exiting');
                setTimeout(() => {
                    const container = document.getElementById('toast-container');
                    if (container) container.innerHTML = '';
                }, 300);
            }
        }
    });
}

// ---- Utility: HTML escaping ----
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// ---- Initialize on DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
    buildAppShell();
    initModules();
    setupGlobalEventHandlers();
    setupViewSwitching();
    setupTabBar();
    setupKeyboardShortcuts();
    setupToastAutoDismiss();

    // ---- Warn before unload if unsaved changes ----
    window.addEventListener('beforeunload', (e) => {
        const hasUnsaved = appState.getTabs().some(t => t.isDirty);
        if (hasUnsaved) {
            e.preventDefault();
            e.returnValue = ''; // Required for Chrome
        }
    });

    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // ---- Scroll-to-Top Button Setup ----
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        // Show/hide based on scroll position
        const appWrapper = document.getElementById('app-wrapper');
        const scrollTarget = appWrapper || window;

        const checkScroll = () => {
            const scrollY = scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
            if (scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        };

        if (scrollTarget === window) {
            window.addEventListener('scroll', checkScroll, { passive: true });
        } else {
            scrollTarget.addEventListener('scroll', checkScroll, { passive: true });
        }

        scrollTopBtn.addEventListener('click', () => {
            if (scrollTarget === window) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Log architecture info
    console.log('[BilKo\'s PC] Multi-Generation Save Editor initialized.');
    console.log(`[BilKo\'s PC] Phase 3: Adapter Factory + SaveManager online.`);
    console.log(`[BilKo\'s PC] Registered generations: [${generationRegistry.getRegisteredGenerations().join(', ')}]`);
    console.log(`[BilKo\'s PC] Registered games: [${generationRegistry.getRegisteredGames().join(', ')}]`);
    console.log(`[BilKo\'s PC] Gen1Adapter available: ${gen1Adapter !== null}`);
    console.log(`[BilKo\'s PC] Gen2Adapter available: ${gen2Adapter !== null}`);
    if (gen1Adapter) {
        const schema = gen1Adapter.getPokemonSchema();
        console.log(`[BilKo\'s PC] Gen1 Pokemon Schema: ${schema.sections.length} sections, ${schema.sections.reduce((t, s) => t + s.fields.length, 0)} fields`);
    }
    if (gen2Adapter) {
        const schema = gen2Adapter.getPokemonSchema();
        console.log(`[BilKo\'s PC] Gen2 Pokemon Schema: ${schema.sections.length} sections, ${schema.sections.reduce((t, s) => t + s.fields.length, 0)} fields`);
    }
});
