/**
 * UIRegistry.js — UI Component Registry
 *
 * Tracks all active UI components in the application.
 * Useful for debugging, hot-reloading, and ensuring proper cleanup.
 *
 * Not strictly required but helps with development and diagnostics.
 */

export class UIRegistry {
    constructor() {
        /** @type {Map<string, import('./UIComponent.js').UIComponent>} containerId → Component */
        this._components = new Map();
    }

    /**
     * Register a component.
     * @param {import('./UIComponent.js').UIComponent} component
     */
    register(component) {
        this._components.set(component.containerId, component);
    }

    /**
     * Unregister a component.
     * @param {string} containerId
     */
    unregister(containerId) {
        this._components.delete(containerId);
    }

    /**
     * Get a component by its container ID.
     * @param {string} containerId
     * @returns {import('./UIComponent.js').UIComponent|undefined}
     */
    get(containerId) {
        return this._components.get(containerId);
    }

    /**
     * Get all registered components.
     * @returns {import('./UIComponent.js').UIComponent[]}
     */
    getAll() {
        return Array.from(this._components.values());
    }

    /**
     * Destroy and unregister all components.
     */
    destroyAll() {
        this._components.forEach(comp => comp.destroy());
        this._components.clear();
    }

    /**
     * Get the number of registered components.
     * @returns {number}
     */
    get count() {
        return this._components.size;
    }
}
