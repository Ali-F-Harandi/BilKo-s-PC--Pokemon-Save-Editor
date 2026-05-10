/**
 * Gen2Validator.js — Generation II Save File Validator
 *
 * Validates Gen 2 (Gold/Silver/Crystal) save files for integrity,
 * checksum correctness, and data structure validity.
 *
 * Gen 2 uses two checksums, both as plain 16-bit sums (NOT complement).
 * Gold/Silver and Crystal have DIFFERENT checksum offsets and ranges:
 *
 * International Gold/Silver:
 *   Checksum 1: sum of 0x2009-0x2D68, stored at 0x2D69 (little-endian)
 *   Checksum 2: sum of 0x2D6E-0x7E6C, stored at 0x7E6D (little-endian)
 *
 * International Crystal:
 *   Checksum 1: sum of 0x2009-0x2B82, stored at 0x2D0D (little-endian)
 *   Checksum 2: sum of 0x1209-0x1D82, stored at 0x1F0D (little-endian)
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

        // Check file size (32768 for standard, 32784 for .srm with 16-byte header)
        const size = uint8Array.length;
        let view = uint8Array;
        if (size === 32768 + 16) {
            // Strip 16-byte header from .srm files
            view = uint8Array.slice(16);
        }
        if (view.length !== 32768) {
            errors.push(`Invalid file size: ${size} bytes. Expected 32768 bytes for Gen 2.`);
            return { valid: false, errors, warnings };
        }

        // Validate checksum — try all known Gen 2 configurations
        const checksumResult = this._validateChecksums(view);
        if (!checksumResult.valid) {
            errors.push('Invalid checksums. This does not appear to be a valid Gen 2 save file.');
        }
        if (checksumResult.checksum2Valid === false) {
            warnings.push('Invalid checksum 2 (box data). PC box data may be corrupted.');
        }

        // Party count sanity check
        if (view.length > GEN2_OFFSETS.PARTY_COUNT) {
            const partyCount = view[GEN2_OFFSETS.PARTY_COUNT];
            if (partyCount > GEN2_LIMITS.MAX_PARTY) {
                errors.push(`Invalid party count: ${partyCount}. Maximum is ${GEN2_LIMITS.MAX_PARTY}.`);
            }
        }

        // Current box ID sanity check
        if (view.length > GEN2_OFFSETS.CURRENT_BOX) {
            const boxId = view[GEN2_OFFSETS.CURRENT_BOX] & 0x7F;
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
     * Validate Gen 2 checksums by trying all known configurations.
     * Uses plain 16-bit sum (NOT complement), stored little-endian.
     * @param {Uint8Array} view
     * @returns {{ valid: boolean, checksum2Valid: boolean|null, detectedGame: string }}
     * @private
     */
    _validateChecksums(view) {
        // International Gold/Silver: checksum 1 at 0x2D69, range 0x2009-0x2D68
        //                           checksum 2 at 0x7E6D, range 0x2D6E-0x7E6C
        const gsCk1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
        if (gsCk1) {
            const gsCk2 = this._validateChecksumRange(view, 0x2D6E, 0x7E6C, 0x7E6D);
            return { valid: true, checksum2Valid: gsCk2, detectedGame: 'GoldSilver' };
        }

        // International Crystal: checksum 1 at 0x2D0D, range 0x2009-0x2B82
        //                       checksum 2 at 0x1F0D, range 0x1209-0x1D82
        const cryCk1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
        if (cryCk1) {
            const cryCk2 = this._validateChecksumRange(view, 0x1209, 0x1D82, 0x1F0D);
            return { valid: true, checksum2Valid: cryCk2, detectedGame: 'Crystal' };
        }

        // Japanese Gold/Silver: checksum 1 at 0x2D0D, range 0x2009-0x2C8B
        const jpnCk1 = this._validateChecksumRange(view, 0x2009, 0x2C8B, 0x2D0D);
        if (jpnCk1) {
            return { valid: true, checksum2Valid: null, detectedGame: 'GoldSilverJPN' };
        }

        return { valid: false, checksum2Valid: false, detectedGame: 'Unknown' };
    }

    /**
     * Validate a checksum range using plain 16-bit sum (little-endian storage).
     * @param {Uint8Array} view
     * @param {number} start - Start offset (inclusive)
     * @param {number} end - End offset (inclusive)
     * @param {number} checksumOffset - Where the 2-byte checksum is stored
     * @returns {boolean}
     * @private
     */
    _validateChecksumRange(view, start, end, checksumOffset) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            sum += view[i];
        }
        const calculated = (sum & 0xFFFF) >>> 0; // Plain 16-bit sum, NOT complement
        const storedLow = view[checksumOffset];
        const storedHigh = view[checksumOffset + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0; // Little-endian
        return calculated === stored;
    }
}
