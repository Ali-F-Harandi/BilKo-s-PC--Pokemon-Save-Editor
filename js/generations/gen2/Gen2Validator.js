/**
 * Gen2Validator.js — Generation II Save File Validator
 *
 * Validates Gen 2 (Gold/Silver/Crystal) save files for integrity,
 * checksum correctness, and data structure validity.
 *
 * Gen 2 uses two checksums:
 * - Checksum 1: Covers main save data (0x2009-0x2D0C)
 * - Checksum 2: Covers box data banks (0x2D0E-0x7F6C)
 */

import { GEN2_OFFSETS, GEN2_LIMITS } from './constants.js';

export class Gen2Validator {
    /**
     * Validate a Gen 2 save file.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
     */
    validateSaveFile(uint8Array) {
        const errors = [];
        const warnings = [];

        // Check file size
        const size = uint8Array.length;
        if (size !== 32768) {
            errors.push(`Invalid file size: ${size} bytes. Expected 32768 bytes for Gen 2.`);
            return { valid: false, errors, warnings };
        }

        // Validate checksum 1
        const checksum1Valid = this._validateChecksum1(uint8Array);
        if (!checksum1Valid) {
            errors.push('Invalid checksum 1 (main save data). This does not appear to be a valid Gen 2 save file.');
        }

        // Validate checksum 2
        const checksum2Valid = this._validateChecksum2(uint8Array);
        if (!checksum2Valid) {
            // Checksum 2 failure is less severe — boxes might be corrupted
            warnings.push('Invalid checksum 2 (box data). PC box data may be corrupted.');
        }

        // Party count sanity check
        if (size > GEN2_OFFSETS.PARTY_COUNT) {
            const partyCount = uint8Array[GEN2_OFFSETS.PARTY_COUNT];
            if (partyCount > GEN2_LIMITS.MAX_PARTY) {
                errors.push(`Invalid party count: ${partyCount}. Maximum is ${GEN2_LIMITS.MAX_PARTY}.`);
            }
        }

        // Current box ID sanity check
        if (size > GEN2_OFFSETS.CURRENT_BOX) {
            const boxId = uint8Array[GEN2_OFFSETS.CURRENT_BOX] & 0x7F;
            if (boxId >= GEN2_LIMITS.BOX_COUNT) {
                warnings.push(`Unusual current box ID: ${boxId}. Valid range is 0-${GEN2_LIMITS.BOX_COUNT - 1}.`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate a Gen 2 Pokemon's data integrity.
     * @param {Object} canonicalPokemon - CanonicalPokemon or legacy PokemonStats
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validatePokemon(canonicalPokemon) {
        const errors = [];

        if (canonicalPokemon.dexId === 0 && canonicalPokemon.speciesId === 0) {
            // Empty slot or egg is valid
            return { valid: true, errors: [] };
        }

        if (canonicalPokemon.isEgg) {
            // Eggs have limited validation
            return { valid: true, errors: [] };
        }

        if (canonicalPokemon.level < 1 || canonicalPokemon.level > GEN2_LIMITS.MAX_LEVEL) {
            errors.push(`Invalid level: ${canonicalPokemon.level}. Must be 1-${GEN2_LIMITS.MAX_LEVEL}.`);
        }

        if (canonicalPokemon.dexId < 0 || canonicalPokemon.dexId > 251) {
            errors.push(`Invalid Dex ID: ${canonicalPokemon.dexId}. Must be 0-251 for Gen 2.`);
        }

        // Validate DVs
        const ivs = canonicalPokemon.ivs || {};
        for (const [key, value] of Object.entries(ivs)) {
            if (value < 0 || value > GEN2_LIMITS.MAX_DVS) {
                errors.push(`Invalid ${key} DV: ${value}. Must be 0-${GEN2_LIMITS.MAX_DVS}.`);
            }
        }

        // Validate friendship
        const friendship = canonicalPokemon.genExtension?.friendship;
        if (friendship !== undefined && (friendship < 0 || friendship > GEN2_LIMITS.MAX_FRIENDSHIP)) {
            errors.push(`Invalid friendship: ${friendship}. Must be 0-${GEN2_LIMITS.MAX_FRIENDSHIP}.`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate checksum 1 (main save data).
     * @param {Uint8Array} view
     * @returns {boolean}
     * @private
     */
    _validateChecksum1(view) {
        let sum = 0;
        for (let i = GEN2_OFFSETS.CHECKSUM_1_START; i <= GEN2_OFFSETS.CHECKSUM_1_END; i++) {
            sum += view[i];
        }
        const complement = ((~sum) & 0xFFFF) >>> 0;
        const storedLow = view[GEN2_OFFSETS.CHECKSUM_1];
        const storedHigh = view[GEN2_OFFSETS.CHECKSUM_1 + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0;
        return complement === stored;
    }

    /**
     * Validate checksum 2 (box data).
     * @param {Uint8Array} view
     * @returns {boolean}
     * @private
     */
    _validateChecksum2(view) {
        let sum = 0;
        for (let i = GEN2_OFFSETS.CHECKSUM_2_START; i <= GEN2_OFFSETS.CHECKSUM_2_END; i++) {
            sum += view[i];
        }
        const complement = ((~sum) & 0xFFFF) >>> 0;
        const storedLow = view[GEN2_OFFSETS.CHECKSUM_2];
        const storedHigh = view[GEN2_OFFSETS.CHECKSUM_2 + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0;
        return complement === stored;
    }
}
