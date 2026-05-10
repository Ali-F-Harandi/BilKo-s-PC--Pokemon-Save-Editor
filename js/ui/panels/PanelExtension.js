/**
 * PanelExtension.js — Base Class for Panel Extensions
 *
 * Part of Phase 2 refactoring: Extension system for PokemonEditorModal panels.
 * Generations can register custom sections that appear in panels.
 */

export class PanelExtension {
    /**
     * @param {string} id - Unique identifier for this extension
     * @param {string} label - Display label for the section
     * @param {number} generation - Generation number this extension applies to
     */
    constructor(id, label, generation) {
        this.id = id;
        this.label = label;
        this.generation = generation;
    }

    /**
     * Render the extension's HTML content.
     * @param {Object} data - The current Pokemon data
     * @returns {string} HTML string
     */
    render(data) { return ''; }

    /**
     * Bind events for the extension's DOM elements.
     * @param {HTMLElement} container - The parent container element
     * @param {Object} eventBus - The event bus instance
     * @param {Object} appState - The app state instance
     */
    bindEvents(container, eventBus, appState) {}
}
