/**
 * BaseAdapter.js — Abstract Base Class for Generation Adapters
 *
 * Defines the interface that every generation adapter must implement.
 * This is the core of the Generation Adapter Pattern: each generation
 * (Gen 1, Gen 2, Gen 3, etc.) provides its own adapter that translates
 * between the binary save format and the Canonical Data Model.
 *
 * The adapter handles:
 * - Parsing: Binary → CanonicalSaveFile
 * - Writing: CanonicalSaveFile → Binary
 * - Validation: Checksum verification, data integrity
 * - Schema: UI field definitions for schema-driven rendering
 * - Data Access: Lookup tables for Pokemon, moves, items, types, abilities
 * - Text Encoding: Generation-specific character maps
 *
 * Usage:
 *   class Gen1Adapter extends BaseAdapter { ... }
 *   const adapter = new Gen1Adapter();
 *   const save = await adapter.parseSaveFile(uint8Array);
 */

export class BaseAdapter {
    /**
     * @param {number} generationId - Generation number (1, 2, 3, etc.)
     * @param {string[]} gameIds - Supported game IDs (e.g., ['red', 'blue', 'yellow'])
     * @param {string} generationName - Human-readable generation name (e.g., "Generation I")
     */
    constructor(generationId, gameIds, generationName) {
        if (new.target === BaseAdapter) {
            throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
        }
        /** @type {number} */
        this.generationId = generationId;
        /** @type {string[]} */
        this.gameIds = gameIds;
        /** @type {string} */
        this.generationName = generationName;
    }

    // ================================================================
    // ---- PARSING (Binary → Canonical) ----
    // ================================================================

    /**
     * Parse a complete save file from binary data.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @returns {Promise<import('./CanonicalModel.js').CanonicalSaveFile>}
     */
    async parseSaveFile(uint8Array) {
        throw new Error(`parseSaveFile() not implemented for ${this.generationName}`);
    }

    /**
     * Parse a single Pokemon from binary data.
     * @param {Uint8Array} uint8Array - Raw binary Pokemon struct
     * @param {'party'|'box'} context - Whether this is a party or box Pokemon
     * @returns {Promise<import('./CanonicalModel.js').CanonicalPokemon>}
     */
    async parsePokemon(uint8Array, context = 'party') {
        throw new Error(`parsePokemon() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- WRITING (Canonical → Binary) ----
    // ================================================================

    /**
     * Write a complete save file to binary data.
     * @param {import('./CanonicalModel.js').CanonicalSaveFile} canonicalSave - Canonical save data
     * @returns {Promise<Uint8Array>}
     */
    async writeSaveFile(canonicalSave) {
        throw new Error(`writeSaveFile() not implemented for ${this.generationName}`);
    }

    /**
     * Write a single Pokemon to binary data.
     * @param {import('./CanonicalModel.js').CanonicalPokemon} canonicalPokemon - Canonical Pokemon data
     * @returns {Promise<Uint8Array>}
     */
    async writePokemon(canonicalPokemon) {
        throw new Error(`writePokemon() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- VALIDATION ----
    // ================================================================

    /**
     * Validate a save file's integrity (checksum, structure, etc.).
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateSaveFile(uint8Array) {
        throw new Error(`validateSaveFile() not implemented for ${this.generationName}`);
    }

    /**
     * Validate a Pokemon's data integrity.
     * @param {import('./CanonicalModel.js').CanonicalPokemon} canonicalPokemon - Canonical Pokemon data
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validatePokemon(canonicalPokemon) {
        throw new Error(`validatePokemon() not implemented for ${this.generationName}`);
    }

    /**
     * Detect the game version from binary save data.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @param {string} [filename] - Optional filename for heuristics
     * @returns {string} Game version string
     */
    detectGameVersion(uint8Array, filename) {
        throw new Error(`detectGameVersion() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- SCHEMA (UI Field Definitions) ----
    // ================================================================

    /**
     * Get the UI schema for save file fields.
     * Defines which fields exist, their types, labels, and constraints.
     * @returns {Object} Schema object with sections and fields
     */
    getSaveSchema() {
        throw new Error(`getSaveSchema() not implemented for ${this.generationName}`);
    }

    /**
     * Get the UI schema for Pokemon fields.
     * @returns {Object} Schema object with sections and fields
     */
    getPokemonSchema() {
        throw new Error(`getPokemonSchema() not implemented for ${this.generationName}`);
    }

    /**
     * Get the UI schema for move fields.
     * @returns {Object} Schema object with sections and fields
     */
    getMoveSchema() {
        throw new Error(`getMoveSchema() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- DATA ACCESS (Lookup Tables) ----
    // ================================================================

    /**
     * Get the list of Pokemon names indexed by Dex ID.
     * @returns {string[]}
     */
    getPokemonList() {
        throw new Error(`getPokemonList() not implemented for ${this.generationName}`);
    }

    /**
     * Get the list of move names indexed by move ID.
     * @returns {string[]}
     */
    getMoveList() {
        throw new Error(`getMoveList() not implemented for ${this.generationName}`);
    }

    /**
     * Get the list of item names indexed by item ID.
     * @returns {string[]}
     */
    getItemList() {
        throw new Error(`getItemList() not implemented for ${this.generationName}`);
    }

    /**
     * Get the list of type names indexed by type ID.
     * @returns {string[]}
     */
    getTypeList() {
        throw new Error(`getTypeList() not implemented for ${this.generationName}`);
    }

    /**
     * Get the list of ability names indexed by ability ID.
     * Returns empty array for generations without abilities.
     * @returns {string[]}
     */
    getAbilityList() {
        throw new Error(`getAbilityList() not implemented for ${this.generationName}`);
    }

    /**
     * Get base stats for a Pokemon.
     * @param {number} dexId - National Dex ID
     * @returns {Object|null} Base stats object or null
     */
    getBaseStats(dexId) {
        throw new Error(`getBaseStats() not implemented for ${this.generationName}`);
    }

    /**
     * Get the internal-to-dex ID mapping for this generation.
     * @returns {number[]} Array where index = internal ID, value = Dex ID
     */
    getInternalToDexMap() {
        throw new Error(`getInternalToDexMap() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- TEXT ENCODING ----
    // ================================================================

    /**
     * Encode a string to generation-specific byte format.
     * @param {string} str - String to encode
     * @param {number} maxLength - Maximum byte length
     * @param {number} [terminator] - Terminator byte value
     * @returns {number[]} Array of byte values
     */
    encodeText(str, maxLength, terminator) {
        throw new Error(`encodeText() not implemented for ${this.generationName}`);
    }

    /**
     * Decode a generation-specific byte sequence to a string.
     * @param {Uint8Array} uint8Array - Byte array
     * @param {number} offset - Start offset
     * @param {number} maxLength - Maximum byte length
     * @returns {string}
     */
    decodeText(uint8Array, offset, maxLength) {
        throw new Error(`decodeText() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- STAT CALCULATION ----
    // ================================================================

    /**
     * Calculate a stat value for this generation.
     * @param {number} base - Base stat
     * @param {number} iv - Individual value
     * @param {number} ev - Effort value
     * @param {number} level - Pokemon level
     * @param {boolean} isHp - Whether this is the HP stat
     * @returns {number}
     */
    calculateStat(base, iv, ev, level, isHp) {
        throw new Error(`calculateStat() not implemented for ${this.generationName}`);
    }

    /**
     * Recalculate all stats for a Pokemon based on its base stats, IVs, EVs, and level.
     * @param {import('./CanonicalModel.js').CanonicalPokemon} pokemon
     * @returns {import('./CanonicalModel.js').CanonicalPokemon}
     */
    recalculateStats(pokemon) {
        throw new Error(`recalculateStats() not implemented for ${this.generationName}`);
    }

    // ================================================================
    // ---- CAPACITY & LIMITS ----
    // ================================================================

    /**
     * Get the maximum party size for this generation.
     * @returns {number}
     */
    getMaxPartySize() { return 6; }

    /**
     * Get the maximum box capacity for this generation.
     * @returns {number}
     */
    getBoxCapacity() { return 20; }

    /**
     * Get the number of PC boxes for this generation.
     * @returns {number}
     */
    getBoxCount() { return 12; }

    /**
     * Get the expected save file size(s) for this generation.
     * @returns {number[]} Array of valid file sizes
     */
    getValidFileSizes() {
        throw new Error(`getValidFileSizes() not implemented for ${this.generationName}`);
    }

    /**
     * Check if a file size is valid for this generation.
     * @param {number} size - File size in bytes
     * @returns {boolean}
     */
    isValidFileSize(size) {
        return this.getValidFileSizes().includes(size);
    }
}
