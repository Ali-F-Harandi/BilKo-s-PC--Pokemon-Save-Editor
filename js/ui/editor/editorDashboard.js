/**
 * editorDashboard.js — Editor Dashboard Orchestrator
 *
 * Phase 2: Thin orchestrator that delegates to tab and panel modules.
 * Original monolithic code (1245 lines) broken into composable modules.
 *
 * Keeps: _localState, init/destroy exports, tab navigation, event subscriptions.
 * Delegates: tab content rendering and event binding to tab modules.
 */

import { Events } from '../../state/eventBus.js';
import { initEditorTools } from './editorTools.js';
import { DASHBOARD_TABS } from './shared/helpers.js';

// ---- Tab Module Imports ----
import * as DashboardTab from './tabs/DashboardTab.js';
import * as StorageTab from './tabs/StorageTab.js';
import * as EncountersTab from './tabs/EncountersTab.js';
import * as PokedexTab from './tabs/PokedexTab.js';
import * as BattleTab from './tabs/BattleTab.js';
import * as EventsTab from './tabs/EventsTab.js';
import * as HallOfFameTab from './tabs/HallOfFameTab.js';

// ================================================================
// ---- CLEANUP (event listener memory leak prevention) ----
// ================================================================

let _unsubs = [];

export function destroyEditorDashboard() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
    // Reset module-level state to prevent stale data across re-initialization
    _localState = {
        trainerEditing: false,
        trainerForm: {},
        selectedBox: 0,
        itemView: 'bag',
        itemSortBy: 'id',
        pokedexSortBy: 'id',
        pokedexOwned: null,
        pokedexSeen: null,
        eventFlags: null,
        battleMode: 'defense',
        battleType: 'Normal',
        encounterSearch: '',
        pokedexSearch: '',
    };
}

// ================================================================
// ---- LOCAL UI STATE (per-instance) ----
// ================================================================

let _localState = {
    trainerEditing: false,
    trainerForm: {},
    selectedBox: 0,
    itemView: 'bag',       // 'bag' | 'pc'
    itemSortBy: 'id',      // 'id' | 'name'
    pokedexSortBy: 'id',   // 'id' | 'name'
    pokedexOwned: null,
    pokedexSeen: null,
    eventFlags: null,
    battleMode: 'defense', // 'defense' | 'offense'
    battleType: 'Normal',
    encounterSearch: '',
    pokedexSearch: '',
};

// ================================================================
// ---- MAIN EXPORT ----
// ================================================================

/**
 * Initialize the editor dashboard.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/theme.js').ThemeManager} theme
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initEditorDashboard(container, eventBus, theme, appState) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return;

    _syncLocalState(appState);
    _render(container, eventBus, theme, appState);

    _unsubs.push(eventBus.on(Events.DASHBOARD_TAB_CHANGED, () => {
        _syncLocalState(appState);
        _updateActiveTab(container, appState, theme, eventBus);
    }));

    _unsubs.push(eventBus.on(Events.SAVE_UPDATED, () => {
        _syncLocalState(appState);
        _updateContentArea(container, eventBus, theme, appState);
    }));

    _unsubs.push(eventBus.on(Events.MOVE_MODE_TOGGLED, () => {
        _updateContentArea(container, eventBus, theme, appState);
    }));

    _unsubs.push(eventBus.on(Events.ACTIVE_TAB_CHANGED, () => {
        const tab = appState.getActiveTab();
        if (tab) {
            _localState = { ..._localState, trainerEditing: false, selectedBox: 0, itemView: 'bag', itemSortBy: 'id', battleMode: 'defense', battleType: 'Normal', encounterSearch: '', pokedexSearch: '' };
            _syncLocalState(appState);
            _render(container, eventBus, theme, appState);
        }
    }));

    _unsubs.push(eventBus.on(Events.EDITOR_DATA_CHANGED, () => {
        _syncLocalState(appState);
        _updateContentArea(container, eventBus, theme, appState);
    }));
}

function _syncLocalState(appState) {
    const tab = appState.getActiveTab();
    if (!tab) return;
    const d = tab.data;
    const adapter = appState.getActiveAdapter?.() || null;
    const pokedexSize = adapter ? adapter.getPokedexSize() : 151;
    if (_localState.pokedexOwned === null) _localState.pokedexOwned = d.pokedexOwnedFlags ? [...d.pokedexOwnedFlags] : new Array(pokedexSize + 1).fill(false);
    if (_localState.pokedexSeen === null) _localState.pokedexSeen = d.pokedexSeenFlags ? [...d.pokedexSeenFlags] : new Array(pokedexSize + 1).fill(false);
    if (_localState.eventFlags === null) _localState.eventFlags = d.eventFlags ? [...d.eventFlags] : [];
}

// ================================================================
// ---- FULL RENDER ----
// ================================================================

function _render(container, eventBus, theme, appState) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return;

    const currentView = activeTab.currentView || 'home';

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 font-sans transition-colors duration-300">
            <div id="editor-tools-container"></div>
            <div class="sticky top-[4.5rem] z-30 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-2">
                <div class="max-w-[100rem] mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
                    ${DASHBOARD_TABS.map(t => _renderTabButton(t, currentView)).join('')}
                </div>
            </div>
            <div class="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                <div id="dashboard-content" class="animate-fade-in">
                    ${_renderTabContent(currentView, appState, theme, eventBus)}
                </div>
            </div>
        </div>
    `;

    const toolsContainer = document.getElementById('editor-tools-container');
    if (toolsContainer) {
        initEditorTools(toolsContainer, eventBus, theme, appState);
    }

    _bindTabButtons(container, appState);
    _bindContentEvents(container, eventBus, theme, appState);

    if (window.lucide) window.lucide.createIcons();
}

// ================================================================
// ---- TAB NAVIGATION ----
// ================================================================

function _renderTabButton(tab, activeView) {
    const isActive = activeView === tab.id;
    return `
        <button data-dash-tab="${tab.id}"
            class="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ease-in-out shrink-0 h-10 select-none
                ${isActive
                    ? 'bg-blue-600 text-white shadow-md pr-4'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-14 justify-center'
                }"
            title="${tab.label}"
        >
            <i data-lucide="${tab.icon}" class="w-[22px] h-[22px] ${isActive ? 'text-white' : ''}"></i>
            <span class="font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300
                ${isActive ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}">
                ${tab.label}
            </span>
        </button>`;
}

function _bindTabButtons(container, appState) {
    container.querySelectorAll('[data-dash-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.dashTab;
            appState.handleDashboardTabChange(tab);
        });
    });
}

function _updateActiveTab(container, appState, theme, eventBus) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return;
    const currentView = activeTab.currentView || 'home';

    container.querySelectorAll('[data-dash-tab]').forEach(btn => {
        const tabId = btn.dataset.dashTab;
        const isActive = tabId === currentView;
        btn.className = `flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ease-in-out shrink-0 h-10 select-none
            ${isActive
                ? 'bg-blue-600 text-white shadow-md pr-4'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-14 justify-center'
            }`;
        const label = btn.querySelector('span');
        if (label) {
            label.className = `font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300
                ${isActive ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`;
        }
        const icon = btn.querySelector('i, svg');
        if (icon && isActive) icon.classList.add('text-white');
        else if (icon) icon.classList.remove('text-white');
    });

    const contentEl = container.querySelector('#dashboard-content');
    if (contentEl) {
        contentEl.className = 'animate-fade-in';
        contentEl.innerHTML = _renderTabContent(currentView, appState, theme, eventBus);
        _bindContentEvents(container, eventBus, theme, appState);
    }

    if (window.lucide) window.lucide.createIcons();
}

function _updateContentArea(container, eventBus, theme, appState) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return;
    const currentView = activeTab.currentView || 'home';
    const contentEl = container.querySelector('#dashboard-content');
    if (contentEl) {
        contentEl.innerHTML = _renderTabContent(currentView, appState, theme, eventBus);
        _bindContentEvents(container, eventBus, theme, appState);
    }
    if (window.lucide) window.lucide.createIcons();
}

// ================================================================
// ---- TAB CONTENT ROUTER ----
// ================================================================

function _renderTabContent(view, appState, theme, eventBus) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return '';
    const data = activeTab.data;

    switch (view) {
        case 'home':       return DashboardTab.render(data, appState, theme, eventBus, _localState);
        case 'storage':    return StorageTab.render(data, appState, theme, eventBus, _localState);
        case 'encounters': return EncountersTab.render(data, appState, theme, eventBus, _localState);
        case 'pokedex':    return PokedexTab.render(data, appState, theme, eventBus, _localState);
        case 'battle':     return BattleTab.render(data, appState, theme, eventBus, _localState);
        case 'events':     return EventsTab.render(data, appState, theme, eventBus, _localState);
        case 'hof':        return HallOfFameTab.render(data, appState, theme, eventBus, _localState);
        default:           return `<p class="text-center text-gray-400 py-8">Unknown view: ${view}</p>`;
    }
}

// ================================================================
// ---- EVENT BINDING (delegates to tab modules) ----
// ================================================================

function _bindContentEvents(container, eventBus, theme, appState) {
    const activeTab = appState.getActiveTab();
    if (!activeTab) return;
    const view = activeTab.currentView || 'home';

    // Create updateFn closure that tabs/panels can use to trigger re-renders
    const updateFn = () => _updateContentArea(container, eventBus, theme, appState);

    switch (view) {
        case 'home':       DashboardTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'storage':    StorageTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'encounters': EncountersTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'pokedex':    PokedexTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'battle':     BattleTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'events':     EventsTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
        case 'hof':        HallOfFameTab.bindEvents(container, eventBus, theme, appState, _localState, updateFn); break;
    }
}
