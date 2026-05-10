/**
 * UIComponent.js — Base Class for All UI Components
 *
 * Provides a consistent lifecycle (init, render, update, destroy)
 * and common DOM operations for all UI modules in the application.
 *
 * This replaces the module-level init/destroy pattern with an
 * object-oriented approach where each component manages its own
 * DOM element, state, and event subscriptions.
 *
 * Usage:
 *   class MyPanel extends UIComponent {
 *     render(data) { ... }
 *   }
 *   const panel = new MyPanel('my-panel', 'My Panel');
 *   panel.init(parentEl);
 *   panel.render(someData);
 */

export class UIComponent {
    /**
     * @param {string} containerId - Unique DOM element ID
     * @param {string} label - Human-readable label for the component
     */
    constructor(containerId, label) {
        /** @type {string} */
        this.containerId = containerId;
        /** @type {string} */
        this.label = label;
        /** @type {HTMLElement|null} */
        this.element = null;
        /** @type {UIComponent[]} */
        this.children = [];
        /** @type {boolean} */
        this.visible = true;
        /** @type {Function[]} Cleanup functions for event subscriptions */
        this._unsubs = [];
    }

    /**
     * Initialize the component: create DOM element and attach to parent.
     * @param {HTMLElement} parentEl - Parent element to attach to
     * @returns {this} For chaining
     */
    init(parentEl) {
        this.element = document.createElement('div');
        this.element.id = this.containerId;
        this.element.classList.add('ui-component');
        this.element.setAttribute('data-component', this.label);
        parentEl.appendChild(this.element);
        return this;
    }

    /**
     * Render the component with the given data.
     * Must be implemented by subclasses.
     * @param {*} data - Data to render
     */
    render(data) {
        throw new Error(`render() must be implemented by ${this.constructor.name}`);
    }

    /**
     * Update the component with new data (re-renders by default).
     * @param {*} data - Data to update with
     */
    update(data) {
        this.render(data);
    }

    /**
     * Show the component.
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
        }
        this.visible = true;
    }

    /**
     * Hide the component.
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.visible = false;
    }

    /**
     * Add a child component.
     * @param {UIComponent} component
     * @returns {this} For chaining
     */
    addChild(component) {
        this.children.push(component);
        return this;
    }

    /**
     * Remove a child component.
     * @param {UIComponent} component
     */
    removeChild(component) {
        const idx = this.children.indexOf(component);
        if (idx !== -1) {
            this.children[idx].destroy();
            this.children.splice(idx, 1);
        }
    }

    /**
     * Register an event subscription with automatic cleanup tracking.
     * @param {Function} unsubscribe - The unsubscribe function returned by EventBus.on()
     */
    trackSubscription(unsubscribe) {
        this._unsubs.push(unsubscribe);
    }

    /**
     * Destroy the component and all its children.
     * Removes DOM elements and cleans up event subscriptions.
     */
    destroy() {
        // Destroy children first
        this.children.forEach(c => c.destroy());
        this.children = [];

        // Unsubscribe from all events
        this._unsubs.forEach(unsub => {
            try { unsub(); } catch (e) { /* ignore */ }
        });
        this._unsubs = [];

        // Remove DOM element
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * Check if the component is initialized.
     * @returns {boolean}
     */
    isInitialized() {
        return this.element !== null;
    }
}
