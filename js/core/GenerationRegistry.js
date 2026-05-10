/**
 * GenerationRegistry.js — Generation Adapter Registry
 *
 * Maintains a registry of all available generation adapters.
 * Adapters register themselves here, and the AdapterFactory queries
 * this registry to find the right adapter for a given save file.
 *
 * This enables a plugin-like architecture: adding a new generation
 * is as simple as registering its adapter class in this registry.
 */

import { Gen1Adapter } from '../generations/gen1/Gen1Adapter.js';

export class GenerationRegistry {
    constructor() {
        /** @type {Map<number, Function>} generationId → AdapterClass */
        this._adapters = new Map();

        /** @type {Map<string, number>} gameId → generationId */
        this._gameToGen = new Map();

        // Register built-in adapters
        this.register(Gen1Adapter);
    }

    /**
     * Register a generation adapter class.
     * @param {Function} AdapterClass - A class extending BaseAdapter
     */
    register(AdapterClass) {
        // Instantiate temporarily to get metadata
        const tempInstance = new AdapterClass();
        const genId = tempInstance.generationId;
        const gameIds = tempInstance.gameIds;

        this._adapters.set(genId, AdapterClass);

        // Map each game ID to its generation
        for (const gameId of gameIds) {
            this._gameToGen.set(gameId.toLowerCase(), genId);
        }
    }

    /**
     * Get the adapter class for a generation ID.
     * @param {number} generationId
     * @returns {Function|undefined}
     */
    getAdapterClass(generationId) {
        return this._adapters.get(generationId);
    }

    /**
     * Get the generation ID for a game ID.
     * @param {string} gameId - e.g., 'red', 'blue', 'yellow'
     * @returns {number|undefined}
     */
    getGenerationForGame(gameId) {
        return this._gameToGen.get(gameId.toLowerCase());
    }

    /**
     * Get all registered generation IDs.
     * @returns {number[]}
     */
    getRegisteredGenerations() {
        return Array.from(this._adapters.keys());
    }

    /**
     * Get all registered game IDs.
     * @returns {string[]}
     */
    getRegisteredGames() {
        return Array.from(this._gameToGen.keys());
    }

    /**
     * Check if a generation is registered.
     * @param {number} generationId
     * @returns {boolean}
     */
    hasGeneration(generationId) {
        return this._adapters.has(generationId);
    }

    /**
     * Check if a game is registered.
     * @param {string} gameId
     * @returns {boolean}
     */
    hasGame(gameId) {
        return this._gameToGen.has(gameId.toLowerCase());
    }
}
