/**
 * editorDashboard.js — Editor Dashboard Component
 *
 * Faithfully ported from components/editor/EditorDashboard.tsx
 * Tab-based dashboard that shows different editor views:
 * - Dashboard (Trainer Card + Party)
 * - PC & Bag (PC Storage + Inventory)
 * - Encounters (Encounter Database)
 * - Pokédex
 * - Battle Guide
 * - Events (Event Flags)
 * - Hall of Fame
 *
 * Phase 7: Full implementation of all 7 tab content panels.
 */

import { Events } from '../../state/eventBus.js';
import { initEditorTools, getSearchFilter } from './editorTools.js';
import { EVENT_DISTRIBUTIONS } from '../../data/eventDistributions.js';
import { GEN1_EVENTS } from '../../data/events.js';
import { TYPE_COLORS } from '../../data/gameData.js';
import { getPokemonTypes } from '../../data/pokemonTypes.js';
import { getPokemonName } from '../../data/pokemonNames.js';
import { parsePk1 } from '../../engine/parser.js';

// ================================================================
// ---- CONSTANTS ----
// ================================================================

const DASHBOARD_TABS = [
    { id: 'home',       label: 'Dashboard',   icon: 'home' },
    { id: 'storage',    label: 'PC & Bag',     icon: 'layout-grid' },
    { id: 'encounters', label: 'Encounters',   icon: 'database' },
    { id: 'pokedex',    label: 'Pokédex',      icon: 'book' },
    { id: 'battle',     label: 'Battle Guide', icon: 'swords' },
    { id: 'events',     label: 'Events',       icon: 'map' },
    { id: 'hof',        label: 'Hall of Fame', icon: 'trophy' },
];

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const TRAINER_SPRITE = 'https://play.pokemonshowdown.com/sprites/trainers/red-gen1.png';
const BADGE_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges';

/** Gen 1 type chart — effectiveness[outType][inType] = multiplier */
const GEN1_TYPE_CHART = {
    Normal:   { Normal:1, Fighting:1, Flying:1, Poison:1, Ground:1, Rock:0.5, Bug:1, Ghost:0, Fire:1, Water:1, Grass:1, Electric:1, Psychic:1, Ice:1, Dragon:1 },
    Fighting: { Normal:1, Fighting:1, Flying:0.5, Poison:0.5, Ground:1, Rock:2, Bug:0.5, Ghost:0, Fire:1, Water:1, Grass:1, Electric:1, Psychic:0.5, Ice:2, Dragon:1 },
    Flying:   { Normal:1, Fighting:2, Flying:1, Poison:1, Ground:1, Rock:0.5, Bug:2, Ghost:1, Fire:1, Water:1, Grass:2, Electric:0.5, Psychic:1, Ice:1, Dragon:1 },
    Poison:   { Normal:1, Fighting:1, Flying:1, Poison:0.5, Ground:0.5, Rock:0.5, Bug:2, Ghost:0.5, Fire:1, Water:1, Grass:2, Electric:1, Psychic:1, Ice:1, Dragon:1 },
    Ground:   { Normal:1, Fighting:1, Flying:1, Poison:2, Ground:1, Rock:2, Bug:0.5, Ghost:1, Fire:2, Water:1, Grass:0.5, Electric:2, Psychic:1, Ice:1, Dragon:1 },
    Rock:     { Normal:1, Fighting:0.5, Flying:2, Poison:1, Ground:0.5, Rock:1, Bug:2, Ghost:1, Fire:2, Water:1, Grass:1, Electric:1, Psychic:1, Ice:2, Dragon:1 },
    Bug:      { Normal:1, Fighting:0.5, Flying:0.5, Poison:2, Ground:1, Rock:1, Bug:1, Ghost:0.5, Fire:0.5, Water:1, Grass:2, Electric:1, Psychic:2, Ice:1, Dragon:1 },
    Ghost:    { Normal:0, Fighting:1, Flying:1, Poison:1, Ground:1, Rock:1, Bug:1, Ghost:2, Fire:1, Water:1, Grass:1, Electric:1, Psychic:0, Ice:1, Dragon:1 },
    Fire:     { Normal:1, Fighting:1, Flying:1, Poison:1, Ground:1, Rock:0.5, Bug:2, Ghost:1, Fire:0.5, Water:0.5, Grass:2, Electric:1, Psychic:1, Ice:2, Dragon:0.5 },
    Water:    { Normal:1, Fighting:1, Flying:1, Poison:1, Ground:2, Rock:2, Bug:1, Ghost:1, Fire:2, Water:0.5, Grass:0.5, Electric:1, Psychic:1, Ice:1, Dragon:0.5 },
    Grass:    { Normal:1, Fighting:1, Flying:0.5, Poison:1, Ground:2, Rock:2, Bug:1, Ghost:1, Fire:0.5, Water:2, Grass:0.5, Electric:0.5, Psychic:1, Ice:1, Dragon:0.5 },
    Electric: { Normal:1, Fighting:1, Flying:2, Poison:1, Ground:0, Rock:1, Bug:1, Ghost:1, Fire:1, Water:2, Grass:0.5, Electric:0.5, Psychic:1, Ice:1, Dragon:0.5 },
    Psychic:  { Normal:1, Fighting:2, Flying:1, Poison:2, Ground:1, Rock:1, Bug:1, Ghost:1, Fire:1, Water:1, Grass:1, Electric:1, Psychic:0.5, Ice:1, Dragon:1 },
    Ice:      { Normal:1, Fighting:1, Flying:1, Poison:1, Ground:2, Rock:1, Bug:1, Ghost:1, Fire:0.5, Water:0.5, Grass:2, Electric:1, Psychic:1, Ice:0.5, Dragon:2 },
    Dragon:   { Normal:1, Fighting:1, Flying:1, Poison:1, Ground:1, Rock:1, Bug:1, Ghost:1, Fire:1, Water:1, Grass:1, Electric:1, Psychic:1, Ice:1, Dragon:2 },
};

const GEN1_TYPES = ['Normal','Fighting','Flying','Poison','Ground','Rock','Bug','Ghost','Fire','Water','Grass','Electric','Psychic','Ice','Dragon'];

// ================================================================
// ---- CLEANUP (event listener memory leak prevention) ----
// ================================================================

let _unsubs = [];

export function destroyEditorDashboard() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
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
// ---- SHARED HELPERS ----
// ================================================================

function spriteUrl(dexId) {
    return `${SPRITE_BASE}/${dexId}.png`;
}

function typeBadgeHTML(typeName) {
    const color = TYPE_COLORS[typeName] || '#999';
    return `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style="background-color:${color}">${typeName}</span>`;
}

function typeDotsHTML(types) {
    if (!types || !types.length) return '';
    return types.map(t => {
        const c = TYPE_COLORS[t] || '#999';
        return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color:${c}" title="${t}"></span>`;
    }).join('');
}

function hpBarHTML(current, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
    return `
        <div class="flex items-center gap-1.5 text-[10px] mt-1">
            <span class="text-gray-400 dark:text-gray-500">HP</span>
            <div class="stat-bar-bg flex-grow"><div class="stat-bar-fill ${color}" style="width:${pct}%"></div></div>
            <span class="text-gray-500 dark:text-gray-400 font-mono">${current}/${max}</span>
        </div>`;
}

function gameHeaderColor(theme) {
    const gt = theme?.getGameTheme?.();
    return gt ? gt.color : '#3B82F6';
}

/**
 * Check if a Pokémon matches the current search filter.
 * Filters by nickname, species name, or level.
 * @param {Object} mon - PokemonStats object (or null/undefined for empty slots)
 * @returns {boolean} True if the Pokémon matches or there's no filter
 */
function matchesSearchFilter(mon) {
    const filter = getSearchFilter().toLowerCase();
    if (!filter || !mon) return true;
    const nickname = (mon.nickname || '').toLowerCase();
    const speciesName = (mon.speciesName || '').toLowerCase();
    const level = String(mon.level || '');
    return nickname.includes(filter) || speciesName.includes(filter) || level.includes(filter);
}

function sectionHeaderHTML(icon, title, theme, extra = '') {
    const color = gameHeaderColor(theme);
    return `
        <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-black text-sm uppercase tracking-wider" style="background-color:${color}">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                ${title}
            </div>
            ${extra}
        </div>`;
}

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
    if (_localState.pokedexOwned === null) _localState.pokedexOwned = d.pokedexOwnedFlags ? [...d.pokedexOwnedFlags] : new Array(152).fill(false);
    if (_localState.pokedexSeen === null) _localState.pokedexSeen = d.pokedexSeenFlags ? [...d.pokedexSeenFlags] : new Array(152).fill(false);
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
        case 'home':       return _renderHomeTab(data, appState, theme);
        case 'storage':    return _renderStorageTab(data, appState, theme);
        case 'encounters': return _renderEncountersTab(appState, theme);
        case 'pokedex':    return _renderPokedexTab(data, appState, theme);
        case 'battle':     return _renderBattleTab(theme);
        case 'events':     return _renderEventsTab(data, appState, theme);
        case 'hof':        return _renderHofTab(data, theme);
        default:           return `<p class="text-center text-gray-400 py-8">Unknown view: ${view}</p>`;
    }
}

// ================================================================
// ---- TAB 1: HOME (Dashboard) ----
// ================================================================

function _renderHomeTab(data, appState, theme) {
    const trainer = data.trainer || {};
    const isEditing = _localState.trainerEditing;
    const form = _localState.trainerForm;
    const isYellow = data.gameVersion === 'Yellow';
    const headerColor = gameHeaderColor(theme);

    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT: Trainer Card -->
        <div class="lg:col-span-4 xl:col-span-3">
            <div class="rounded-2xl shadow-lg overflow-hidden border border-yellow-300 dark:border-yellow-700">
                <!-- Card Header -->
                <div class="p-4 text-white" style="background:linear-gradient(135deg, ${headerColor}, ${headerColor}dd)">
                    <div class="flex items-center gap-3">
                        <img src="${TRAINER_SPRITE}" alt="Trainer" class="w-16 h-16 pixelated" onerror="this.style.display='none'">
                        <div>
                            <div class="font-black text-lg">${isEditing ? (form.name || trainer.name) : trainer.name}</div>
                            <div class="text-sm opacity-90 font-mono">ID: ${isEditing ? (form.id || trainer.id) : trainer.id}</div>
                        </div>
                    </div>
                </div>
                <!-- Card Body -->
                <div class="bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2.5 text-sm">
                    ${isEditing ? _renderTrainerEditFields(form, trainer, isYellow) : _renderTrainerDisplayFields(trainer, isYellow, data)}
                    <!-- Pokédex Progress -->
                    <div class="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                        <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Pokédex</div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] text-gray-500 w-12">Owned</span>
                            <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" style="width:${data.pokedexOwned ? (data.pokedexOwned / 151 * 100) : 0}%"></div></div>
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexOwned || 0}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-gray-500 w-12">Seen</span>
                            <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${data.pokedexSeen ? (data.pokedexSeen / 151 * 100) : 0}%"></div></div>
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexSeen || 0}</span>
                        </div>
                    </div>
                    <!-- Badges -->
                    <div class="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                        <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Badges</div>
                        <div class="grid grid-cols-4 gap-2" id="badge-grid">
                            ${Array.from({ length: 8 }, (_, i) => {
                                // When not editing, trainer.badges is a byte — convert bit to boolean
                                const badgesByte = trainer.badges || 0;
                                const earned = isEditing ? (form.badges?.[i] ?? false) : ((badgesByte >> i) & 1) === 1;
                                return `
                                <button data-badge-index="${i}" class="flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all ${earned ? 'bg-yellow-200 dark:bg-yellow-800 opacity-100' : 'bg-gray-100 dark:bg-gray-800 opacity-40'}" title="Badge ${i + 1}">
                                    <img src="${BADGE_SPRITE_BASE}/${i + 1}.png" alt="Badge ${i + 1}" class="w-8 h-8 pixelated" onerror="this.style.display='none'">
                                    <span class="text-[8px] font-bold ${earned ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400'}">${earned ? '✓' : '—'}</span>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                    <!-- Edit/Save/Cancel Buttons -->
                    <div class="pt-3 flex gap-2">
                        ${isEditing
                            ? `<button id="trainer-save-btn" class="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-colors">Save</button>
                               <button id="trainer-cancel-btn" class="flex-1 py-2 rounded-lg font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>`
                            : `<button id="trainer-edit-btn" class="w-full py-2 rounded-lg font-bold text-sm text-white transition-colors hover:brightness-110" style="background-color:${headerColor}">Edit Trainer</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
        <!-- RIGHT: Party -->
        <div class="lg:col-span-8 xl:col-span-9">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                ${sectionHeaderHTML('heart', `Party (${data.party?.length || 0}/6)`, theme,
                    `<span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">${data.party?.length || 0}</span>`)}
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    ${(data.party || []).map((mon, i) => matchesSearchFilter(mon) ? _renderPartyCard(mon, i) : _renderEmptySlot('party', i)).join('')}
                    ${_renderEmptyPartySlots(data.party?.length || 0)}
                </div>
            </div>
        </div>
    </div>`;
}

function _renderTrainerDisplayFields(trainer, isYellow, data) {
    let html = `
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Name</span><span class="font-bold text-gray-900 dark:text-white">${trainer.name || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Rival</span><span class="font-bold text-gray-900 dark:text-white">${trainer.rivalName || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Money</span><span class="font-bold text-green-600 dark:text-green-400">¥${(trainer.money || 0).toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Casino Coins</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${(trainer.casinoCoins || 0).toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Play Time</span><span class="font-mono text-gray-900 dark:text-white">${trainer.playTime || '0:00'}</span></div>`;
    if (isYellow && trainer.pikachuFriendship !== undefined) {
        html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Pikachu Friendship</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${trainer.pikachuFriendship}</span></div>`;
    }
    return html;
}

function _renderTrainerEditFields(form, trainer, isYellow) {
    const inputCls = 'w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500';
    return `
        <div class="space-y-2">
            <div><label class="text-[10px] text-gray-500">Name</label><input id="edit-name" class="${inputCls}" value="${form.name ?? trainer.name ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Rival Name</label><input id="edit-rival" class="${inputCls}" value="${form.rivalName ?? trainer.rivalName ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Trainer ID</label><input id="edit-id" type="number" class="${inputCls}" value="${form.id ?? trainer.id ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Money</label><input id="edit-money" type="number" class="${inputCls}" value="${form.money ?? trainer.money ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Casino Coins</label><input id="edit-coins" type="number" class="${inputCls}" value="${form.casinoCoins ?? trainer.casinoCoins ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Play Time</label><input id="edit-playtime" class="${inputCls}" value="${form.playTime ?? trainer.playTime ?? '0:00'}"></div>
            ${isYellow ? `<div><label class="text-[10px] text-gray-500">Pikachu Friendship</label><input id="edit-pikachu" type="number" min="0" max="255" class="${inputCls}" value="${form.pikachuFriendship ?? trainer.pikachuFriendship ?? 0}"></div>` : ''}
        </div>`;
}

function _renderPartyCard(mon, index) {
    if (!mon) return _renderEmptySlot('party', index);
    const types = getPokemonTypes(mon.dexId);
    const spriteUrl_ = spriteUrl(mon.dexId);

    return `
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow group"
             data-party-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'party', index })}'>
            <div class="flex items-start gap-2">
                <img src="${spriteUrl_}" alt="${mon.speciesName}" class="w-12 h-12 pixelated group-hover:scale-110 transition-transform" onerror="this.style.display='none'">
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm text-gray-900 dark:text-white truncate">${mon.nickname || mon.speciesName}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Lv.${mon.level} ${mon.speciesName}</div>
                    <div class="flex gap-1 mt-0.5">${types.map(t => typeBadgeHTML(t)).join('')}</div>
                </div>
            </div>
            ${hpBarHTML(mon.hp, mon.maxHp)}
        </div>`;
}

function _renderEmptySlot(type, index) {
    return `
        <div class="rounded-xl p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[80px] text-gray-300 dark:text-gray-600 text-xs"
             data-${type}-index="${index}">
            Empty
        </div>`;
}

function _renderEmptyPartySlots(count) {
    let html = '';
    for (let i = count; i < 6; i++) html += _renderEmptySlot('party', i);
    return html;
}

// ================================================================
// ---- TAB 2: STORAGE (PC & Bag) ----
// ================================================================

function _renderStorageTab(data, appState, theme) {
    const boxIdx = _localState.selectedBox;
    const box = data.pcBoxes?.[boxIdx] || [];
    const isMoveMode = appState.getIsMoveMode();

    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- PC Storage (Right) -->
        <div class="lg:col-span-9 lg:order-2">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                ${_renderPCHeader(data, boxIdx, theme)}
                <div class="grid grid-cols-5 gap-2" id="pc-box-grid">
                    ${Array.from({ length: 20 }, (_, i) => {
                        const mon = box[i];
                        if (mon && matchesSearchFilter(mon)) return _renderBoxSlot(mon, i, isMoveMode);
                        if (mon && !matchesSearchFilter(mon)) return _renderEmptyBoxSlot(i); // Hide filtered-out mons
                        return _renderEmptyBoxSlot(i);
                    }).join('')}
                </div>
            </div>
        </div>
        <!-- Inventory (Left) -->
        <div class="lg:col-span-3 lg:order-1">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 max-h-[600px] overflow-hidden flex flex-col">
                ${_renderInventoryPanel(data, theme)}
            </div>
        </div>
    </div>`;
}

function _renderPCHeader(data, boxIdx, theme) {
    const headerColor = gameHeaderColor(theme);
    const boxCount = data.pcBoxes?.[boxIdx]?.length || 0;

    return `
    <div class="flex flex-wrap items-center gap-2 mb-4">
        ${sectionHeaderHTML('monitor', `BOX ${boxIdx + 1}`, theme,
            `<span class="text-xs text-gray-400 ml-1">(${boxCount}/20)</span>`)}
        <div class="ml-auto flex items-center gap-1.5">
            <!-- Box Nav -->
            <button id="box-prev" class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" ${boxIdx <= 0 ? 'disabled' : ''}>
                <i data-lucide="chevron-left" class="w-4 h-4 text-gray-600 dark:text-gray-400"></i>
            </button>
            <select id="box-select" class="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 border-none outline-none cursor-pointer">
                ${Array.from({ length: 12 }, (_, i) =>
                    `<option value="${i}" ${i === boxIdx ? 'selected' : ''}>BOX ${i + 1}${i === data.currentBoxId ? ' ★' : ''}</option>`
                ).join('')}
            </select>
            <button id="box-next" class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" ${boxIdx >= 11 ? 'disabled' : ''}>
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 dark:text-gray-400"></i>
            </button>
            ${boxIdx !== data.currentBoxId ? `<button id="set-active-box" class="px-2 py-1 rounded-lg text-xs font-bold text-white transition-colors hover:brightness-110" style="background-color:${headerColor}">Set Active</button>` : ''}
        </div>
    </div>`;
}

function _renderBoxSlot(mon, index, isMoveMode) {
    const types = getPokemonTypes(mon.dexId);
    return `
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow text-center"
             data-box-index="${index}" draggable="true"
             data-drag-source='${JSON.stringify({ type: 'box', boxIndex: _localState.selectedBox, index })}'>
            <img src="${spriteUrl(mon.dexId)}" alt="${mon.speciesName}" class="w-10 h-10 mx-auto pixelated" onerror="this.style.display='none'">
            <div class="font-bold text-[11px] text-gray-900 dark:text-white truncate mt-0.5">${mon.nickname || mon.speciesName}</div>
            <div class="text-[10px] text-gray-400">Lv.${mon.level}</div>
            <div class="flex justify-center gap-0.5 mt-0.5">${typeDotsHTML(types)}</div>
        </div>`;
}

function _renderEmptyBoxSlot(index) {
    return `
        <div class="rounded-lg p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[70px] text-gray-300 dark:text-gray-600 text-xs"
             data-box-index="${index}">
        </div>`;
}

function _renderInventoryPanel(data, theme) {
    const view = _localState.itemView;
    const items = view === 'bag' ? (data.items || []) : (data.pcItems || []);
    const sortBy = _localState.itemSortBy;

    let sorted = [...items];
    if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else sorted.sort((a, b) => (a.id || 0) - (b.id || 0));

    return `
        <!-- Tabs -->
        <div class="flex gap-1 mb-3">
            <button class="item-tab-btn flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'bag' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-item-view="bag">
                <i data-lucide="shopping-bag" class="w-3 h-3 inline mr-1"></i>Bag
            </button>
            <button class="item-tab-btn flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'pc' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-item-view="pc">
                <i data-lucide="monitor" class="w-3 h-3 inline mr-1"></i>PC
            </button>
        </div>
        <!-- Sort -->
        <div class="flex gap-1 mb-2">
            <button class="item-sort-btn px-2 py-1 rounded text-[10px] font-bold transition-colors ${sortBy === 'id' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-item-sort="id">ByID</button>
            <button class="item-sort-btn px-2 py-1 rounded text-[10px] font-bold transition-colors ${sortBy === 'name' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-item-sort="name">ByName</button>
        </div>
        <!-- Item List -->
        <div class="flex-1 overflow-y-auto max-h-[420px] space-y-1.5 pr-1" style="scrollbar-width:thin;">
            ${sorted.length === 0
                ? `<div class="text-center text-gray-400 text-xs py-8">No items</div>`
                : sorted.map((item, i) => `
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors" data-item-index="${i}">
                        <span class="text-gray-700 dark:text-gray-300 text-xs flex-1 truncate">${item.name || `Item ${item.id}`}</span>
                        <span class="font-mono text-[10px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">x${item.count ?? 1}</span>
                    </div>`).join('')
            }
        </div>`;
}

// ================================================================
// ---- TAB 3: ENCOUNTERS ----
// ================================================================

function _renderEncountersTab(appState, theme) {
    const search = _localState.encounterSearch.toLowerCase();
    const filtered = EVENT_DISTRIBUTIONS.filter(e =>
        !search || e.title.toLowerCase().includes(search) || e.description.toLowerCase().includes(search) || e.tags.some(t => t.includes(search))
    );

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('gift', 'Mystery Gift', theme)}
            <!-- Search -->
            <div class="relative mb-6">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                <input id="encounter-search" type="text" placeholder="Search events..." value="${_localState.encounterSearch}"
                    class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <!-- Event Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${filtered.map(e => _renderEventCard(e, theme)).join('')}
                ${filtered.length === 0 ? '<div class="col-span-2 text-center text-gray-400 py-8">No events found</div>' : ''}
            </div>
        </div>
    </div>`;
}

function _renderEventCard(event, theme) {
    const headerColor = gameHeaderColor(theme);
    const types = getPokemonTypes(event.previewDexId);

    return `
    <div class="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex gap-3 p-4">
            <img src="${spriteUrl(event.previewDexId)}" alt="${event.title}" class="w-16 h-16 pixelated shrink-0" onerror="this.style.display='none'">
            <div class="flex-1 min-w-0">
                <div class="font-bold text-sm text-gray-900 dark:text-white">${event.title}</div>
                <div class="flex gap-1 mt-1">${types.map(t => typeBadgeHTML(t)).join('')}</div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">${event.description}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                    ${event.tags.map(t => `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">${t}</span>`).join('')}
                </div>
            </div>
        </div>
        <div class="px-4 pb-3">
            <button class="add-to-box-btn w-full py-1.5 rounded-lg text-xs font-bold text-white transition-colors hover:brightness-110" style="background-color:${headerColor}" data-event-id="${event.id}">
                <i data-lucide="plus" class="w-3 h-3 inline mr-1"></i>Add to Box
            </button>
        </div>
    </div>`;
}

// ================================================================
// ---- TAB 4: POKEDEX ----
// ================================================================

function _renderPokedexTab(data, appState, theme) {
    const owned = _localState.pokedexOwned || data.pokedexOwnedFlags || new Array(152).fill(false);
    const seen = _localState.pokedexSeen || data.pokedexSeenFlags || new Array(152).fill(false);
    const sortBy = _localState.pokedexSortBy;
    const search = _localState.pokedexSearch.toLowerCase();

    const ownedCount = owned.slice(1, 152).filter(Boolean).length;
    const seenCount = seen.slice(1, 152).filter(Boolean).length;

    let entries = [];
    for (let i = 1; i <= 151; i++) {
        const name = getPokemonName(i);
        if (search && !name.toLowerCase().includes(search) && !String(i).includes(search)) continue;
        entries.push({ dexId: i, name });
    }
    if (sortBy === 'name') entries.sort((a, b) => a.name.localeCompare(b.name));

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('book', 'Pokédex', theme,
                `<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">Owned: <b class="text-green-600 dark:text-green-400">${ownedCount}</b>/151 | Seen: <b class="text-blue-600 dark:text-blue-400">${seenCount}</b>/151</span>`)}
            <!-- Controls -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
                <div class="relative flex-grow max-w-xs">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                    <input id="pokedex-search" type="text" placeholder="Search Pokémon..." value="${_localState.pokedexSearch}"
                        class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button class="pokedex-sort-btn px-3 py-2 rounded-lg text-xs font-bold transition-colors ${sortBy === 'id' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-pokedex-sort="id">
                    <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>ID
                </button>
                <button class="pokedex-sort-btn px-3 py-2 rounded-lg text-xs font-bold transition-colors ${sortBy === 'name' ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}" data-pokedex-sort="name">
                    <i data-lucide="a-arrow-down" class="w-3 h-3 inline mr-1"></i>Name
                </button>
            </div>
            <!-- Grid -->
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                ${entries.map(e => _renderPokedexEntry(e, owned[e.dexId], seen[e.dexId])).join('')}
            </div>
        </div>
    </div>`;
}

function _renderPokedexEntry(entry, isOwned, isSeen) {
    const state = isOwned ? 'owned' : isSeen ? 'seen' : 'hidden';
    const borderCls = state === 'owned' ? 'border-green-500 ring-1 ring-green-400' : state === 'seen' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-200 dark:border-gray-700';
    const bgCls = state === 'hidden' ? 'bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800';
    const iconHtml = state === 'owned' ? '<i data-lucide="check" class="w-3 h-3 text-green-600"></i>' : state === 'seen' ? '<i data-lucide="eye" class="w-3 h-3 text-blue-500"></i>' : '';
    const showSprite = state !== 'hidden';

    return `
        <button class="pokedex-entry flex flex-col items-center p-2 rounded-lg border-2 ${borderCls} ${bgCls} cursor-pointer hover:shadow-md transition-all" data-dex-id="${entry.dexId}" data-dex-state="${state}">
            ${showSprite
                ? `<img src="${spriteUrl(entry.dexId)}" alt="${entry.name}" class="w-10 h-10 pixelated" onerror="this.style.display='none'">`
                : `<div class="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">?</div>`}
            <div class="text-[10px] text-gray-400 font-mono mt-0.5">#${String(entry.dexId).padStart(3, '0')}</div>
            <div class="text-[11px] font-bold text-gray-900 dark:text-white truncate w-full text-center">${showSprite ? entry.name : '???'}</div>
            <div class="mt-0.5">${iconHtml}</div>
        </button>`;
}

// ================================================================
// ---- TAB 5: BATTLE GUIDE ----
// ================================================================

function _renderBattleTab(theme) {
    const mode = _localState.battleMode;
    const selectedType = _localState.battleType;

    return `
    <div class="w-full">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            ${sectionHeaderHTML('swords', 'Battle Guide', theme)}
            <!-- Mode Toggle -->
            <div class="flex gap-2 mb-4">
                <button class="battle-mode-btn px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'defense' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-battle-mode="defense">
                    <i data-lucide="shield" class="w-4 h-4 inline mr-1"></i>Defense
                </button>
                <button class="battle-mode-btn px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'offense' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}" data-battle-mode="offense">
                    <i data-lucide="zap" class="w-4 h-4 inline mr-1"></i>Offense
                </button>
            </div>
            <!-- Type Selector -->
            <div class="flex flex-wrap gap-1.5 mb-6">
                ${GEN1_TYPES.map(t => `
                    <button class="battle-type-btn px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 ${t === selectedType ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-105' : 'opacity-80 hover:opacity-100'}"
                        style="background-color:${TYPE_COLORS[t]}" data-battle-type="${t}">${t}</button>
                `).join('')}
            </div>
            <!-- Results -->
            <div id="battle-results" class="space-y-4">
                ${mode === 'defense' ? _renderDefenseResults(selectedType) : _renderOffenseResults(selectedType)}
            </div>
        </div>
    </div>`;
}

function _renderDefenseResults(defenseType) {
    const chart = GEN1_TYPE_CHART;
    const categories = { '4x Weak': [], '2x Weak': [], '0.5x Resist': [], '0.25x Resist': [], '0x Immune': [], '1x Neutral': [] };

    for (const atkType of GEN1_TYPES) {
        const mult = chart[atkType]?.[defenseType] ?? 1;
        if (mult === 4) categories['4x Weak'].push(atkType);
        else if (mult === 2) categories['2x Weak'].push(atkType);
        else if (mult === 0.5) categories['0.5x Resist'].push(atkType);
        else if (mult === 0.25) categories['0.25x Resist'].push(atkType);
        else if (mult === 0) categories['0x Immune'].push(atkType);
        else categories['1x Neutral'].push(atkType);
    }

    return Object.entries(categories)
        .filter(([, types]) => types.length > 0 && !categories['1x Neutral']?.includes?.(null))
        .map(([label, types]) => {
            if (label === '1x Neutral' && types.length === 0) return '';
            const colorMap = { '4x Weak': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', '2x Weak': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', '0.5x Resist': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', '0.25x Resist': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', '0x Immune': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400', '1x Neutral': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
            return `
                <div class="rounded-xl p-3 ${colorMap[label] || 'bg-gray-100'}">
                    <div class="font-black text-xs uppercase mb-2">${label}</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${types.map(t => `<span class="px-2 py-1 rounded text-xs font-bold text-white" style="background-color:${TYPE_COLORS[t]}">${t}</span>`).join('')}
                        ${types.length === 0 ? '<span class="text-xs opacity-60">None</span>' : ''}
                    </div>
                </div>`;
        }).join('');
}

function _renderOffenseResults(offenseType) {
    const chart = GEN1_TYPE_CHART;
    const categories = { 'Super Effective (2x)': [], 'Super Effective (4x)': [], 'Not Very Effective (0.5x)': [], 'No Effect (0x)': [], 'Neutral (1x)': [] };

    for (const defType of GEN1_TYPES) {
        const mult = chart[offenseType]?.[defType] ?? 1;
        if (mult === 4) categories['Super Effective (4x)'].push(defType);
        else if (mult === 2) categories['Super Effective (2x)'].push(defType);
        else if (mult === 0.5) categories['Not Very Effective (0.5x)'].push(defType);
        else if (mult === 0) categories['No Effect (0x)'].push(defType);
        else categories['Neutral (1x)'].push(defType);
    }

    return Object.entries(categories)
        .filter(([, types]) => types.length > 0)
        .map(([label, types]) => {
            const colorMap = { 'Super Effective (4x)': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', 'Super Effective (2x)': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', 'Not Very Effective (0.5x)': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', 'No Effect (0x)': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400', 'Neutral (1x)': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
            return `
                <div class="rounded-xl p-3 ${colorMap[label] || 'bg-gray-100'}">
                    <div class="font-black text-xs uppercase mb-2">${label}</div>
                    <div class="flex flex-wrap gap-1.5">
                        ${types.map(t => `<span class="px-2 py-1 rounded text-xs font-bold text-white" style="background-color:${TYPE_COLORS[t]}">${t}</span>`).join('')}
                    </div>
                </div>`;
        }).join('');
}

// ================================================================
// ---- TAB 6: EVENTS ----
// ================================================================

function _renderEventsTab(data, appState, theme) {
    const flags = _localState.eventFlags || data.eventFlags || [];

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

// ================================================================
// ---- TAB 7: HALL OF FAME ----
// ================================================================

function _renderHofTab(data, theme) {
    const teams = data.hallOfFame || [];
    const headerColor = gameHeaderColor(theme);

    if (teams.length === 0) {
        return `
        <div class="w-full">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12">
                <div class="flex flex-col items-center text-center">
                    <i data-lucide="trophy" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 class="text-lg font-black text-gray-400 dark:text-gray-600 mb-2">No Records Found</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-600">Beat the Elite Four to record your first Hall of Fame team!</p>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="w-full space-y-6">
        ${teams.map((team, ti) => {
            const pokemon = Array.isArray(team) ? team : (team.pokemon || []);
            return `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <!-- Golden Header -->
                <div class="p-4 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 flex items-center gap-2">
                    <i data-lucide="crown" class="w-5 h-5 text-yellow-900"></i>
                    <span class="font-black text-yellow-900 text-sm uppercase tracking-wider">Champion Team #${ti + 1}</span>
                </div>
                <!-- Team Grid -->
                <div class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    ${pokemon.map(mon => {
                        if (!mon) return '<div class="text-center text-gray-400 text-xs py-4">Empty</div>';
                        const types = getPokemonTypes(mon.dexId);
                        return `
                        <div class="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <img src="${spriteUrl(mon.dexId)}" alt="${mon.speciesName || mon.nickname}" class="w-14 h-14 pixelated" onerror="this.style.display='none'">
                            <div class="font-bold text-xs text-gray-900 dark:text-white mt-1 truncate w-full text-center">${mon.nickname || mon.speciesName || '???'}</div>
                            <div class="text-[10px] text-gray-400">Lv.${mon.level || '?'}</div>
                            <div class="flex gap-0.5 mt-0.5">${typeDotsHTML(types)}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// ================================================================
// ---- EVENT BINDING ----
// ================================================================

function _bindContentEvents(container, eventBus, theme, appState) {
    // ---- Trainer Card ----
    const editBtn = container.querySelector('#trainer-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const tab = appState.getActiveTab();
            if (!tab) return;
            _localState.trainerEditing = true;
            // Convert badges byte to boolean array for the form
            const trainer = tab.data.trainer;
            const badgesByte = trainer.badges || 0;
            const badgesArray = Array.from({ length: 8 }, (_, i) => ((badgesByte >> i) & 1) === 1);
            _localState.trainerForm = { ...trainer, badges: badgesArray };
            _updateContentArea(container, eventBus, theme, appState);
        });
    }

    const saveBtn = container.querySelector('#trainer-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const form = _localState.trainerForm;
            // Read current values from inputs
            const nameEl = container.querySelector('#edit-name');
            const rivalEl = container.querySelector('#edit-rival');
            const idEl = container.querySelector('#edit-id');
            const moneyEl = container.querySelector('#edit-money');
            const coinsEl = container.querySelector('#edit-coins');
            const playtimeEl = container.querySelector('#edit-playtime');
            const pikachuEl = container.querySelector('#edit-pikachu');

            // Reconstruct badges byte from the checkbox state in the DOM
            let badgesByte = 0;
            container.querySelectorAll('[data-badge-index]').forEach(btn => {
                const idx = Number(btn.dataset.badgeIndex);
                // Check if the badge is earned (has the 'earned' visual class)
                const isEarned = btn.classList.contains('bg-yellow-200') || btn.classList.contains('dark:bg-yellow-800');
                if (isEarned || form.badges?.[idx]) {
                    badgesByte |= (1 << idx);
                }
            });

            // Validate play time format (expect "XXh YYm")
            const playTimeVal = playtimeEl?.value || form.playTime;
            const ptMatch = playTimeVal?.match(/^(\d+)h\s*(\d+)m$/);
            const playTime = ptMatch ? playTimeVal : form.playTime;

            const updates = {
                name: nameEl?.value || form.name,
                rivalName: rivalEl?.value || form.rivalName,
                id: idEl?.value ? Number(idEl.value) : form.id,
                money: moneyEl?.value ? Number(moneyEl.value) : form.money,
                casinoCoins: coinsEl?.value ? Number(coinsEl.value) : form.casinoCoins,
                playTime: playTime,
                badges: badgesByte,
            };
            if (pikachuEl) updates.pikachuFriendship = Number(pikachuEl.value);

            appState.handleTrainerUpdate(updates);
            _localState.trainerEditing = false;
            _localState.trainerForm = {};
            eventBus.emit(Events.TRAINER_UPDATED, updates);
        });
    }

    const cancelBtn = container.querySelector('#trainer-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            _localState.trainerEditing = false;
            _localState.trainerForm = {};
            _updateContentArea(container, eventBus, theme, appState);
        });
    }

    // Badge toggles
    container.querySelectorAll('[data-badge-index]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.badgeIndex);
            if (!_localState.trainerForm.badges) {
                const tab = appState.getActiveTab();
                _localState.trainerForm.badges = [...(tab?.data?.trainer?.badges || new Array(8).fill(false))];
            }
            _localState.trainerForm.badges[idx] = !_localState.trainerForm.badges[idx];
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    // ---- Party Cards ----
    container.querySelectorAll('[data-party-index]').forEach(card => {
        card.addEventListener('click', (e) => {
            const idx = Number(card.dataset.partyIndex);
            const loc = { type: 'party', index: idx };
            if (appState.getIsMoveMode()) {
                appState.handleGlobalPokemonSelect(loc, e);
            } else {
                const tab = appState.getActiveTab();
                const mon = tab?.data?.party?.[idx];
                if (mon) {
                    eventBus.emit(Events.OPEN_POKEMON_EDITOR, { mon, source: 'party', index: idx });
                }
            }
        });

        card.addEventListener('dragstart', (e) => {
            const idx = Number(card.dataset.partyIndex);
            const data = JSON.stringify({ type: 'party', index: idx });
            e.dataTransfer.setData('text/plain', data);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const idx = Number(card.dataset.partyIndex);
            appState.handleGlobalDrop({ type: 'party', index: idx }, e);
        });

        // Long press for move mode
        let longPressTimer = null;
        card.addEventListener('pointerdown', () => {
            longPressTimer = setTimeout(() => {
                if (!appState.getIsMoveMode()) {
                    appState.handleMoveModeToggle(true);
                }
            }, 600);
        });
        card.addEventListener('pointerup', () => clearTimeout(longPressTimer));
        card.addEventListener('pointerleave', () => clearTimeout(longPressTimer));
    });

    // ---- PC Box Navigation ----
    const boxPrev = container.querySelector('#box-prev');
    if (boxPrev) boxPrev.addEventListener('click', () => { _localState.selectedBox = Math.max(0, _localState.selectedBox - 1); _updateContentArea(container, eventBus, theme, appState); });

    const boxNext = container.querySelector('#box-next');
    if (boxNext) boxNext.addEventListener('click', () => { _localState.selectedBox = Math.min(11, _localState.selectedBox + 1); _updateContentArea(container, eventBus, theme, appState); });

    const boxSelect = container.querySelector('#box-select');
    if (boxSelect) boxSelect.addEventListener('change', (e) => { _localState.selectedBox = Number(e.target.value); _updateContentArea(container, eventBus, theme, appState); });

    const setActiveBox = container.querySelector('#set-active-box');
    if (setActiveBox) setActiveBox.addEventListener('click', () => { appState.handleSetActiveBox(_localState.selectedBox); });

    // ---- PC Box Slots ----
    container.querySelectorAll('[data-box-index]').forEach(slot => {
        slot.addEventListener('click', (e) => {
            const idx = Number(slot.dataset.boxIndex);
            const loc = { type: 'box', boxIndex: _localState.selectedBox, index: idx };
            if (appState.getIsMoveMode()) {
                appState.handleGlobalPokemonSelect(loc, e);
            } else {
                const tab = appState.getActiveTab();
                const mon = tab?.data?.pcBoxes?.[_localState.selectedBox]?.[idx];
                if (mon) {
                    eventBus.emit(Events.OPEN_POKEMON_EDITOR, { mon, source: 'box', index: idx, boxIndex: _localState.selectedBox });
                }
            }
        });

        slot.addEventListener('dragstart', (e) => {
            const idx = Number(slot.dataset.boxIndex);
            const data = JSON.stringify({ type: 'box', boxIndex: _localState.selectedBox, index: idx });
            e.dataTransfer.setData('text/plain', data);
            e.dataTransfer.effectAllowed = 'move';
        });

        slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const idx = Number(slot.dataset.boxIndex);
            appState.handleGlobalDrop({ type: 'box', boxIndex: _localState.selectedBox, index: idx }, e);
        });
    });

    // ---- Inventory ----
    container.querySelectorAll('.item-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _localState.itemView = btn.dataset.itemView;
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    container.querySelectorAll('.item-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _localState.itemSortBy = btn.dataset.itemSort;
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    // ---- Encounter Search ----
    const encSearch = container.querySelector('#encounter-search');
    if (encSearch) {
        encSearch.addEventListener('input', (e) => {
            _localState.encounterSearch = e.target.value;
            _updateContentArea(container, eventBus, theme, appState);
        });
    }

    // Add to Box buttons
    container.querySelectorAll('.add-to-box-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            const event = EVENT_DISTRIBUTIONS.find(e => e.id === eventId);
            if (event && event.bytes) {
                // Parse the event's raw .pk1 bytes into a proper PokemonStats object
                const bytes = event.bytes;
                let pk1Data = new Uint8Array(bytes);

                // Handle 71-byte variant (trim to 69 bytes: 3 padding + 66 data)
                if (pk1Data.length === 71) {
                    pk1Data = pk1Data.slice(0, 69);
                }

                const mon = parsePk1(pk1Data);
                if (mon) {
                    mon.isParty = false;
                    appState.handleAddPokemon(mon, 'pc');
                    eventBus.emit(Events.POKEMON_ADDED, { mon, target: 'pc' });
                } else {
                    // Fallback: show error if parsing fails
                    appState.showToast('Failed to parse event Pokémon data.');
                }
            }
        });
    });

    // ---- Pokédex ----
    const dexSearch = container.querySelector('#pokedex-search');
    if (dexSearch) {
        dexSearch.addEventListener('input', (e) => {
            _localState.pokedexSearch = e.target.value;
            _updateContentArea(container, eventBus, theme, appState);
        });
    }

    container.querySelectorAll('.pokedex-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _localState.pokedexSortBy = btn.dataset.pokedexSort;
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    container.querySelectorAll('.pokedex-entry').forEach(entry => {
        entry.addEventListener('click', () => {
            const dexId = Number(entry.dataset.dexId);
            const state = entry.dataset.dexState;
            const owned = _localState.pokedexOwned;
            const seen = _localState.pokedexSeen;

            if (state === 'hidden') {
                seen[dexId] = true;
            } else if (state === 'seen') {
                owned[dexId] = true;
            } else if (state === 'owned') {
                owned[dexId] = false;
                seen[dexId] = false;
            }

            appState.handlePokedexUpdate(owned, seen);
            eventBus.emit(Events.POKEDEX_UPDATED, { owned, seen });
        });
    });

    // ---- Battle Guide ----
    container.querySelectorAll('.battle-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _localState.battleMode = btn.dataset.battleMode;
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    container.querySelectorAll('.battle-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _localState.battleType = btn.dataset.battleType;
            _updateContentArea(container, eventBus, theme, appState);
        });
    });

    // ---- Event Flags ----
    container.querySelectorAll('.event-flag-toggle').forEach(toggle => {
        toggle.addEventListener('change', () => {
            const offset = Number(toggle.dataset.eventOffset);
            const flags = _localState.eventFlags;
            flags[offset] = !flags[offset];
            appState.handleEventFlagsUpdate(flags);
            eventBus.emit(Events.EVENT_FLAGS_UPDATED, flags);
        });
    });
}
