/**
 * AdapterFactory.js — Generation Adapter Factory
 *
 * Creates adapter instances based on generation ID or game ID.
 * Uses the GenerationRegistry to find the appropriate adapter class
 * and instantiates it with the correct configuration.
 *
 * Usage:
 *   const factory = new AdapterFactory(registry);
 *   const adapter = factory.createForGeneration(1);
 *   const adapter2 = factory.createForGame('red');
 */

export class AdapterFactory {
    /**
     * @param {import('./GenerationRegistry.js').GenerationRegistry} registry
     */
    constructor(registry) {
        /** @type {import('./GenerationRegistry.js').GenerationRegistry} */
        this._registry = registry;

        /** @type {Map<number, import('./BaseAdapter.js').BaseAdapter>} Cached adapter instances */
        this._cache = new Map();
    }

    /**
     * Create (or retrieve from cache) an adapter for a specific generation.
     * @param {number} generationId
     * @returns {import('./BaseAdapter.js').BaseAdapter|null}
     */
    createForGeneration(generationId) {
        // Check cache first
        if (this._cache.has(generationId)) {
            return this._cache.get(generationId);
        }

        const AdapterClass = this._registry.getAdapterClass(generationId);
        if (!AdapterClass) {
            console.error(`[AdapterFactory] No adapter registered for generation ${generationId}`);
            return null;
        }

        const adapter = new AdapterClass();
        this._cache.set(generationId, adapter);
        return adapter;
    }

    /**
     * Create (or retrieve from cache) an adapter for a specific game.
     * @param {string} gameId - e.g., 'red', 'blue', 'yellow'
     * @returns {import('./BaseAdapter.js').BaseAdapter|null}
     */
    createForGame(gameId) {
        const genId = this._registry.getGenerationForGame(gameId);
        if (genId === undefined) {
            console.error(`[AdapterFactory] No generation found for game "${gameId}"`);
            return null;
        }
        return this.createForGeneration(genId);
    }

    /**
     * Auto-detect the generation from a save file and create the appropriate adapter.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @param {string} [filename] - Optional filename for heuristics
     * @returns {{ adapter: import('./BaseAdapter.js').BaseAdapter|null, generationId: number|null }}
     */
    detectAndCreate(uint8Array, filename) {
        // Try each registered generation to see which one can parse this file
        for (const genId of this._registry.getRegisteredGenerations()) {
            const adapter = this.createForGeneration(genId);
            if (adapter && adapter.isValidFileSize(uint8Array.length)) {
                const validation = adapter.validateSaveFile(uint8Array);
                if (validation.valid) {
                    return { adapter, generationId: genId };
                }
            }
        }

        // No adapter could validate the file
        return { adapter: null, generationId: null };
    }

    /**
     * Clear the adapter cache.
     */
    clearCache() {
        this._cache.clear();
    }
}
