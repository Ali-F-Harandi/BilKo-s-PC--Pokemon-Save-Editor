/**
 * BaseFieldValidator.js — Abstract Base Class for Per-Generation Field Validation
 *
 * Each generation provides its own FieldValidator extending this base class,
 * following the same adapter pattern used by Gen1Adapter/Gen2Adapter.
 *
 * Subclasses must:
 * 1. Call super(generationId) with their generation number
 * 2. Define this._limits with categories (trainer, pokemon, inventory, capacity)
 *
 * Usage:
 *   class Gen1FieldValidator extends BaseFieldValidator { ... }
 *   const validator = new Gen1FieldValidator();
 *   const result = validator.validateField('trainer', 'name', 'ASH');
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
function _result(valid, value, error = null) {
    return { valid, value, error };
}

// ================================================================
// ---- BASE FIELD VALIDATOR CLASS ----
// ================================================================

export class BaseFieldValidator {
    /**
     * @param {number} generationId - Generation number (1, 2, 3, etc.)
     */
    constructor(generationId) {
        if (new.target === BaseFieldValidator) {
            throw new Error('BaseFieldValidator is abstract and cannot be instantiated directly');
        }
        /** @type {number} */
        this.generationId = generationId;
        /** @type {Object} — Subclasses must set this in their constructor */
        this._limits = {};
    }

    // ================================================================
    // ---- LIMIT ACCESS ----
    // ================================================================

    /**
     * Get the limits definition for a specific category and field.
     * @param {string} category - 'trainer', 'pokemon', 'inventory', 'capacity'
     * @param {string} field - Field name (e.g., 'name', 'level', 'money')
     * @returns {Object|null}
     */
    getFieldLimits(category, field) {
        return this._limits[category]?.[field] || null;
    }

    // ================================================================
    // ---- VALIDATION ----
    // ================================================================

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
            return _result(true, value);
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
                return _result(true, value);
        }
    }

    /**
     * Validate a number field.
     * @private
     */
    _validateNumber(value, limits, field) {
        let num = Number(value);

        if (isNaN(num)) {
            const parsed = parseInt(String(value), 10);
            if (isNaN(parsed)) {
                return _result(false, limits.min, `${field}: must be a number`);
            }
            num = parsed;
        }

        // Round to integer (save format stores integers)
        num = Math.floor(num);

        // Clamp to valid range
        const clamped = Math.max(limits.min, Math.min(limits.max, num));
        const wasClamped = clamped !== num;

        if (wasClamped) {
            return _result(false, clamped,
                `${field} must be ${limits.min}-${limits.max}`);
        }

        return _result(true, clamped);
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
            return _result(false, str,
                `${field}: max ${limits.maxLength} characters`);
        }

        // Check minLength
        if (limits.minLength && str.length < limits.minLength) {
            return _result(false, str,
                `${field}: min ${limits.minLength} character(s)`);
        }

        // Check pattern
        if (limits.pattern && !limits.pattern.test(str)) {
            return _result(false, str,
                `${field}: contains invalid characters`);
        }

        return _result(true, str);
    }

    /**
     * Validate a select/enum field (e.g., gender).
     * @private
     */
    _validateSelect(value, limits, field) {
        if (limits.options && !limits.options.includes(value)) {
            return _result(false, limits.options[0],
                `${field}: must be one of ${limits.options.join(', ')}`);
        }
        return _result(true, value);
    }

    /**
     * Validate a play time field (format: "123h 45m").
     * @private
     */
    _validatePlayTime(value, limits, field) {
        const str = String(value || '0h 0m');
        const match = str.match(/^(\d+)h\s*(\d+)m$/);

        if (!match) {
            return _result(false, '0h 0m',
                `${field}: format must be "##h ##m"`);
        }

        let hours = parseInt(match[1], 10);
        let minutes = parseInt(match[2], 10);

        let clamped = false;
        if (hours > limits.maxHours) { hours = limits.maxHours; clamped = true; }
        if (minutes > limits.maxMinutes) { minutes = limits.maxMinutes; clamped = true; }

        const normalized = `${hours}h ${String(minutes).padStart(2, '0')}m`;

        if (clamped) {
            return _result(false, normalized,
                `${field}: max ${limits.maxHours}h ${limits.maxMinutes}m`);
        }

        return _result(true, normalized);
    }

    /**
     * Validate a boolean field.
     * @private
     */
    _validateBoolean(value, field) {
        if (typeof value === 'boolean') return _result(true, value);
        if (value === 'true' || value === 1) return _result(true, true);
        if (value === 'false' || value === 0) return _result(true, false);
        return _result(false, false, `${field}: must be true or false`);
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

    // ================================================================
    // ---- CONVENIENCE ACCESSORS ----
    // ================================================================

    /**
     * Get the max value for a number field.
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
