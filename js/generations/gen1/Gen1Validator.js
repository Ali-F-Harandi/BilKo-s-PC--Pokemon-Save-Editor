/**
 * Gen1Validator.js — Generation I Save File Validator
 *
 * Validates Gen 1 save files for integrity, checksum correctness,
 * and data structure validity. Wraps the existing parser's validation
 * logic into a clean adapter interface.
 */

import { GEN1_OFFSETS } from '../../data/offsets.js';

export class Gen1Validator {
    /**
     * Validate a Gen 1 save file.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
     */
    validateSaveFile(uint8Array) {
        const errors = [];
        const warnings = [];

        // Check file size
        const size = uint8Array.length;
        if (size !== 32768 && size !== (32768 + 16)) {
            errors.push(`Invalid file size: ${size} bytes. Expected 32768 or 32784 bytes.`);
            return { valid: false, errors, warnings };
        }

        // Validate checksum
        const checksumValid = this._validateChecksum(uint8Array);
        if (!checksumValid) {
            errors.push('Invalid checksum. This does not appear to be a valid Gen 1 save file.');
        }

        // Check party count sanity
        if (uint8Array.length > GEN1_OFFSETS.PARTY_DATA) {
            const partyCount = uint8Array[GEN1_OFFSETS.PARTY_DATA];
            if (partyCount > 6) {
                errors.push(`Invalid party count: ${partyCount}. Maximum is 6.`);
            }
        }

        // Check current box ID sanity
        if (uint8Array.length > GEN1_OFFSETS.CURRENT_BOX_ID) {
            const boxId = uint8Array[GEN1_OFFSETS.CURRENT_BOX_ID] & 0x7F;
            if (boxId > 11) {
                warnings.push(`Unusual current box ID: ${boxId}. Valid range is 0-11.`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate a Gen 1 Pokemon's data integrity.
     * @param {Object} canonicalPokemon - CanonicalPokemon or legacy PokemonStats
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validatePokemon(canonicalPokemon) {
        const errors = [];

        if (canonicalPokemon.dexId === 0 && canonicalPokemon.speciesId === 0) {
            // Empty slot is valid
            return { valid: true, errors: [] };
        }

        if (canonicalPokemon.level < 1 || canonicalPokemon.level > 100) {
            errors.push(`Invalid level: ${canonicalPokemon.level}. Must be 1-100.`);
        }

        if (canonicalPokemon.dexId < 0 || canonicalPokemon.dexId > 151) {
            errors.push(`Invalid Dex ID: ${canonicalPokemon.dexId}. Must be 0-151 for Gen 1.`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate the Gen 1 checksum.
     * @param {Uint8Array} view
     * @returns {boolean}
     * @private
     */
    _validateChecksum(view) {
        let sum = 0;
        for (let i = GEN1_OFFSETS.PLAYER_NAME; i <= 0x3522; i++) {
            sum += view[i];
        }
        const calculated = (~sum) & 0xFF;
        const actual = view[GEN1_OFFSETS.CHECKSUM];
        return calculated === actual;
    }
}
