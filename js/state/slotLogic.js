/**
 * slotLogic.js — Pokémon Slot Interaction Logic
 *
 * Faithful port of the React useSlotLogic hook.
 * Handles drag start, drop, long-press (500ms → enables move mode),
 * and click interactions for both party and PC box Pokémon slots.
 *
 * In React, this was a custom hook returning handler functions.
 * In vanilla JS, we use a factory function that returns an object
 * with event handler methods that can be bound to DOM elements.
 *
 * Usage:
 *   const slot = createSlotLogic({
 *       mon: pokemonData,
 *       index: 0,
 *       boxIndex: undefined,      // undefined for party, number for box
 *       isMoveMode: false,
 *       isSelected: false,
 *       onEnableMoveMode: () => { ... },
 *       onToggleSelection: (index, boxIndex?) => { ... },
 *       onPokemonClick: (mon, index, boxIndex?, e) => { ... },
 *       onEmptySlotClick: (index, boxIndex?, e) => { ... },
 *       onDropPokemon: (index, boxIndex?, e) => { ... },
 *   });
 *
 *   element.addEventListener('dragstart', slot.handleDragStart);
 *   element.addEventListener('drop', slot.handleDrop);
 *   element.addEventListener('pointerdown', slot.handlePointerDown);
 *   element.addEventListener('pointerup', slot.handlePointerUp);
 *   element.addEventListener('click', slot.handleClick);
 *   element.addEventListener('dragover', slot.handleDragOver);
 *
 *   // Clean up when removing the element:
 *   slot.cleanup();
 */

/**
 * @typedef {Object} SlotLogicConfig
 * @property {Object|undefined} mon - PokemonStats object, or undefined for empty slot
 * @property {number} index - Slot index in the list
 * @property {number} [boxIndex] - Box index (undefined for party slots)
 * @property {boolean} [isMoveMode] - Whether move mode is active
 * @property {boolean} [isSelected] - Whether this slot is selected in move mode
 * @property {Function} [onEnableMoveMode] - Callback to enable move mode
 * @property {Function} [onToggleSelection] - Callback to toggle selection (index, boxIndex?)
 * @property {Function} [onPokemonClick] - Callback for occupied slot click (mon, index, boxIndex?, e)
 * @property {Function} [onEmptySlotClick] - Callback for empty slot click (index, boxIndex?, e)
 * @property {Function} [onDropPokemon] - Callback for drop event (index, boxIndex?, e)
 */

/**
 * Create slot interaction logic for a Pokémon slot element.
 * @param {SlotLogicConfig} config
 * @returns {{ handleDragStart: Function, handleDrop: Function, handleDragOver: Function, handlePointerDown: Function, handlePointerUp: Function, handleClick: Function, cleanup: Function }}
 */
export function createSlotLogic(config) {
    const {
        mon,
        index,
        boxIndex,
        isMoveMode = false,
        isSelected = false,
        onEnableMoveMode,
        onToggleSelection,
        onPokemonClick,
        onEmptySlotClick,
        onDropPokemon
    } = config;

    /** @type {number|null} Long-press timer ID */
    let longPressTimer = null;

    /** @type {boolean} Whether a long press was triggered (to prevent click) */
    let longPressTriggered = false;

    // ---- Drag Start ----
    const handleDragStart = (e) => {
        // Auto-Enable Move Mode
        if (!isMoveMode && mon && onEnableMoveMode) {
            onEnableMoveMode();
        }

        const type = boxIndex !== undefined ? 'box' : 'party';

        // If not empty, set drag data
        if (mon || !isMoveMode) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ type, boxIndex, index }));
        }

        // Auto-select if in move mode and not already selected
        if (isMoveMode && !isSelected && onToggleSelection) {
            onToggleSelection(index, boxIndex);
        }
    };

    // ---- Drop ----
    const handleDrop = (e) => {
        if (onDropPokemon) {
            e.preventDefault();
            onDropPokemon(index, boxIndex, e);
        }
    };

    // ---- Drag Over (allow drops) ----
    const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    // ---- Long Press (Pointer Down) ----
    const handlePointerDown = () => {
        longPressTriggered = false;

        if (isMoveMode) return;

        longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            if (onEnableMoveMode) {
                onEnableMoveMode();
                // Haptic feedback (mobile)
                if (navigator.vibrate) navigator.vibrate(50);
                // Also select the item that was long-pressed
                if (onToggleSelection) onToggleSelection(index, boxIndex);
            }
        }, 500);
    };

    // ---- Pointer Up (cancel long press) ----
    const handlePointerUp = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    // ---- Click ----
    const handleClick = (e) => {
        // If a long press was just triggered, ignore the click
        if (longPressTriggered) {
            longPressTriggered = false;
            return;
        }

        if (mon) {
            onPokemonClick && onPokemonClick(mon, index, boxIndex, e);
        } else {
            onEmptySlotClick && onEmptySlotClick(index, boxIndex, e);
        }
    };

    // ---- Cleanup ----
    const cleanup = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    return {
        handleDragStart,
        handleDrop,
        handleDragOver,
        handlePointerDown,
        handlePointerUp,
        handleClick,
        cleanup
    };
}

/**
 * Bind slot logic to a DOM element.
 * Convenience function that attaches all event listeners and returns a cleanup function.
 *
 * @param {HTMLElement} element - The DOM element to bind to
 * @param {SlotLogicConfig} config - Slot logic configuration
 * @returns {Function} Cleanup function to remove all listeners
 */
export function bindSlotLogic(element, config) {
    const slot = createSlotLogic(config);

    element.addEventListener('dragstart', slot.handleDragStart);
    element.addEventListener('drop', slot.handleDrop);
    element.addEventListener('dragover', slot.handleDragOver);
    element.addEventListener('pointerdown', slot.handlePointerDown);
    element.addEventListener('pointerup', slot.handlePointerUp);
    element.addEventListener('pointerleave', slot.handlePointerUp); // Cancel if pointer leaves
    element.addEventListener('click', slot.handleClick);

    // Make element draggable if it contains a Pokemon
    if (config.mon) {
        element.draggable = true;
    }

    // Return cleanup function
    return () => {
        element.removeEventListener('dragstart', slot.handleDragStart);
        element.removeEventListener('drop', slot.handleDrop);
        element.removeEventListener('dragover', slot.handleDragOver);
        element.removeEventListener('pointerdown', slot.handlePointerDown);
        element.removeEventListener('pointerup', slot.handlePointerUp);
        element.removeEventListener('pointerleave', slot.handlePointerUp);
        element.removeEventListener('click', slot.handleClick);
        slot.cleanup();
    };
}
