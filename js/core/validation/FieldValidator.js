/**
 * FieldValidator.js — Factory & Re-exports for Per-Generation Field Validation
 *
 * This module provides the factory function getFieldValidator(generationId)
 * which returns the appropriate generation-specific FieldValidator instance.
 *
 * Each generation has its own FieldValidator class in its generations folder:
 *   - Gen1FieldValidator: js/generations/gen1/Gen1FieldValidator.js
 *   - Gen2FieldValidator: js/generations/gen2/Gen2FieldValidator.js
 *
 * This follows the same pattern as Gen1Adapter/Gen2Adapter in js/generations/.
 *
 * The BaseFieldValidator abstract class lives in js/core/validation/BaseFieldValidator.js.
 *
 * Usage:
 *   const validator = getFieldValidator(1);
 *   const result = validator.validateField('trainer', 'name', 'ASH');
 *   // result: { valid: true, value: 'ASH', error: null }
 *
 *   const result2 = validator.validateField('pokemon', 'level', 150);
 *   // result2: { valid: false, value: 100, error: 'Level must be 1-100' }
 */

import { BaseFieldValidator } from './BaseFieldValidator.js';
import { Gen1FieldValidator } from '../../generations/gen1/Gen1FieldValidator.js';
import { Gen2FieldValidator } from '../../generations/gen2/Gen2FieldValidator.js';

// Re-export BaseFieldValidator for subclasses (e.g., Gen3FieldValidator)
export { BaseFieldValidator };

// ================================================================
// ---- GENERATION VALIDATOR REGISTRY ----
// ================================================================

/** @type {Map<number, typeof BaseFieldValidator>} */
const _validatorClasses = new Map([
    [1, Gen1FieldValidator],
    [2, Gen2FieldValidator],
]);

/** @type {Map<number, BaseFieldValidator>} — Cached instances */
const _instances = new Map();

/**
 * Register a new generation's FieldValidator class.
 * Use this when adding a new generation (Gen3, Gen4, etc.)
 * @param {typeof BaseFieldValidator} ValidatorClass
 */
export function registerFieldValidator(ValidatorClass) {
    const tempInstance = new ValidatorClass();
    _validatorClasses.set(tempInstance.generationId, ValidatorClass);
    // Clear cached instance so the new class is used
    _instances.delete(tempInstance.generationId);
}

/**
 * Get a FieldValidator instance for a specific generation.
 * @param {number} generationId - 1, 2, etc.
 * @returns {BaseFieldValidator}
 */
export function getFieldValidator(generationId) {
    if (_instances.has(generationId)) {
        return _instances.get(generationId);
    }

    const ValidatorClass = _validatorClasses.get(generationId);
    if (!ValidatorClass) {
        console.warn(`[FieldValidator] No validator registered for generation ${generationId}, falling back to Gen1`);
        const FallbackClass = _validatorClasses.get(1);
        const instance = new FallbackClass();
        _instances.set(generationId, instance);
        return instance;
    }

    const instance = new ValidatorClass();
    _instances.set(generationId, instance);
    return instance;
}

/**
 * Convenience: validate a single field.
 * @param {number} generationId
 * @param {string} category
 * @param {string} field
 * @param {*} value
 * @returns {{ valid: boolean, value: *, error: string|null }}
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
