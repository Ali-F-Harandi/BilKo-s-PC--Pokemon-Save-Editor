/**
 * eventBus.js — Central Event Bus for decoupled communication
 *
 * Implements a publish/subscribe pattern that replaces React's
 * state-driven re-rendering with event-driven DOM updates.
 * All modules communicate through this bus.
 *
 * Phase 4 Refinements:
 * - Added missing events (FILE_QUEUE_UPDATED, PENDING_SAVE_CHANGED,
 *   SORT_MODAL_TOGGLED, EXPORT_CANCELLED, POKEMON_ADDED, etc.)
 * - Debug logging capability (enable/disable at runtime)
 * - listenerCount() for development introspection
 * - removeAllListeners() for cleanup during tab close
 */

export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();

        /** @type {boolean} Debug mode — logs all events to console */
        this._debug = false;

        /** @type {string[]} Event names to suppress from debug logging */
        this._debugSuppress = [];
    }

    /**
     * Enable or disable debug logging for all emitted events.
     * @param {boolean} enabled
     * @param {string[]} [suppress] - Event names to suppress from logging
     */
    setDebug(enabled, suppress = []) {
        this._debug = enabled;
        this._debugSuppress = suppress;
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);

        // Return unsubscribe function for cleanup
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name
     * @param {Function} callback - Handler function to remove
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
            // Clean up empty sets to avoid memory leaks
            if (listeners.size === 0) {
                this._listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event with data.
     * @param {string} event - Event name
     * @param {*} data - Data to pass to handlers
     */
    emit(event, data) {
        if (this._debug && !this._debugSuppress.includes(event)) {
            console.log(`[EventBus] emit("${event}")`, data !== undefined ? data : '');
        }

        const listeners = this._listeners.get(event);
        if (listeners) {
            // Copy to array to avoid issues if handlers modify the set during iteration
            const handlers = [...listeners];
            for (const callback of handlers) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[EventBus] Error in handler for "${event}":`, err);
                }
            }
        }
    }

    /**
     * Subscribe to an event for one execution only.
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (...args) => {
            unsubscribe();
            callback(...args);
        });
        return unsubscribe;
    }

    /**
     * Remove all listeners for a specific event.
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        this._listeners.delete(event);
    }

    /**
     * Get the number of listeners for a specific event.
     * Useful for development/debugging.
     * @param {string} event - Event name
     * @returns {number}
     */
    listenerCount(event) {
        return this._listeners.get(event)?.size || 0;
    }

    /**
     * Remove all listeners for all events.
     * Used during full app reset (close all tabs).
     */
    clear() {
        this._listeners.clear();
    }
}

/**
 * Standard event names used across the application.
 * Centralized here for discoverability and to prevent typos.
 *
 * Each event is documented with its expected data payload type.
 */
export const Events = {
    // ---- Theme ----
    /** @payload {'light'|'dark'} mode */
    THEME_MODE_CHANGED: 'themeModeChanged',
    /** @payload {GameCartridge|undefined} gameTheme */
    GAME_THEME_CHANGED: 'gameThemeChanged',
    /** @payload {'default'|'blue'|'green'} themeColor */
    THEME_COLOR_CHANGED: 'themeColorChanged',

    // ---- Tabs / Save files ----
    /** @payload {SaveTab[]} tabs */
    TABS_CHANGED: 'tabsChanged',
    /** @payload {{ tabId: string|null, version?: GameVersion }} */
    ACTIVE_TAB_CHANGED: 'activeTabChanged',
    /** @payload {{ tabId: string, newData: ParsedSave }} */
    SAVE_UPDATED: 'saveUpdated',
    /** @payload {string} tabId */
    TAB_CLOSE_REQUESTED: 'tabCloseRequested',
    CLOSE_ALL_REQUESTED: 'closeAllRequested',

    // ---- File Handling ----
    /** @payload {File[]} files */
    FILES_SELECTED: 'filesSelected',
    /** @payload {{ queue: File[], isProcessing: boolean }} */
    FILE_QUEUE_UPDATED: 'fileQueueUpdated',
    /** @payload {ParsedSave|null} data */
    PENDING_SAVE_CHANGED: 'pendingSaveChanged',
    /** @payload {GameVersion} selectedVersion */
    VERSION_CONFIRMED: 'versionConfirmed',
    VERSION_CANCELLED: 'versionCancelled',
    /** @payload {'sav'|'srm'} extension */
    EXPORT_CONFIRMED: 'exportConfirmed',
    EXPORT_CANCELLED: 'exportCancelled',

    // ---- Modals ----
    OPEN_LOAD_MODAL: 'openLoadModal',
    CLOSE_LOAD_MODAL: 'closeLoadModal',
    /** @payload {{ exportingTabId: string|null }} */
    OPEN_EXPORT_MODAL: 'openExportModal',
    CLOSE_EXPORT_MODAL: 'closeExportModal',
    /** @payload {string} errorMessage */
    OPEN_ERROR_MODAL: 'openErrorModal',
    CLOSE_ERROR_MODAL: 'closeErrorModal',
    /** @payload {string} tabId */
    OPEN_CLOSE_CONFIRM: 'openCloseConfirm',
    CLOSE_CLOSE_CONFIRM: 'closeCloseConfirm',
    OPEN_CLOSE_ALL_CONFIRM: 'openCloseAllConfirm',
    CLOSE_CLOSE_ALL_CONFIRM: 'closeCloseAllConfirm',
    /** @payload {{ filename: string, detectedVersion: GameVersion }} */
    OPEN_VERSION_SELECTOR: 'openVersionSelector',
    CLOSE_VERSION_SELECTOR: 'closeVersionSelector',
    /** @payload {boolean} isOpen */
    SORT_MODAL_TOGGLED: 'sortModalToggled',

    // ---- Editor Navigation ----
    /** @payload {DashboardTab} newView */
    DASHBOARD_TAB_CHANGED: 'dashboardTabChanged',

    // ---- Move Mode ----
    /** @payload {boolean} isMoveMode */
    MOVE_MODE_TOGGLED: 'moveModeToggled',
    /** @payload {{ location: MoveLocation, event?: MouseEvent }} */
    POKEMON_SELECTED: 'pokemonSelected',
    /** @payload {{ location: MoveLocation, event?: DragEvent }} */
    POKEMON_DROPPED: 'pokemonDropped',
    /** @payload {GlobalMoveSource[]} selectedLocations */
    SELECTION_TOGGLED: 'selectionToggled',

    // ---- Sort ----
    /** @payload {{ scope: SortScope, criteria: SortCriteria, direction: SortDirection, includeAllSaves: boolean }} */
    SORT_REQUESTED: 'sortRequested',

    // ---- Toast ----
    /** @payload {string|null} message */
    SHOW_TOAST: 'showToast',

    // ---- Pokemon Editor ----
    /** @payload {{ mon: PokemonStats, source: 'party'|'box', index: number, boxIndex?: number }} */
    OPEN_POKEMON_EDITOR: 'openPokemonEditor',
    CLOSE_POKEMON_EDITOR: 'closePokemonEditor',
    /** @payload {PokemonStats} updatedMon */
    POKEMON_UPDATED: 'pokemonUpdated',

    // ---- Pokemon Operations ----
    /** @payload {{ mon: PokemonStats, target: 'party'|'pc' }} */
    POKEMON_ADDED: 'pokemonAdded',
    /** @payload {{ boxIndex: number, pokemon: PokemonStats[] }} */
    BOX_IMPORTED: 'boxImported',
    /** @payload {number} boxIndex */
    ACTIVE_BOX_CHANGED: 'activeBoxChanged',
    /** @payload {Partial<TrainerInfo>} updates */
    TRAINER_UPDATED: 'trainerUpdated',
    /** @payload {{ owned: boolean[], seen: boolean[] }} */
    POKEDEX_UPDATED: 'pokedexUpdated',
    /** @payload {boolean[]} flags */
    EVENT_FLAGS_UPDATED: 'eventFlagsUpdated',
    /** @payload {{ items: Item[], pcItems: Item[] }} */
    INVENTORY_UPDATED: 'inventoryUpdated',

    // ---- View Sync ----
    /** @payload {ParsedSave} data — fired when active tab's data changes and editor should re-render */
    EDITOR_DATA_CHANGED: 'editorDataChanged',

    // ---- Adapter Architecture (Phase 1) ----
    /** @payload {number} generationId — fired when a generation adapter is registered */
    ADAPTER_REGISTERED: 'adapterRegistered',
    /** @payload {{ generationId: number, adapter: BaseAdapter }} — fired when an adapter is created */
    ADAPTER_CREATED: 'adapterCreated',
    /** @payload {{ generationId: number, schema: Object }} — fired when schema is requested */
    SCHEMA_REQUESTED: 'schemaRequested',
};
