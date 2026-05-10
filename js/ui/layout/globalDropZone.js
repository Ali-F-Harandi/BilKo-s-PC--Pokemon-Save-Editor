/**
 * globalDropZone.js — Global File Drag-and-Drop Overlay
 *
 * Allows dropping .sav/.srm files anywhere on the page.
 * Shows a full-screen visual overlay when files are dragged over the browser.
 *
 * This is a layout-level component because it spans the entire viewport
 * and operates independently of the current view (home or editor).
 *
 * Porting notes:
 * The original React app didn't have an explicit global drop zone,
 * but the DropZone component on the home page accepted files.
 * This vanilla JS version extends that to work anywhere on the page,
 * matching the desktop-app feel the original was going for.
 */

import { Events } from '../../state/eventBus.js';

/** @type {number} Counter for dragenter/dragleave events (nested elements cause multiple fires) */
let _dragCounter = 0;

/** @type {HTMLElement|null} The overlay element reference */
let _overlayEl = null;

/** @type {HTMLElement|null} The container element reference */
let _container = null;

/** @type {import('../../state/eventBus.js').EventBus|null} */
let _eventBus = null;

/** @type {import('../../state/appState.js').AppState|null} */
let _appState = null;

/**
 * Initialize the global drag-and-drop file overlay.
 * Sets up dragenter/dragleave/drop listeners on the document body.
 *
 * @param {HTMLElement} container - DOM element to render the overlay into
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initGlobalDropZone(container, eventBus, appState) {
    _container = container;
    _eventBus = eventBus;
    _appState = appState;

    // Prevent default browser behavior for drag events on the whole document
    document.addEventListener('dragover', _onDragOver);
    document.addEventListener('drop', _onDropOutside);
    // Handle drag cancel (user releases mouse outside window or presses Escape)
    document.addEventListener('dragend', _onDragEnd);
}

/**
 * Clean up global drag-and-drop listeners.
 */
export function destroyGlobalDropZone() {
    document.removeEventListener('dragover', _onDragOver);
    document.removeEventListener('drop', _onDropOutside);
    document.removeEventListener('dragend', _onDragEnd);
    _hideOverlay();
    _container = null;
    _eventBus = null;
    _appState = null;
}

/**
 * Handle dragover on the document.
 * Shows the overlay when files are dragged over the page.
 * @private
 * @param {DragEvent} e
 */
function _onDragOver(e) {
    e.preventDefault();

    // Only respond to file drags
    if (!e.dataTransfer || !e.dataTransfer.types.includes('Files')) return;

    // Show the overlay on first drag enter
    if (_dragCounter === 0) {
        _showOverlay();
    }
    _dragCounter++;
}

/**
 * Handle drop events that land outside the overlay.
 * @private
 * @param {DragEvent} e
 */
function _onDropOutside(e) {
    // Reset counter
    _dragCounter = 0;
    _hideOverlay();
}

/**
 * Handle dragend on the document (fires when a drag is cancelled or completed).
 * This ensures the overlay is hidden if the user cancels the drag by releasing
 * outside the window or pressing Escape.
 * @private
 */
function _onDragEnd() {
    _dragCounter = 0;
    _hideOverlay();
}

/**
 * Show the global drop overlay.
 * @private
 */
function _showOverlay() {
    if (!_container) return;

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'global-drop-overlay';
    _overlayEl.className = 'global-drop-overlay animate-fade-in';
    _overlayEl.innerHTML = `
        <div class="global-drop-content">
            <div class="global-drop-icon">
                <i data-lucide="upload" class="w-16 h-16"></i>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2">Drop Save File</h2>
            <p class="text-sm opacity-70">Drop your .sav or .srm file anywhere to load</p>
            <div class="flex gap-3 mt-4">
                <span class="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold">.sav</span>
                <span class="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold">.srm</span>
            </div>
        </div>
    `;

    // Handle drop on the overlay
    _overlayEl.addEventListener('dragleave', _onOverlayDragLeave);
    _overlayEl.addEventListener('drop', _onOverlayDrop);

    _container.appendChild(_overlayEl);

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Hide the global drop overlay.
 * @private
 */
function _hideOverlay() {
    if (_overlayEl) {
        _overlayEl.removeEventListener('dragleave', _onOverlayDragLeave);
        _overlayEl.removeEventListener('drop', _onOverlayDrop);
        _overlayEl.remove();
        _overlayEl = null;
    }
}

/**
 * Handle dragleave on the overlay.
 * Uses a counter to handle nested element dragleave events correctly.
 * @private
 * @param {DragEvent} e
 */
function _onOverlayDragLeave(e) {
    _dragCounter--;

    // Small delay to prevent flickering
    if (_dragCounter <= 0) {
        _dragCounter = 0;
        _hideOverlay();
    }
}

/**
 * Handle file drop on the overlay.
 * @private
 * @param {DragEvent} e
 */
function _onOverlayDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    _dragCounter = 0;
    _hideOverlay();

    if (!e.dataTransfer || !e.dataTransfer.files.length) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f =>
        f.name.endsWith('.sav') || f.name.endsWith('.srm') ||
        f.name.endsWith('.SAV') || f.name.endsWith('.SRM')
    );

    if (validFiles.length > 0 && _appState) {
        _appState.handleFilesSelected(validFiles);
    } else if (files.length > 0) {
        // Show error for invalid file types
        if (_eventBus) {
            _eventBus.emit(Events.OPEN_ERROR_MODAL, 'Invalid file type. Please drop .sav or .srm files only.');
        }
    }
}
