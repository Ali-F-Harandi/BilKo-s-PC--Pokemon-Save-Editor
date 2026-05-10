/**
 * editorState.js — Editor Dashboard State Manager
 *
 * Manages the local state that was previously held in EditorDashboard.tsx.
 * This includes: selected Pokemon for editing, sort modal visibility,
 * and data synchronization between the active tab and the editor view.
 *
 * In React, EditorDashboard maintained:
 * - data: ParsedSave (synced from props via useEffect)
 * - selectedPokemon: { mon, source, index, boxIndex? } | null
 * - isSortModalOpen: boolean
 * - updateData(newData) — calls both local setData AND parent onSaveUpdate
 *
 * In vanilla JS, this module centralizes that state and emits events
 * for the editor dashboard UI to react to changes.
 */

import { Events } from './eventBus.js';

/**
 * @typedef {Object} SelectedPokemon
 * @property {Object} mon - PokemonStats
 * @property {'party'|'box'} source - Where the Pokemon came from
 * @property {number} index - Index in the party/box list
 * @property {number} [boxIndex] - Box index (only for 'box' source)
 */

export class EditorState {
    /**
     * @param {import('./eventBus.js').EventBus} eventBus
     * @param {import('./appState.js').AppState} appState
     */
    constructor(eventBus, appState) {
        /** @type {import('./eventBus.js').EventBus} */
        this._eventBus = eventBus;
        /** @type {import('./appState.js').AppState} */
        this._appState = appState;

        /** @type {Object|null} ParsedSave — synced from active tab */
        this._data = null;

        /** @type {SelectedPokemon|null} */
        this._selectedPokemon = null;

        /** @type {boolean} */
        this._isSortModalOpen = false;

        // ---- Bind to AppState events ----

        // Sync data when the active tab changes or save is updated
        this._eventBus.on(Events.ACTIVE_TAB_CHANGED, () => {
            this._syncFromActiveTab();
        });

        this._eventBus.on(Events.EDITOR_DATA_CHANGED, (newData) => {
            this._data = newData;
        });

        this._eventBus.on(Events.SAVE_UPDATED, ({ tabId, newData }) => {
            // Only update if it's the active tab
            if (tabId === this._appState.getActiveTabId()) {
                this._data = newData;
            }
        });

        // Reset selected Pokemon when switching tabs
        this._eventBus.on(Events.DASHBOARD_TAB_CHANGED, () => {
            this._selectedPokemon = null;
        });

        // Close sort modal when move mode is toggled on
        this._eventBus.on(Events.MOVE_MODE_TOGGLED, (isMoveMode) => {
            if (isMoveMode && this._isSortModalOpen) {
                this._isSortModalOpen = false;
                this._eventBus.emit(Events.SORT_MODAL_TOGGLED, false);
            }
        });
    }

    // ---- Getters ----

    /** @returns {Object|null} ParsedSave */
    getData() { return this._data; }

    /** @returns {SelectedPokemon|null} */
    getSelectedPokemon() { return this._selectedPokemon; }

    /** @returns {boolean} */
    getIsSortModalOpen() { return this._isSortModalOpen; }

    // ---- Data Sync ----

    /**
     * Synchronize data from the currently active tab.
     * Called when switching tabs or on initial load.
     * @private
     */
    _syncFromActiveTab() {
        const activeTab = this._appState.getActiveTab();
        if (activeTab) {
            this._data = activeTab.data;
        } else {
            this._data = null;
        }
        // Reset selected Pokemon when switching tabs
        this._selectedPokemon = null;
    }

    /**
     * Update data both locally and in AppState.
     * This mirrors the React pattern: setData(newData) + onSaveUpdate(newData)
     * @param {Object} newData - Updated ParsedSave
     */
    updateData(newData) {
        this._data = newData;
        const activeTabId = this._appState.getActiveTabId();
        if (activeTabId) {
            this._appState.handleSaveUpdate(activeTabId, newData);
        }
    }

    // ---- Pokemon Editor ----

    /**
     * Handle a Pokemon click (from party or PC slot).
     * In move mode, delegates to AppState's global handler.
     * In edit mode, opens the Pokemon editor modal.
     * @param {Object} mon - PokemonStats
     * @param {'party'|'box'} source
     * @param {number} index
     * @param {number|undefined} boxIndex
     * @param {MouseEvent} [e]
     */
    handlePokemonClick(mon, source, index, boxIndex, e) {
        if (this._appState.getIsMoveMode()) {
            // Delegate to AppState's global move handler
            const location = source === 'party'
                ? { type: 'party', index }
                : { type: 'box', boxIndex: boxIndex, index };
            this._appState.handleGlobalPokemonSelect(location, e);
        } else {
            // Edit Mode — open Pokemon editor
            this._selectedPokemon = { mon, source, index, boxIndex };
            this._eventBus.emit(Events.OPEN_POKEMON_EDITOR, { mon, source, index, boxIndex });
        }
    }

    /**
     * Handle an empty slot click.
     * Only relevant in move mode — delegates to AppState.
     * @param {Object} location - MoveLocation
     * @param {MouseEvent} [e]
     */
    handleEmptySlotClick(location, e) {
        if (this._appState.getIsMoveMode()) {
            this._appState.handleGlobalPokemonSelect(location, e);
        }
    }

    /**
     * Close the Pokemon editor.
     */
    handleCloseEditor() {
        this._selectedPokemon = null;
        this._eventBus.emit(Events.CLOSE_POKEMON_EDITOR);
    }

    /**
     * Save an edited Pokemon back to the save data.
     * @param {Object} updatedMon - Updated PokemonStats
     */
    handleSavePokemon(updatedMon) {
        if (!this._selectedPokemon) return;

        const { source, index, boxIndex } = this._selectedPokemon;
        this._appState.handleSavePokemon(updatedMon, source, index, boxIndex);

        // Update local selected Pokemon reference
        this._selectedPokemon = { ...this._selectedPokemon, mon: updatedMon };
    }

    // ---- Sort Modal ----

    /**
     * Toggle the sort settings modal.
     * @param {boolean} [isOpen] - Explicit open/close; toggles if omitted
     */
    toggleSortModal(isOpen) {
        this._isSortModalOpen = isOpen !== undefined ? isOpen : !this._isSortModalOpen;
        this._eventBus.emit(Events.SORT_MODAL_TOGGLED, this._isSortModalOpen);
    }

    // ---- Convenience Getters for UI ----

    /**
     * Get the current dashboard tab view from the active tab.
     * @returns {DashboardTab}
     */
    getCurrentView() {
        const activeTab = this._appState.getActiveTab();
        return activeTab ? activeTab.currentView : 'home';
    }

    /**
     * Check if the editor is currently showing the home/dashboard view.
     * @returns {boolean}
     */
    isHomeView() { return this.getCurrentView() === 'home'; }

    /**
     * Check if the editor is currently showing the storage/PC view.
     * @returns {boolean}
     */
    isStorageView() { return this.getCurrentView() === 'storage'; }

    /**
     * Check if the editor is currently showing the Pokédex view.
     * @returns {boolean}
     */
    isPokedexView() { return this.getCurrentView() === 'pokedex'; }

    /**
     * Check if the editor is currently showing the encounters view.
     * @returns {boolean}
     */
    isEncountersView() { return this.getCurrentView() === 'encounters'; }

    /**
     * Check if the editor is currently showing the battle guide view.
     * @returns {boolean}
     */
    isBattleView() { return this.getCurrentView() === 'battle'; }

    /**
     * Check if the editor is currently showing the events view.
     * @returns {boolean}
     */
    isEventsView() { return this.getCurrentView() === 'events'; }

    /**
     * Check if the editor is currently showing the Hall of Fame view.
     * @returns {boolean}
     */
    isHofView() { return this.getCurrentView() === 'hof'; }
}

/**
 * @typedef {'home'|'storage'|'pokedex'|'battle'|'events'|'hof'|'encounters'} DashboardTab
 */
