/**
 * FieldValidator.js — Modular, Scalable Validation System for Save Editing
 *
 * Provides per-generation validation rules for ALL editable fields:
 * - Trainer Card: name, rival name, ID, money, coins, play time, badges, friendship, gender
 * - Pokemon: level, species, moves, EVs, IVs/DVs, PP, held items, friendship, pokerus
 * - Inventory: item IDs, item quantities, pocket sizes
 *
 * Each generation defines its own constraints. The validation is UI-agnostic
 * and can be used by any panel (TrainerCardPanel, PokemonInfoPanel, InventoryPanel, etc.)
 *
 * Usage:
 *   const validator = FieldValidator.forGeneration(1);
 *   const result = validator.validateField('trainer', 'name', 'ASH');
 *   // result: { valid: true, value: 'ASH', error: null }
 *
 *   const result2 = validator.validateField('pokemon', 'level', 150);
 *   // result2: { valid: false, value: 100, error: 'Level must be 1-100' }
 */

// ================================================================
// ---- VALIDATION RESULT ----
// ================================================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the value is valid
 * @property {*} value - The clamped/cleaned value
 * @property {string|null} error - Error message if invalid, null if valid
 */

/**
 * Create a validation result object.
 * @param {boolean} valid
 * @param {*} value
 * @param {string|null} error
 * @returns {ValidationResult}
 */
function result(valid, value, error = null) {
    return { valid, value, error };
}

// ================================================================
// ---- PER-GENERATION LIMIT DEFINITIONS ----
// ================================================================

/**
 * Generation I field constraints (Red, Blue, Yellow).
 *
 * Research sources:
 * - Pokemon Red/Blue RAM Map: https://datacrystal.romhacking.net/wiki/Pokemon_Red/Blue/RAM_map
 * - PKHeX source code (SAV1.cs, PK1.cs)
 * - Gen 1 save format: 32,768 bytes (or 32,784 with header)
 * - Player name: 11 bytes (10 chars + 0x50 terminator), max 7 displayable in Western
 * - Rival name: same format
 * - Trainer ID: 2 bytes big-endian (0-65535)
 * - Money: 3 bytes binary (0-999999)
 * - Casino Coins: 2 bytes binary (0-9999)
 * - Badges: 1 byte (8 bits = 8 Kanto badges)
 * - Pikachu Friendship: 1 byte (0-255, Yellow only)
 * - Party: max 6 Pokemon
 * - PC Boxes: 12 boxes × 20 Pokemon
 * - Level: 1-100
 * - Species: 1-151 (0 = empty slot)
 * - Moves: 0-165
 * - EVs: 0-65535 (2 bytes each)
 * - IVs/DVs: 0-15 (4 bits each, packed into 2 bytes)
 * - PP: base PP * (1 + PP Ups * 3/8), max 61 for Splash
 * - Items: 0-255 (1 byte per item ID)
 * - Item quantity: 0-99 (1 byte per quantity)
 * - Catch Rate: 0-255 (1 byte, Gen1 only)
 */
const GEN1_LIMITS = {
    trainer: {
        name:           { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        rivalName:      { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        id:             { type: 'number', min: 0, max: 65535 },
        money:          { type: 'number', min: 0, max: 999999 },
        coins:          { type: 'number', min: 0, max: 9999 },
        badges:         { type: 'number', min: 0, max: 255 },    // 1 byte, 8 badges as bits
        pikachuFriendship: { type: 'number', min: 0, max: 255 }, // Yellow only
        playTime:       { type: 'playtime', maxHours: 999, maxMinutes: 59 },
    },
    pokemon: {
        level:          { type: 'number', min: 1, max: 100 },
        species:        { type: 'number', min: 1, max: 151 },     // 0 = empty
        hp:             { type: 'number', min: 0, max: 999 },
        maxHp:          { type: 'number', min: 1, max: 999 },
        attack:         { type: 'number', min: 0, max: 999 },
        defense:        { type: 'number', min: 0, max: 999 },
        speed:          { type: 'number', min: 0, max: 999 },
        special:        { type: 'number', min: 0, max: 999 },
        move1:          { type: 'number', min: 0, max: 165 },
        move2:          { type: 'number', min: 0, max: 165 },
        move3:          { type: 'number', min: 0, max: 165 },
        move4:          { type: 'number', min: 0, max: 165 },
        pp1:            { type: 'number', min: 0, max: 61 },
        pp2:            { type: 'number', min: 0, max: 61 },
        pp3:            { type: 'number', min: 0, max: 61 },
        pp4:            { type: 'number', min: 0, max: 61 },
        ppUps1:         { type: 'number', min: 0, max: 3 },
        ppUps2:         { type: 'number', min: 0, max: 3 },
        ppUps3:         { type: 'number', min: 0, max: 3 },
        ppUps4:         { type: 'number', min: 0, max: 3 },
        evHp:           { type: 'number', min: 0, max: 65535 },
        evAttack:       { type: 'number', min: 0, max: 65535 },
        evDefense:      { type: 'number', min: 0, max: 65535 },
        evSpeed:        { type: 'number', min: 0, max: 65535 },
        evSpecial:      { type: 'number', min: 0, max: 65535 },
        ivAttack:       { type: 'number', min: 0, max: 15 },
        ivDefense:      { type: 'number', min: 0, max: 15 },
        ivSpeed:        { type: 'number', min: 0, max: 15 },
        ivSpecial:      { type: 'number', min: 0, max: 15 },
        catchRate:      { type: 'number', min: 0, max: 255 },
        experience:     { type: 'number', min: 0, max: 16777215 }, // 3 bytes (0xFFFFFF)
    },
    inventory: {
        itemId:         { type: 'number', min: 0, max: 255 },
        itemQuantity:   { type: 'number', min: 1, max: 99 },
        bagSlots:       { type: 'number', min: 0, max: 20 },
        pcSlots:        { type: 'number', min: 0, max: 50 },
    },
    capacity: {
        partySize:      { type: 'number', min: 0, max: 6 },
        boxCapacity:    { type: 'number', min: 0, max: 20 },
        boxCount:       { type: 'number', min: 0, max: 12 },
        maxSpecies:     { type: 'number', min: 1, max: 151 },
        maxMoveId:      { type: 'number', min: 0, max: 165 },
        maxItemId:      { type: 'number', min: 0, max: 255 },
    }
};

/**
 * Generation II field constraints (Gold, Silver, Crystal).
 *
 * Research sources:
 * - PKHeX source code (SAV2.cs, PK2.cs, PokeList2.cs)
 * - pokecrystal/pokegold disassembly
 * - Gen 2 save format: 32,768 bytes (International)
 * - Player name: 11 bytes (10 chars + 0x50 terminator), max 7 displayable Western
 * - Rival name: 11 bytes, max 7 displayable
 * - Trainer ID: 2 bytes big-endian (0-65535)
 * - Money: 3 bytes binary (0-999999)
 * - Casino Coins: 2 bytes (0-9999)
 * - Johto Badges: 1 byte (8 bits)
 * - Kanto Badges: 1 byte (8 bits) — Gen2 has 16 badges total
 * - Gender: 1 byte (0x00=Male, 0x01=Female) — Crystal only
 * - Friendship: 1 byte (0-255)
 * - Pokerus: 1 byte (high nibble=strain 0-15, low nibble=days 0-15)
 * - Party: max 6 Pokemon
 * - PC Boxes: 14 boxes × 20 Pokemon
 * - Level: 1-100
 * - Species: 1-251 (0 = empty, 0xFD = egg)
 * - Moves: 0-251
 * - DVs: 0-15 (4 bits each, packed into 2 bytes: Atk/Def/Spd/Spc)
 * - EVs: 0-65535 (2 bytes each)
 * - PP: base PP * (1 + PP Ups * 3/8)
 * - Held Items: 0-255 (1 byte)
 * - Item quantity: 0-99
 * - Caught Data: 2 bytes (Crystal only)
 * - Experience: 3 bytes (max 16777215)
 */
const GEN2_LIMITS = {
    trainer: {
        name:           { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        rivalName:      { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        id:             { type: 'number', min: 0, max: 65535 },
        money:          { type: 'number', min: 0, max: 999999 },
        coins:          { type: 'number', min: 0, max: 9999 },
        johtoBadges:    { type: 'number', min: 0, max: 255 },
        kantoBadges:    { type: 'number', min: 0, max: 255 },
        gender:         { type: 'select', options: ['Male', 'Female'] },
        friendship:     { type: 'number', min: 0, max: 255 },
        playTime:       { type: 'playtime', maxHours: 999, maxMinutes: 59 },
    },
    pokemon: {
        level:          { type: 'number', min: 1, max: 100 },
        species:        { type: 'number', min: 1, max: 251 },
        hp:             { type: 'number', min: 0, max: 999 },
        maxHp:          { type: 'number', min: 1, max: 999 },
        attack:         { type: 'number', min: 0, max: 999 },
        defense:        { type: 'number', min: 0, max: 999 },
        speed:          { type: 'number', min: 0, max: 999 },
        spAttack:       { type: 'number', min: 0, max: 999 },
        spDefense:      { type: 'number', min: 0, max: 999 },
        move1:          { type: 'number', min: 0, max: 251 },
        move2:          { type: 'number', min: 0, max: 251 },
        move3:          { type: 'number', min: 0, max: 251 },
        move4:          { type: 'number', min: 0, max: 251 },
        pp1:            { type: 'number', min: 0, max: 61 },
        pp2:            { type: 'number', min: 0, max: 61 },
        pp3:            { type: 'number', min: 0, max: 61 },
        pp4:            { type: 'number', min: 0, max: 61 },
        ppUps1:         { type: 'number', min: 0, max: 3 },
        ppUps2:         { type: 'number', min: 0, max: 3 },
        ppUps3:         { type: 'number', min: 0, max: 3 },
        ppUps4:         { type: 'number', min: 0, max: 3 },
        evHp:           { type: 'number', min: 0, max: 65535 },
        evAttack:       { type: 'number', min: 0, max: 65535 },
        evDefense:      { type: 'number', min: 0, max: 65535 },
        evSpeed:        { type: 'number', min: 0, max: 65535 },
        evSpAttack:     { type: 'number', min: 0, max: 65535 },
        evSpDefense:    { type: 'number', min: 0, max: 65535 },
        ivAttack:       { type: 'number', min: 0, max: 15 },
        ivDefense:      { type: 'number', min: 0, max: 15 },
        ivSpeed:        { type: 'number', min: 0, max: 15 },
        ivSpecial:      { type: 'number', min: 0, max: 15 },
        heldItem:       { type: 'number', min: 0, max: 255 },
        friendship:     { type: 'number', min: 0, max: 255 },
        pokerus:        { type: 'number', min: 0, max: 255 },
        experience:     { type: 'number', min: 0, max: 16777215 },
        isEgg:          { type: 'boolean' },
        caughtData:     { type: 'number', min: 0, max: 65535 }, // Crystal only
    },
    inventory: {
        itemId:         { type: 'number', min: 0, max: 255 },
        itemQuantity:   { type: 'number', min: 1, max: 99 },
        bagSlots:       { type: 'number', min: 0, max: 20 },
        ballSlots:      { type: 'number', min: 0, max: 12 },
        keyItemSlots:   { type: 'number', min: 0, max: 25 },
        tmHmSlots:      { type: 'number', min: 0, max: 57 },
        pcSlots:        { type: 'number', min: 0, max: 50 },
    },
    capacity: {
        partySize:      { type: 'number', min: 0, max: 6 },
        boxCapacity:    { type: 'number', min: 0, max: 20 },
        boxCount:       { type: 'number', min: 0, max: 14 },
        maxSpecies:     { type: 'number', min: 1, max: 251 },
        maxMoveId:      { type: 'number', min: 0, max: 251 },
        maxItemId:      { type: 'number', min: 0, max: 255 },
    }
};

// ================================================================
// ---- FIELD VALIDATOR CLASS ----
// ================================================================

class FieldValidator {
    /**
     * @param {number} generationId - 1 or 2
     * @param {Object} limits - The limits object for this generation
     */
    constructor(generationId, limits) {
        this.generationId = generationId;
        this._limits = limits;
    }

    /**
     * Get the limits definition for a specific category and field.
     * @param {string} category - 'trainer', 'pokemon', 'inventory', 'capacity'
     * @param {string} field - Field name (e.g., 'name', 'level', 'money')
     * @returns {Object|null}
     */
    getFieldLimits(category, field) {
        return this._limits[category]?.[field] || null;
    }

    /**
     * Validate a single field value against its constraints.
     * Returns a validation result with the cleaned/clamped value.
     *
     * @param {string} category - 'trainer', 'pokemon', 'inventory', 'capacity'
     * @param {string} field - Field name
     * @param {*} value - The value to validate
     * @returns {ValidationResult}
     */
    validateField(category, field, value) {
        const limits = this.getFieldLimits(category, field);
        if (!limits) {
            // Unknown field — allow by default (don't block future extensions)
            return result(true, value);
        }

        switch (limits.type) {
            case 'number':
                return this._validateNumber(value, limits, field);
            case 'text':
                return this._validateText(value, limits, field);
            case 'select':
                return this._validateSelect(value, limits, field);
            case 'playtime':
                return this._validatePlayTime(value, limits, field);
            case 'boolean':
                return this._validateBoolean(value, field);
            default:
                return result(true, value);
        }
    }

    /**
     * Validate a number field.
     * @private
     */
    _validateNumber(value, limits, field) {
        let num = Number(value);

        if (isNaN(num)) {
            // Try to extract numeric part
            const parsed = parseInt(String(value), 10);
            if (isNaN(parsed)) {
                return result(false, limits.min, `${field}: must be a number`);
            }
            num = parsed;
        }

        // Round to integer (save format stores integers)
        num = Math.floor(num);

        // Clamp to valid range
        const clamped = Math.max(limits.min, Math.min(limits.max, num));
        const wasClamped = clamped !== num;

        if (wasClamped) {
            return result(false, clamped,
                `${field} must be ${limits.min}-${limits.max}`);
        }

        return result(true, clamped);
    }

    /**
     * Validate a text field (e.g., trainer name, rival name).
     * @private
     */
    _validateText(value, limits, field) {
        let str = String(value || '');

        // Trim to maxLength
        if (str.length > limits.maxLength) {
            str = str.substring(0, limits.maxLength);
            return result(false, str,
                `${field}: max ${limits.maxLength} characters`);
        }

        // Check minLength
        if (limits.minLength && str.length < limits.minLength) {
            return result(false, str,
                `${field}: min ${limits.minLength} character(s)`);
        }

        // Check pattern
        if (limits.pattern && !limits.pattern.test(str)) {
            return result(false, str,
                `${field}: contains invalid characters`);
        }

        return result(true, str);
    }

    /**
     * Validate a select/enum field (e.g., gender).
     * @private
     */
    _validateSelect(value, limits, field) {
        if (limits.options && !limits.options.includes(value)) {
            return result(false, limits.options[0],
                `${field}: must be one of ${limits.options.join(', ')}`);
        }
        return result(true, value);
    }

    /**
     * Validate a play time field (format: "123h 45m").
     * @private
     */
    _validatePlayTime(value, limits, field) {
        const str = String(value || '0h 0m');
        const match = str.match(/^(\d+)h\s*(\d+)m$/);

        if (!match) {
            return result(false, '0h 0m',
                `${field}: format must be "##h ##m"`);
        }

        let hours = parseInt(match[1], 10);
        let minutes = parseInt(match[2], 10);

        let clamped = false;
        if (hours > limits.maxHours) { hours = limits.maxHours; clamped = true; }
        if (minutes > limits.maxMinutes) { minutes = limits.maxMinutes; clamped = true; }

        const normalized = `${hours}h ${String(minutes).padStart(2, '0')}m`;

        if (clamped) {
            return result(false, normalized,
                `${field}: max ${limits.maxHours}h ${limits.maxMinutes}m`);
        }

        return result(true, normalized);
    }

    /**
     * Validate a boolean field.
     * @private
     */
    _validateBoolean(value, field) {
        if (typeof value === 'boolean') return result(true, value);
        if (value === 'true' || value === 1) return result(true, true);
        if (value === 'false' || value === 0) return result(true, false);
        return result(false, false, `${field}: must be true or false`);
    }

    /**
     * Validate an entire object (e.g., all trainer fields at once).
     * Returns { valid, errors, cleaned } where cleaned has all values clamped.
     *
     * @param {string} category - 'trainer', 'pokemon', 'inventory', 'capacity'
     * @param {Object} obj - Object with field key-value pairs
     * @returns {{ valid: boolean, errors: string[], cleaned: Object }}
     */
    validateObject(category, obj) {
        const errors = [];
        const cleaned = { ...obj };

        for (const [field, value] of Object.entries(obj)) {
            const r = this.validateField(category, field, value);
            cleaned[field] = r.value;
            if (!r.valid && r.error) {
                errors.push(r.error);
            }
        }

        return { valid: errors.length === 0, errors, cleaned };
    }

    /**
     * Get the max value for a number field (useful for input max attributes).
     * @param {string} category
     * @param {string} field
     * @returns {number|null}
     */
    getMax(category, field) {
        const limits = this.getFieldLimits(category, field);
        return limits?.max ?? null;
    }

    /**
     * Get the min value for a number field.
     * @param {string} category
     * @param {string} field
     * @returns {number|null}
     */
    getMin(category, field) {
        const limits = this.getFieldLimits(category, field);
        return limits?.min ?? null;
    }

    /**
     * Get the max length for a text field.
     * @param {string} category
     * @param {string} field
     * @returns {number|null}
     */
    getMaxLength(category, field) {
        const limits = this.getFieldLimits(category, field);
        return limits?.maxLength ?? null;
    }

    /**
     * Get options for a select field.
     * @param {string} category
     * @param {string} field
     * @returns {string[]|null}
     */
    getOptions(category, field) {
        const limits = this.getFieldLimits(category, field);
        return limits?.options ?? null;
    }

    /**
     * Quick clamp helper — clamp a value to the valid range for a field.
     * @param {string} category
     * @param {string} field
     * @param {number} value
     * @returns {number}
     */
    clamp(category, field, value) {
        const r = this.validateField(category, field, value);
        return r.value;
    }
}

// ================================================================
// ---- FACTORY ----
// ================================================================

const _instances = new Map();

/**
 * Get a FieldValidator instance for a specific generation.
 * @param {number} generationId - 1 or 2
 * @returns {FieldValidator}
 */
export function getFieldValidator(generationId) {
    if (_instances.has(generationId)) {
        return _instances.get(generationId);
    }

    let limits;
    switch (generationId) {
        case 1:  limits = GEN1_LIMITS; break;
        case 2:  limits = GEN2_LIMITS; break;
        default: limits = GEN1_LIMITS; break; // Fallback to Gen1
    }

    const instance = new FieldValidator(generationId, limits);
    _instances.set(generationId, instance);
    return instance;
}

/**
 * Convenience: validate a single field.
 * @param {number} generationId
 * @param {string} category
 * @param {string} field
 * @param {*} value
 * @returns {ValidationResult}
 */
export function validateField(generationId, category, field, value) {
    return getFieldValidator(generationId).validateField(category, field, value);
}

/**
 * Convenience: clamp a number value.
 * @param {number} generationId
 * @param {string} category
 * @param {string} field
 * @param {number} value
 * @returns {number}
 */
export function clampValue(generationId, category, field, value) {
    return getFieldValidator(generationId).clamp(category, field, value);
}
