/**
 * appState.js — Centralized Application State Manager
 *
 * Replaces the React useState-based state management in App.tsx.
 * All state is stored here, and changes are communicated via the EventBus.
 * This is the single source of truth for the entire application.
 *
 * Phase 4 Refinements:
 * - Async file queue processing (replaces synchronous for-loop)
 * - Full Shift-select range logic (ported from React source)
 * - handleGlobalDrop for drag-and-drop support
 * - External removals in handleGlobalSort (Living Dex cross-save)
 * - Missing getters (isLoadModalOpen, fileQueue, isProcessingQueue)
 * - performCloseAll resets activeGameId via ThemeManager
 * - Version selector events (OPEN/CLOSE_VERSION_SELECTOR)
 * - Export cancel support
 * - EditorState integration events (POKEMON_ADDED, BOX_IMPORTED, etc.)
 */

import { Events } from './eventBus.js';
import { detectAndParseSave } from '../engine/parser.js';
import { writeGen1Save } from '../engine/writer.js';
import { transferPokemonBatch, movePokemonBatch, isSameLocation } from '../engine/manipulation.js';
import { sortPCBoxes } from '../engine/sortManager.js';

/**
 * @typedef {'home'|'storage'|'pokedex'|'battle'|'events'|'hof'|'encounters'} DashboardTab
 */

/**
 * @typedef {'Red'|'Blue'|'Yellow'} GameVersion
 */

/**
 * @typedef {Object} SaveTab
 * @property {string} id - Unique tab ID
 * @property {string} filename - Original file name
 * @property {Object} data - ParsedSave data
 * @property {GameVersion} version - Game version
 * @property {boolean} isDirty - Has unsaved changes
 * @property {DashboardTab} currentView - Active view for this tab
 */

/**
 * @typedef {Object} GlobalMoveSource
 * @property {string} tabId - Source tab ID
 * @property {Object} location - MoveLocation object ({type:'party',index} | {type:'box',boxIndex,index})
 */

export class AppState {
    /**
     * @param {import('./eventBus.js').EventBus} eventBus
     * @param {import('./theme.js').ThemeManager} [themeManager] - Optional ThemeManager for game theme sync
     */
    constructor(eventBus, themeManager) {
        /** @type {import('./eventBus.js').EventBus} */
        this._eventBus = eventBus;
        /** @type {import('./theme.js').ThemeManager|undefined} */
        this._themeManager = themeManager;

        // --- Save File Tabs ---
        /** @type {SaveTab[]} */
        this._tabs = [];
        /** @type {string|null} */
        this._activeTabId = null;

        // --- File Queue Management ---
        /** @type {File[]} */
        this._fileQueue = [];
        /** @type {boolean} */
        this._isProcessingQueue = false;
        /** @type {Object|null} ParsedSave awaiting version confirmation */
        this._pendingSaveData = null;

        // --- Modals ---
        /** @type {boolean} */
        this._isLoadModalOpen = false;
        /** @type {string|null} */
        this._tabToClose = null;
        /** @type {string|null} */
        this._errorMessage = null;
        /** @type {boolean} */
        this._isCloseAllConfirmOpen = false;
        /** @type {boolean} */
        this._isExportModalOpen = false;
        /** @type {string|null} */
        this._exportingTabId = null;

        // --- Move Mode ---
        /** @type {boolean} */
        this._isMoveMode = false;
        /** @type {GlobalMoveSource[]} */
        this._selectedMoveLocations = [];

        // --- Toast ---
        /** @type {string|null} */
        this._toastMessage = null;
        /** @type {number|null} */
        this._toastTimer = null;
    }

    // ================================================================
    // ---- GETTERS ----
    // ================================================================

    /** @returns {SaveTab[]} */
    getTabs() { return this._tabs; }

    /** @returns {string|null} */
    getActiveTabId() { return this._activeTabId; }

    /** @returns {SaveTab|undefined} */
    getActiveTab() {
        return this._tabs.find(t => t.id === this._activeTabId);
    }

    /** @returns {boolean} */
    getIsMoveMode() { return this._isMoveMode; }

    /** @returns {GlobalMoveSource[]} */
    getSelectedMoveLocations() { return this._selectedMoveLocations; }

    /** @returns {Object|null} */
    getPendingSaveData() { return this._pendingSaveData; }

    /** @returns {string|null} */
    getTabToClose() { return this._tabToClose; }

    /** @returns {string|null} */
    getErrorMessage() { return this._errorMessage; }

    /** @returns {boolean} */
    getIsCloseAllConfirmOpen() { return this._isCloseAllConfirmOpen; }

    /** @returns {boolean} */
    getIsExportModalOpen() { return this._isExportModalOpen; }

    /** @returns {string|null} */
    getExportingTabId() { return this._exportingTabId; }

    /** @returns {boolean} */
    getIsLoadModalOpen() { return this._isLoadModalOpen; }

    /** @returns {File[]} */
    getFileQueue() { return this._fileQueue; }

    /** @returns {boolean} */
    getIsProcessingQueue() { return this._isProcessingQueue; }

    /** @returns {Object[]} Current tab's selected move locations (filtered for active tab) */
    getCurrentTabSelections() {
        return this._selectedMoveLocations
            .filter(s => s.tabId === this._activeTabId)
            .map(s => s.location);
    }

    /**
     * Get a specific tab by its ID.
     * @param {string} tabId
     * @returns {SaveTab|undefined}
     */
    getTabById(tabId) {
        return this._tabs.find(t => t.id === tabId);
    }

    /**
     * Check if a save file has unsaved changes.
     * @param {string} tabId
     * @returns {boolean}
     */
    isTabDirty(tabId) {
        const tab = this.getTabById(tabId);
        return tab ? tab.isDirty : false;
    }

    // ================================================================
    // ---- TAB MANAGEMENT ----
    // ================================================================

    /**
     * Switch to a specific tab.
     * @param {string} tabId
     * @param {GameVersion} [version]
     */
    switchToTab(tabId, version) {
        this._activeTabId = tabId;
        if (!version) {
            const tab = this._tabs.find(t => t.id === tabId);
            version = tab?.version;
        }
        if (version) {
            const gameId = version.toLowerCase();
            if (this._themeManager) {
                this._themeManager.setActiveGameId(gameId);
            }
        }
        this._eventBus.emit(Events.ACTIVE_TAB_CHANGED, { tabId, version });
    }

    /**
     * Create a new save tab.
     * @param {Object} data - ParsedSave
     * @param {GameVersion} version
     */
    createNewTab(data, version) {
        const newTabId = crypto.randomUUID();
        /** @type {SaveTab} */
        const newTab = {
            id: newTabId,
            filename: data.originalFilename || `Save File ${this._tabs.length + 1}`,
            data: data,
            version: version,
            isDirty: false,
            currentView: 'home'
        };
        this._tabs = [...this._tabs, newTab];
        this._eventBus.emit(Events.TABS_CHANGED, this._tabs);
        this.switchToTab(newTabId, version);
    }

    /**
     * Update save data for a tab.
     * @param {string} tabId
     * @param {Object} newData - Updated ParsedSave
     */
    handleSaveUpdate(tabId, newData) {
        this._tabs = this._tabs.map(tab => {
            if (tab.id === tabId) {
                return { ...tab, data: newData, isDirty: true };
            }
            return tab;
        });
        this._eventBus.emit(Events.SAVE_UPDATED, { tabId, newData });
        this._eventBus.emit(Events.TABS_CHANGED, this._tabs);

        // If the updated tab is the active one, notify the editor to re-render
        if (tabId === this._activeTabId) {
            this._eventBus.emit(Events.EDITOR_DATA_CHANGED, newData);
        }
    }

    /**
     * Change the dashboard tab view for the active tab.
     * @param {DashboardTab} newView
     */
    handleDashboardTabChange(newView) {
        if (!this._activeTabId) return;
        this._tabs = this._tabs.map(t =>
            t.id === this._activeTabId ? { ...t, currentView: newView } : t
        );
        this._eventBus.emit(Events.DASHBOARD_TAB_CHANGED, newView);
    }

    // ================================================================
    // ---- CLOSE TAB LOGIC ----
    // ================================================================

    /**
     * Initiate closing a tab (shows confirmation if dirty).
     * @param {string} tabId
     */
    initiateCloseTab(tabId) {
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) return;

        if (tab.isDirty) {
            this._tabToClose = tabId;
            this._eventBus.emit(Events.OPEN_CLOSE_CONFIRM, tabId);
        } else {
            this._finalizeCloseTab(tabId);
        }
    }

    /**
     * Finalize closing a tab after confirmation.
     * @param {string} tabId
     */
    _finalizeCloseTab(tabId) {
        // Clean up selections from this tab
        this._selectedMoveLocations = this._selectedMoveLocations.filter(s => s.tabId !== tabId);

        const filtered = this._tabs.filter(t => t.id !== tabId);
        this._tabs = filtered;

        if (this._activeTabId === tabId) {
            if (filtered.length > 0) {
                const last = filtered[filtered.length - 1];
                this.switchToTab(last.id, last.version);
            } else {
                this._activeTabId = null;
                // Reset game theme when no tabs remain
                if (this._themeManager) {
                    this._themeManager.setActiveGameId(null);
                }
                this._eventBus.emit(Events.ACTIVE_TAB_CHANGED, { tabId: null });
            }
        }

        this._tabToClose = null;
        this._eventBus.emit(Events.TABS_CHANGED, this._tabs);
        this._eventBus.emit(Events.CLOSE_CLOSE_CONFIRM);
    }

    /**
     * Confirm close tab (with optional save).
     * @param {boolean} saveChanges
     */
    confirmCloseTab(saveChanges) {
        if (!this._tabToClose) return;
        if (saveChanges) {
            this._exportingTabId = this._tabToClose;
            this._isExportModalOpen = true;
            this._eventBus.emit(Events.OPEN_EXPORT_MODAL, { exportingTabId: this._tabToClose });
        } else {
            this._finalizeCloseTab(this._tabToClose);
        }
    }

    // ---- Close All ----

    requestCloseAll() {
        this._isCloseAllConfirmOpen = true;
        this._eventBus.emit(Events.OPEN_CLOSE_ALL_CONFIRM);
    }

    performCloseAll() {
        this._tabs = [];
        this._activeTabId = null;
        this._isCloseAllConfirmOpen = false;
        this._isMoveMode = false;
        this._selectedMoveLocations = [];

        // Reset game theme when all tabs closed
        if (this._themeManager) {
            this._themeManager.setActiveGameId(null);
        }

        this._eventBus.emit(Events.TABS_CHANGED, this._tabs);
        this._eventBus.emit(Events.ACTIVE_TAB_CHANGED, { tabId: null });
        this._eventBus.emit(Events.CLOSE_CLOSE_ALL_CONFIRM);
    }

    cancelCloseAll() {
        this._isCloseAllConfirmOpen = false;
        this._eventBus.emit(Events.CLOSE_CLOSE_ALL_CONFIRM);
    }

    // ================================================================
    // ---- FILE HANDLING (Async Queue Processor) ----
    // ================================================================

    /**
     * Handle files being selected (from drop zone or file picker).
     * Adds files to the queue and triggers processing.
     * @param {File[]} files
     */
    handleFilesSelected(files) {
        this._fileQueue = [...this._fileQueue, ...files];
        this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
            queue: this._fileQueue,
            isProcessing: this._isProcessingQueue
        });
        this._processQueue();
    }

    /**
     * Process the file queue one at a time (async).
     * This replaces the React useEffect-based queue processor.
     * Files are processed sequentially to avoid race conditions
     * with the version selector modal.
     * @private
     */
    async _processQueue() {
        // Guard: don't process if already processing, waiting for version, or have an error
        if (this._pendingSaveData || this._isProcessingQueue || this._fileQueue.length === 0 || this._errorMessage) {
            return;
        }

        this._isProcessingQueue = true;
        const currentFile = this._fileQueue[0];

        try {
            const result = await detectAndParseSave(currentFile);

            if (result.success && result.data) {
                const data = result.data;
                const versionStr = data.gameVersion || 'Red';

                if (versionStr === 'Yellow') {
                    // Yellow is unambiguous — create tab immediately
                    this.createNewTab(data, 'Yellow');
                    this._fileQueue = this._fileQueue.slice(1);
                    this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
                        queue: this._fileQueue,
                        isProcessing: this._isProcessingQueue
                    });
                } else {
                    // Red/Blue ambiguity — show version selector
                    this._pendingSaveData = data;
                    this._eventBus.emit(Events.PENDING_SAVE_CHANGED, data);
                    this._eventBus.emit(Events.OPEN_VERSION_SELECTOR, {
                        filename: data.originalFilename || 'Unknown File',
                        detectedVersion: versionStr
                    });
                    // Queue processing pauses here until version is confirmed/cancelled
                }
            } else {
                this._errorMessage = `Failed to load "${currentFile.name}".\n\nReason: ${result.error}`;
                this._eventBus.emit(Events.OPEN_ERROR_MODAL, this._errorMessage);
                this._fileQueue = this._fileQueue.slice(1);
                this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
                    queue: this._fileQueue,
                    isProcessing: this._isProcessingQueue
                });
            }
        } catch (e) {
            console.error(e);
            this._errorMessage = `Unexpected error processing "${currentFile.name}".`;
            this._eventBus.emit(Events.OPEN_ERROR_MODAL, this._errorMessage);
            this._fileQueue = this._fileQueue.slice(1);
            this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
                queue: this._fileQueue,
                isProcessing: this._isProcessingQueue
            });
        } finally {
            this._isProcessingQueue = false;
            // Continue processing queue if more files and no blocking state
            if (this._fileQueue.length > 0 && !this._pendingSaveData && !this._errorMessage) {
                this._processQueue();
            }
        }
    }

    /**
     * Confirm the game version for pending save data.
     * @param {GameVersion} selectedVersion
     */
    handleVersionConfirm(selectedVersion) {
        if (this._pendingSaveData) {
            const updatedData = { ...this._pendingSaveData, gameVersion: selectedVersion };
            this.createNewTab(updatedData, selectedVersion);
            this._pendingSaveData = null;
            this._fileQueue = this._fileQueue.slice(1);
            this._eventBus.emit(Events.PENDING_SAVE_CHANGED, null);
            this._eventBus.emit(Events.CLOSE_VERSION_SELECTOR);
            this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
                queue: this._fileQueue,
                isProcessing: this._isProcessingQueue
            });
            // Continue processing the queue
            this._processQueue();
        }
    }

    /**
     * Cancel version selection.
     */
    handleVersionCancel() {
        this._pendingSaveData = null;
        this._fileQueue = this._fileQueue.slice(1);
        this._eventBus.emit(Events.PENDING_SAVE_CHANGED, null);
        this._eventBus.emit(Events.CLOSE_VERSION_SELECTOR);
        this._eventBus.emit(Events.FILE_QUEUE_UPDATED, {
            queue: this._fileQueue,
            isProcessing: this._isProcessingQueue
        });
        // Continue processing the queue
        this._processQueue();
    }

    // ================================================================
    // ---- EXPORT ----
    // ================================================================

    /**
     * Handle export confirmation.
     * @param {'sav'|'srm'} extension
     */
    handleExportConfirmed(extension) {
        const targetId = this._exportingTabId || this._activeTabId;
        const tab = this._tabs.find(t => t.id === targetId);
        this._isExportModalOpen = false;

        if (!tab) {
            this._eventBus.emit(Events.CLOSE_EXPORT_MODAL);
            return;
        }

        try {
            const newBytes = writeGen1Save(tab.data);
            const blob = new Blob([newBytes], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            let baseName = tab.filename.replace(/\.(sav|srm)$/i, "");
            a.download = `${baseName}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // If this export was triggered by "Save & Close" confirmation
            if (this._exportingTabId) {
                this._finalizeCloseTab(this._exportingTabId);
                this._exportingTabId = null;
                this._tabToClose = null;
            } else {
                // Regular export — mark as clean
                this._tabs = this._tabs.map(t =>
                    t.id === targetId ? { ...t, isDirty: false } : t
                );
                this._eventBus.emit(Events.TABS_CHANGED, this._tabs);
            }
        } catch (e) {
            console.error("Failed to save", e);
            this._errorMessage = "Failed to generate save file.";
            this._eventBus.emit(Events.OPEN_ERROR_MODAL, this._errorMessage);
        }

        this._eventBus.emit(Events.CLOSE_EXPORT_MODAL);
    }

    /**
     * Handle export cancellation.
     */
    handleExportCancelled() {
        this._isExportModalOpen = false;
        this._exportingTabId = null;
        this._eventBus.emit(Events.CLOSE_EXPORT_MODAL);
    }

    // ================================================================
    // ---- MOVE MODE ----
    // ================================================================

    /**
     * Toggle move mode on/off.
     * @param {boolean} val
     */
    handleMoveModeToggle(val) {
        this._isMoveMode = val;
        this._selectedMoveLocations = [];
        this._eventBus.emit(Events.MOVE_MODE_TOGGLED, val);
        if (val) {
            this.showToast("Move Mode Active! Checkbox to select, Drag to move.");
        }
    }

    /**
     * Check if a location is selected in the current move mode.
     * @param {string} tabId
     * @param {Object} loc - MoveLocation
     * @returns {boolean}
     */
    isSelected(tabId, loc) {
        return this._selectedMoveLocations.some(s => s.tabId === tabId && isSameLocation(s.location, loc));
    }

    /**
     * Toggle selection of a Pokémon location.
     * @param {Object} location - MoveLocation
     */
    handleSelectionToggle(location) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const targetList = location.type === 'party' ? activeTab.data.party : activeTab.data.pcBoxes[location.boxIndex];
        const targetMon = targetList[location.index];
        if (!targetMon) return; // Cannot select empty slots

        if (this.isSelected(this._activeTabId, location)) {
            this._selectedMoveLocations = this._selectedMoveLocations.filter(
                s => !(s.tabId === this._activeTabId && isSameLocation(s.location, location))
            );
        } else {
            this._selectedMoveLocations = [...this._selectedMoveLocations, { tabId: this._activeTabId, location }];
        }
        this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
    }

    /**
     * Handle Pokémon selection (click/tap interaction) with full modifier key support.
     * Faithfully ported from App.tsx handleGlobalPokemonSelect.
     * @param {Object} location - MoveLocation
     * @param {MouseEvent} [e]
     */
    handleGlobalPokemonSelect(location, e) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const targetList = location.type === 'party' ? activeTab.data.party : activeTab.data.pcBoxes[location.boxIndex];
        const targetMon = targetList[location.index];
        const isEmpty = !targetMon;

        // --- 1. MODIFIERS (Shift/Ctrl) ---
        if (e?.ctrlKey || e?.metaKey) {
            this.handleSelectionToggle(location);
            return;
        }

        if (e?.shiftKey) {
            if (isEmpty) return;

            if (this._selectedMoveLocations.length === 0) {
                this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
                this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
                return;
            }

            // Get last selected item for range calculation
            const lastSelected = this._selectedMoveLocations[this._selectedMoveLocations.length - 1];
            const lastLoc = lastSelected.location;

            // Simple single select if cross-tab range attempt
            if (lastSelected.tabId !== this._activeTabId) {
                this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
                this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
                return;
            }

            // Cannot range-select across different container types
            if (lastLoc.type !== location.type) {
                this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
                this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
                return;
            }

            // Cannot range-select across different boxes
            if (lastLoc.type === 'box' && location.type === 'box') {
                if (lastLoc.boxIndex !== location.boxIndex) {
                    this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
                    this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
                    return;
                }
            }

            // Calculate range
            const currentBoxIndex = location.type === 'box' ? location.boxIndex : undefined;
            const start = Math.min(lastLoc.index, location.index);
            const end = Math.max(lastLoc.index, location.index);
            /** @type {GlobalMoveSource[]} */
            const range = [];

            for (let i = start; i <= end; i++) {
                if (targetList[i]) {
                    let loc;
                    if (currentBoxIndex !== undefined) {
                        loc = { type: 'box', boxIndex: currentBoxIndex, index: i };
                    } else {
                        loc = { type: 'party', index: i };
                    }
                    range.push({ tabId: this._activeTabId, location: loc });
                }
            }

            // Merge range into existing selections (avoid duplicates)
            const newSet = [...this._selectedMoveLocations];
            range.forEach(r => {
                if (!newSet.some(s => s.tabId === r.tabId && isSameLocation(s.location, r.location))) {
                    newSet.push(r);
                }
            });
            this._selectedMoveLocations = newSet;
            this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
            return;
        }

        // --- 2. NO MODIFIERS ---

        if (this._selectedMoveLocations.length === 0) {
            if (!isEmpty) {
                this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
                this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
            }
            return;
        }

        // If clicking an existing selected item → Reset selection to just this one
        if (this.isSelected(this._activeTabId, location)) {
            this._selectedMoveLocations = [{ tabId: this._activeTabId, location }];
            this._eventBus.emit(Events.SELECTION_TOGGLED, this._selectedMoveLocations);
            return;
        }

        // Execute move
        this._executeMoveOperation(this._selectedMoveLocations, location);
    }

    /**
     * Handle global Pokémon drop (drag-and-drop support).
     * Faithfully ported from App.tsx handleGlobalDrop.
     * @param {Object} target - MoveLocation (target drop location)
     * @param {DragEvent} [e]
     */
    handleGlobalDrop(target, e) {
        if (!this._activeTabId || !this.getActiveTab()) return;

        /** @type {GlobalMoveSource[]} */
        let sourcesToMove = [];

        // 1. Check if we have active selections (Move Mode or Multi-Select)
        if (this._selectedMoveLocations.length > 0) {
            sourcesToMove = this._selectedMoveLocations;
        }
        // 2. If no selection, check the Drag Event Data (Single Drag in Normal Mode)
        else if (e) {
            try {
                const data = e.dataTransfer.getData('text/plain');
                if (data) {
                    const singleSource = JSON.parse(data);
                    if (singleSource && (singleSource.index !== undefined)) {
                        // Assume the drag source came from the ACTIVE tab for now.
                        sourcesToMove = [{ tabId: this._activeTabId, location: singleSource }];
                    }
                }
            } catch (err) {
                console.error("Drop data parse error", err);
            }
        }

        if (sourcesToMove.length === 0) return;

        this._executeMoveOperation(sourcesToMove, target);
    }

    /**
     * Execute a move/transfer operation.
     * Shared logic for both click-to-move and drag-to-move.
     * @private
     * @param {GlobalMoveSource[]} sources
     * @param {Object} targetLocation
     */
    _executeMoveOperation(sources, targetLocation) {
        if (!sources.length) return;

        const firstSource = sources[0];
        const sourceTab = this._tabs.find(t => t.id === firstSource.tabId);
        const targetTab = this.getActiveTab();

        if (!sourceTab || !targetTab) return;

        const isSameSave = sourceTab.id === targetTab.id;

        // Filter to only sources from the same tab (cross-tab multi-select not supported in batch)
        const validSources = sources.filter(s => s.tabId === firstSource.tabId).map(s => s.location);

        const targetList = targetLocation.type === 'party'
            ? targetTab.data.party
            : targetTab.data.pcBoxes[targetLocation.boxIndex];
        const targetMon = targetList[targetLocation.index];
        const isTargetOccupied = !!targetMon;

        const isSameContainer = isSameSave && (
            (firstSource.location.type === 'party' && targetLocation.type === 'party') ||
            (firstSource.location.type === 'box' && targetLocation.type === 'box' && firstSource.location.boxIndex === targetLocation.boxIndex)
        );

        if (!isTargetOccupied && isSameContainer) {
            // Same-container reorder
            const result = movePokemonBatch(targetTab.data, validSources, targetLocation);
            if (result.success && result.newData) {
                this.handleSaveUpdate(this._activeTabId, result.newData);
                this._selectedMoveLocations = [];
                this._eventBus.emit(Events.SELECTION_TOGGLED, []);
                this.showToast("Reordered successfully!");
            } else {
                this.showToast(result.error || "Move failed.");
            }
        } else {
            // Cross-container/cross-save transfer
            const result = transferPokemonBatch(sourceTab.data, targetTab.data, validSources, targetLocation);
            if (result.success && result.newSource && result.newTarget) {
                if (isSameSave) {
                    // Same save — both source and target are the same save, just update once
                    this.handleSaveUpdate(sourceTab.id, result.newSource);
                } else {
                    // Different saves — update both
                    this.handleSaveUpdate(sourceTab.id, result.newSource);
                    this.handleSaveUpdate(targetTab.id, result.newTarget);
                }
                this._selectedMoveLocations = [];
                this._eventBus.emit(Events.SELECTION_TOGGLED, []);
                this.showToast(isSameSave ? "Moved successfully!" : "Transferred between saves!");
            } else {
                this.showToast(result.error || "Transfer failed.");
            }
        }
    }

    // ================================================================
    // ---- SORT ----
    // ================================================================

    /**
     * Handle global sort operation.
     * Fully ported from App.tsx handleGlobalSort, including external removals.
     * @param {string} scope - SortScope
     * @param {string} criteria - SortCriteria
     * @param {string} direction - SortDirection
     * @param {boolean} includeAllSaves
     */
    handleGlobalSort(scope, criteria, direction, includeAllSaves) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        /** @type {{ id: string, data: Object }[]} */
        let externalSources = [];
        if (includeAllSaves && scope === 'living-dex') {
            externalSources = this._tabs
                .filter(t => t.id !== this._activeTabId)
                .map(t => ({ id: t.id, data: t.data }));
        }

        const result = sortPCBoxes(activeTab.data, scope, criteria, direction, externalSources);

        if (result.success) {
            // 1. Update Target Save (The Living Dex)
            this.handleSaveUpdate(this._activeTabId, result.newData);

            // 2. Handle Removals from External Saves (If Pokemon were moved from other saves)
            if (result.externalRemovals && result.externalRemovals.size > 0) {
                this._tabs = this._tabs.map(tab => {
                    const removals = result.externalRemovals?.get(tab.id);
                    if (removals && removals.length > 0) {
                        // Deep clone arrays
                        const newParty = [...tab.data.party];
                        const newBoxes = tab.data.pcBoxes.map(b => [...b]);

                        // Sort removals by index DESC to avoid shifting issues when splicing
                        removals.sort((a, b) => b.index - a.index);

                        removals.forEach(rem => {
                            if (rem.location === 'party') {
                                newParty.splice(rem.index, 1);
                            } else if (rem.location === 'box' && rem.boxIndex !== undefined) {
                                newBoxes[rem.boxIndex].splice(rem.index, 1);
                            }
                        });

                        // Reconstruct tab data
                        const updatedData = {
                            ...tab.data,
                            party: newParty,
                            partyCount: newParty.length,
                            pcBoxes: newBoxes,
                            currentBoxPokemon: newBoxes[tab.data.currentBoxId],
                            currentBoxCount: newBoxes[tab.data.currentBoxId].length
                        };
                        return { ...tab, data: updatedData, isDirty: true };
                    }
                    return tab;
                });
                this._eventBus.emit(Events.TABS_CHANGED, this._tabs);
                this.showToast("Living Dex Generated! Pokemon moved from other saves.");
            } else {
                this.showToast("Box sorted successfully!");
            }
        }
    }

    // ================================================================
    // ---- TOAST ----
    // ================================================================

    /**
     * Show a toast message.
     * @param {string} msg
     */
    showToast(msg) {
        // Clear any existing timer
        if (this._toastTimer !== null) {
            clearTimeout(this._toastTimer);
        }
        this._toastMessage = msg;
        this._eventBus.emit(Events.SHOW_TOAST, msg);
        this._toastTimer = setTimeout(() => {
            this._toastMessage = null;
            this._eventBus.emit(Events.SHOW_TOAST, null);
            this._toastTimer = null;
        }, 3000);
    }

    // ================================================================
    // ---- MODAL STATE ----
    // ================================================================

    setLoadModalOpen(open) {
        this._isLoadModalOpen = open;
        if (open) this._eventBus.emit(Events.OPEN_LOAD_MODAL);
        else this._eventBus.emit(Events.CLOSE_LOAD_MODAL);
    }

    setExportModalOpen(open, exportingTabId = null) {
        this._isExportModalOpen = open;
        this._exportingTabId = exportingTabId;
        if (open) this._eventBus.emit(Events.OPEN_EXPORT_MODAL, { exportingTabId });
        else this._eventBus.emit(Events.CLOSE_EXPORT_MODAL);
    }

    dismissError() {
        this._errorMessage = null;
        this._eventBus.emit(Events.CLOSE_ERROR_MODAL);
        // Resume queue processing if there are pending files
        if (this._fileQueue.length > 0) {
            this._processQueue();
        }
    }

    // ================================================================
    // ---- EDITOR OPERATIONS (for EditorDashboard integration) ----
    // These methods handle updates from editor sub-components and
    // propagate them through the state system.
    // ================================================================

    /**
     * Add a Pokemon from the Encounter Database.
     * @param {Object} mon - PokemonStats
     * @param {'party'|'pc'} target
     */
    handleAddPokemon(mon, target) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data };

        if (target === 'party') {
            if (newData.party.length < 6) {
                mon.isParty = true;
                newData.party = [...newData.party, mon];
                newData.partyCount = newData.party.length;
                this.handleSaveUpdate(this._activeTabId, newData);
            } else {
                this.showToast("Party is full! Try adding to PC.");
            }
        } else {
            // Find space in Current Box first, then iterate
            let targetBoxIndex = newData.currentBoxId;
            let added = false;

            if (newData.pcBoxes[targetBoxIndex].length < 20) {
                newData.pcBoxes = newData.pcBoxes.map((box, i) =>
                    i === targetBoxIndex ? [...box, mon] : box
                );
                added = true;
            } else {
                // Find any box with space
                for (let i = 0; i < 12; i++) {
                    if (newData.pcBoxes[i].length < 20) {
                        newData.pcBoxes = newData.pcBoxes.map((box, idx) =>
                            idx === i ? [...box, mon] : box
                        );
                        targetBoxIndex = i;
                        added = true;
                        break;
                    }
                }
            }

            if (added) {
                // Update cache if we modified current box
                if (targetBoxIndex === newData.currentBoxId) {
                    newData.currentBoxPokemon = newData.pcBoxes[targetBoxIndex];
                    newData.currentBoxCount = newData.pcBoxes[targetBoxIndex].length;
                }
                this.handleSaveUpdate(this._activeTabId, newData);
            } else {
                this.showToast("PC Storage is completely full!");
            }
        }

        this._eventBus.emit(Events.POKEMON_ADDED, { mon, target });
    }

    /**
     * Import a full box of Pokemon.
     * @param {Object[]} newBoxData - Array of PokemonStats
     * @param {number} boxIndex
     */
    handleImportBox(newBoxData, boxIndex) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data };
        newData.pcBoxes = newData.pcBoxes.map((box, i) =>
            i === boxIndex ? newBoxData : box
        );

        // If we updated the currently active in-game box, update cache
        if (boxIndex === newData.currentBoxId) {
            newData.currentBoxPokemon = newBoxData;
            newData.currentBoxCount = newBoxData.length;
        }

        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.BOX_IMPORTED, { boxIndex, pokemon: newBoxData });
    }

    /**
     * Set the active PC box.
     * @param {number} boxIndex
     */
    handleSetActiveBox(boxIndex) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data };
        newData.currentBoxId = boxIndex;
        newData.currentBoxPokemon = newData.pcBoxes[boxIndex];
        newData.currentBoxCount = newData.pcBoxes[boxIndex].length;

        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.ACTIVE_BOX_CHANGED, boxIndex);
    }

    /**
     * Update trainer information.
     * @param {Object} updates - Partial TrainerInfo
     */
    handleTrainerUpdate(updates) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = {
            ...activeTab.data,
            trainer: { ...activeTab.data.trainer, ...updates }
        };
        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.TRAINER_UPDATED, updates);
    }

    /**
     * Update Pokedex flags.
     * @param {boolean[]} owned
     * @param {boolean[]} seen
     */
    handlePokedexUpdate(owned, seen) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const ownedCount = owned.filter((f, i) => i > 0 && i <= 151 && f).length;
        const seenCount = seen.filter((f, i) => i > 0 && i <= 151 && f).length;

        const newData = {
            ...activeTab.data,
            pokedexOwnedFlags: owned,
            pokedexSeenFlags: seen,
            pokedexOwned: ownedCount,
            pokedexSeen: seenCount
        };
        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.POKEDEX_UPDATED, { owned, seen });
    }

    /**
     * Update event flags.
     * @param {boolean[]} newFlags
     */
    handleEventFlagsUpdate(newFlags) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data, eventFlags: newFlags };
        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.EVENT_FLAGS_UPDATED, newFlags);
    }

    /**
     * Update inventory (bag + PC items).
     * @param {Object[]} newItems
     * @param {Object[]} newPcItems
     */
    handleInventoryUpdate(newItems, newPcItems) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data, items: newItems, pcItems: newPcItems };
        this.handleSaveUpdate(this._activeTabId, newData);
        this._eventBus.emit(Events.INVENTORY_UPDATED, { items: newItems, pcItems: newPcItems });
    }

    /**
     * Save an edited Pokemon back to the save data.
     * @param {Object} updatedMon - Updated PokemonStats
     * @param {'party'|'box'} source - Where the Pokemon came from
     * @param {number} index - Index in the list
     * @param {number} [boxIndex] - Box index (if source is 'box')
     */
    handleSavePokemon(updatedMon, source, index, boxIndex) {
        const activeTab = this.getActiveTab();
        if (!this._activeTabId || !activeTab) return;

        const newData = { ...activeTab.data };

        if (source === 'party') {
            newData.party = newData.party.map((mon, i) => i === index ? updatedMon : mon);
        } else if (source === 'box' && boxIndex !== undefined) {
            newData.pcBoxes = newData.pcBoxes.map((box, bi) =>
                bi === boxIndex ? box.map((mon, mi) => mi === index ? updatedMon : mon) : box
            );
            if (boxIndex === activeTab.data.currentBoxId) {
                newData.currentBoxPokemon = newData.pcBoxes[boxIndex];
            }
        }

        this.handleSaveUpdate(this._activeTabId, newData);
        // NOTE: Do NOT emit POKEMON_UPDATED here — the modal already emits it
        // before calling this method, and re-emitting causes an infinite loop.
        // The SAVE_UPDATED and TABS_CHANGED events emitted by handleSaveUpdate
        // are sufficient for all other UI modules to react.
    }
}
