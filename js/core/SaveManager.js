/**
 * SaveManager.js — Automatic Generation Detection & Save Lifecycle Manager
 *
 * Replaces direct calls to parser.js/writer.js with adapter-based
 * operations that automatically detect the save generation and route
 * through the appropriate adapter.
 *
 * Phase 3: The AppState should use SaveManager instead of calling
 * detectAndParseSave() and writeGen1Save() directly.
 */

import { AdapterFactory } from './AdapterFactory.js';
import { Gen1Adapter } from '../generations/gen1/Gen1Adapter.js';
import { Gen2Adapter } from '../generations/gen2/Gen2Adapter.js';

export class SaveManager {
    /**
     * @param {AdapterFactory} adapterFactory
     */
    constructor(adapterFactory) {
        /** @type {AdapterFactory} */
        this._factory = adapterFactory;
        /** @type {Map<string, number>} tabId → generationId */
        this._tabGenerations = new Map();
    }

    /**
     * Load a save file, auto-detecting the generation.
     * Tries each registered adapter's validation to determine the generation.
     * @param {File} file - The file to load
     * @returns {Promise<{ success: boolean, data?: import('./CanonicalModel.js').CanonicalSaveFile, generationId?: number, gameVersion?: string, error?: string }>}
     */
    async loadSaveFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            let uint8Array = new Uint8Array(arrayBuffer);
            const filename = file.name;
            const size = uint8Array.length;

            // Handle .srm files with 16-byte headers (32784 bytes)
            if (size === 32768 + 16) {
                console.log(`[SaveManager] Detected 32784-byte file — stripping 16-byte header.`);
                uint8Array = uint8Array.slice(16);
            }

            console.log(`[SaveManager] Analyzing: ${filename} (${size} bytes${size !== uint8Array.length ? `, stripped to ${uint8Array.length}` : ''})`);

            // Try Gen 2 first (same file size as Gen 1, need to distinguish)
            const gen2Adapter = this._factory.createForGeneration(2);
            if (gen2Adapter && gen2Adapter.isValidFileSize(uint8Array.length)) {
                const gen2Validation = gen2Adapter.validateSaveFile(uint8Array);
                if (gen2Validation.valid) {
                    const result = await gen2Adapter.parseSaveFile(uint8Array, filename);
                    if (result.success && result.data) {
                        const gameVersion = gen2Adapter.detectGameVersion(uint8Array, filename);
                        result.data.gameVersion = gameVersion;
                        console.log(`[SaveManager] Detected Gen 2 save: ${gameVersion}`);
                        return {
                            success: true,
                            data: result.data,
                            generationId: 2,
                            gameVersion
                        };
                    }
                }
            }

            // Try Gen 1
            const gen1Adapter = this._factory.createForGeneration(1);
            if (gen1Adapter && gen1Adapter.isValidFileSize(uint8Array.length)) {
                const gen1Validation = gen1Adapter.validateSaveFile(uint8Array);
                if (gen1Validation.valid) {
                    const result = await gen1Adapter.parseSaveFile(uint8Array);
                    if (result.success && result.data) {
                        const gameVersion = gen1Adapter.detectGameVersion(uint8Array, filename);
                        result.data.gameVersion = gameVersion;
                        console.log(`[SaveManager] Detected Gen 1 save: ${gameVersion}`);
                        return {
                            success: true,
                            data: result.data,
                            generationId: 1,
                            gameVersion
                        };
                    }
                }
            }

            // No adapter could parse this file
            return {
                success: false,
                error: `Unsupported File Format.\n\nBilKo's PC accepts Generation 1 (Red/Blue/Yellow) and Generation 2 (Gold/Silver/Crystal) Save Files (32KB .sav).\n\nDetected Size: ${size} bytes${size !== uint8Array.length ? ` (stripped to ${uint8Array.length})` : ''}.`
            };
        } catch (err) {
            console.error('[SaveManager Error]', err);
            return { success: false, error: `Critical error during file analysis: ${err.message}` };
        }
    }

    /**
     * Export a save file using the appropriate adapter for the generation.
     * @param {import('./CanonicalModel.js').CanonicalSaveFile} canonicalSave - The save data
     * @param {number} generationId - The generation ID (1 or 2)
     * @returns {Uint8Array}
     */
    exportSaveFile(canonicalSave, generationId) {
        const adapter = this._factory.createForGeneration(generationId);
        if (!adapter) {
            throw new Error(`No adapter for generation ${generationId}`);
        }
        return adapter.writeSaveFile(canonicalSave);
    }

    /**
     * Register a tab's generation for later reference.
     * @param {string} tabId
     * @param {number} generationId
     */
    registerTabGeneration(tabId, generationId) {
        this._tabGenerations.set(tabId, generationId);
    }

    /**
     * Get the generation for a tab.
     * @param {string} tabId
     * @returns {number} Generation ID (defaults to 1 for backward compat)
     */
    getTabGeneration(tabId) {
        return this._tabGenerations.get(tabId) || 1;
    }

    /**
     * Remove a tab's generation registration.
     * @param {string} tabId
     */
    unregisterTabGeneration(tabId) {
        this._tabGenerations.delete(tabId);
    }

    /**
     * Get the adapter for a tab's generation.
     * @param {string} tabId
     * @returns {import('./BaseAdapter.js').BaseAdapter|null}
     */
    getAdapterForTab(tabId) {
        const genId = this.getTabGeneration(tabId);
        return this._factory.createForGeneration(genId);
    }
}
