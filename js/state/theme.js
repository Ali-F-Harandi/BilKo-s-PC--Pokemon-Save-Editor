/**
 * theme.js — Theme Management Module
 *
 * Replaces the React ThemeContext with a vanilla JS class.
 * Manages light/dark mode, color themes, and game-specific color theming.
 * Persists theme preference to localStorage.
 *
 * Phase 4 Refinements:
 * - Added setTheme() method for 'default'|'blue'|'green' color themes
 * - Constructor accepts EventBus for emitting change events
 * - Proper event emission for all state changes
 * - Reset method for close-all-tabs scenario
 * - Game cartridge theme lookup with fallback
 */

import { Events } from './eventBus.js';
import { pokemonGames } from '../data/games.js';

export class ThemeManager {
    /**
     * @param {import('./eventBus.js').EventBus} [eventBus] - Optional event bus for emitting theme changes
     */
    constructor(eventBus) {
        /** @type {import('./eventBus.js').EventBus|undefined} */
        this._eventBus = eventBus;

        // Initialize from localStorage or default to 'light'
        const saved = typeof localStorage !== 'undefined'
            ? localStorage.getItem('themeMode')
            : null;
        /** @type {'light'|'dark'} */
        this._mode = saved === 'dark' ? 'dark' : 'light';

        /** @type {'default'|'blue'|'green'} */
        this._theme = 'default';

        /** @type {string|null} Game cartridge ID for game-specific theming */
        this._activeGameId = null;

        // Apply initial mode
        this._applyMode();
    }

    // ---- Getters ----

    /** @returns {'light'|'dark'} */
    get mode() {
        return this._mode;
    }

    /** @returns {'default'|'blue'|'green'} */
    get theme() {
        return this._theme;
    }

    /** @returns {string|null} */
    get activeGameId() {
        return this._activeGameId;
    }

    // ---- Actions ----

    /**
     * Toggle between light and dark mode.
     * Persists the new mode to localStorage.
     */
    toggleMode() {
        this._mode = this._mode === 'light' ? 'dark' : 'light';
        this._applyMode();
        localStorage.setItem('themeMode', this._mode);
        if (this._eventBus) {
            this._eventBus.emit(Events.THEME_MODE_CHANGED, this._mode);
        }
    }

    /**
     * Set the color theme ('default', 'blue', or 'green').
     * @param {'default'|'blue'|'green'} theme
     */
    setTheme(theme) {
        this._theme = theme;
        if (this._eventBus) {
            this._eventBus.emit(Events.THEME_COLOR_CHANGED, theme);
        }
    }

    /**
     * Set the active game ID for game-specific theming.
     * @param {string|null} id - Game ID ('red', 'blue', 'yellow', or null)
     */
    setActiveGameId(id) {
        this._activeGameId = id;
        if (this._eventBus) {
            this._eventBus.emit(Events.GAME_THEME_CHANGED, this.getGameTheme());
        }
    }

    /**
     * Get the current game cartridge theme object.
     * @returns {import('../data/games.js').GameCartridge|undefined}
     */
    getGameTheme() {
        if (!this._activeGameId) return undefined;
        return pokemonGames.find(g => g.id === this._activeGameId);
    }

    /**
     * Reset theme state (used when closing all tabs).
     * Resets game-specific theming but preserves light/dark mode.
     */
    reset() {
        this._activeGameId = null;
        if (this._eventBus) {
            this._eventBus.emit(Events.GAME_THEME_CHANGED, undefined);
        }
    }

    /**
     * Apply the current mode (light/dark) to the document.
     * @private
     */
    _applyMode() {
        const root = document.documentElement;
        if (this._mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }
}
