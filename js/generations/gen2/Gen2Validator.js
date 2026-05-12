/**
 * Gen2Validator.js — Generation II Save File Validator
 *
 * Validates Gen 2 (Gold/Silver/Crystal) save files for integrity.
 * Uses PKHeX-verified checksum offsets and PokeList validation.
 *
 * CRITICAL FIX: Game detection now uses PokeList validation instead of ROM header.
 * Gold/Silver and Crystal have DIFFERENT checksum offsets and ranges.
 */

import { GS_INT_OFFSETS, C_INT_OFFSETS, GEN2_LIMITS, GS_BACKUP_REGIONS } from './constants.js';

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
        let view = uint8Array;
        if (uint8Array.length === 32768 + 16) {
            view = uint8Array.slice(16);
        }
        if (view.length !== 32768) {
            errors.push(`Invalid file size: ${uint8Array.length} bytes. Expected 32768 bytes for Gen 2.`);
            return { valid: false, errors, warnings };
        }

        // Validate checksum — try all known configurations
        const checksumResult = this._validateChecksums(view);
        if (!checksumResult.valid) {
            errors.push('Invalid checksums. This does not appear to be a valid Gen 2 save file.');
        }
        if (checksumResult.checksum2Valid === false) {
            warnings.push('Invalid checksum 2 (box/backup data). PC box data may be corrupted.');
        }

        // Try to determine game version for offset-specific checks
        const gameVersion = checksumResult.detectedGame;
        const off = gameVersion === 'Crystal' ? C_INT_OFFSETS : GS_INT_OFFSETS;

        // Party count sanity check
        if (view.length > off.PARTY_COUNT) {
            const partyCount = view[off.PARTY_COUNT];
            if (partyCount > GEN2_LIMITS.MAX_PARTY) {
                errors.push(`Invalid party count: ${partyCount}. Maximum is ${GEN2_LIMITS.MAX_PARTY}.`);
            }
        }

        // Current box ID sanity check
        if (view.length > off.CURRENT_BOX) {
            const boxId = view[off.CURRENT_BOX] & 0x7F;
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

    validatePokemon(canonicalPokemon) {
        const errors = [];

        if (canonicalPokemon.dexId === 0 && canonicalPokemon.speciesId === 0) {
            return { valid: true, errors: [] };
        }

        if (canonicalPokemon.isEgg) {
            return { valid: true, errors: [] };
        }

        if (canonicalPokemon.level < 1 || canonicalPokemon.level > GEN2_LIMITS.MAX_LEVEL) {
            errors.push(`Invalid level: ${canonicalPokemon.level}. Must be 1-${GEN2_LIMITS.MAX_LEVEL}.`);
        }

        if (canonicalPokemon.dexId < 0 || canonicalPokemon.dexId > 251) {
            errors.push(`Invalid Dex ID: ${canonicalPokemon.dexId}. Must be 0-251 for Gen 2.`);
        }

        const ivs = canonicalPokemon.ivs || {};
        for (const [key, value] of Object.entries(ivs)) {
            if (value < 0 || value > GEN2_LIMITS.MAX_DVS) {
                errors.push(`Invalid ${key} DV: ${value}. Must be 0-${GEN2_LIMITS.MAX_DVS}.`);
            }
        }

        const friendship = canonicalPokemon.genExtension?.friendship;
        if (friendship !== undefined && (friendship < 0 || friendship > GEN2_LIMITS.MAX_FRIENDSHIP)) {
            errors.push(`Invalid friendship: ${friendship}. Must be 0-${GEN2_LIMITS.MAX_FRIENDSHIP}.`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate Gen 2 checksums by trying all known configurations.
     * @private
     */
    _validateChecksums(view) {
        // Try GS International first
        const gsCk1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
        if (gsCk1) {
            // Also check PokeList to confirm it's GS (party at 0x288A)
            const isGSList = this._isPokeListValid(view, 0x288A, 6);
            if (isGSList) {
                const gsCk2 = this._validateGSChecksum2(view);
                return { valid: true, checksum2Valid: gsCk2, detectedGame: 'GoldSilver' };
            }
        }

        // Try Crystal International
        const cryCk1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
        if (cryCk1) {
            const isCList = this._isPokeListValid(view, 0x2865, 6);
            if (isCList) {
                const cryCk2 = this._validateChecksumRange(view, 0x1209, 0x1D82, 0x1F0D);
                return { valid: true, checksum2Valid: cryCk2, detectedGame: 'Crystal' };
            }
        }

        // Fallback: try checksums without PokeList validation
        if (gsCk1) {
            return { valid: true, checksum2Valid: null, detectedGame: 'GoldSilver' };
        }
        if (cryCk1) {
            return { valid: true, checksum2Valid: null, detectedGame: 'Crystal' };
        }

        // Try Japanese GS
        const jpnCk1 = this._validateChecksumRange(view, 0x2009, 0x2C8B, 0x2D0D);
        if (jpnCk1) {
            return { valid: true, checksum2Valid: null, detectedGame: 'GoldSilverJPN' };
        }

        return { valid: false, checksum2Valid: false, detectedGame: 'Unknown' };
    }

    /**
     * Check if a PokeList is valid at the given offset.
     * @private
     */
    _isPokeListValid(view, offset, maxCount) {
        if (offset >= view.length) return false;
        const count = view[offset];
        if (count > maxCount) return false;
        const terminatorPos = offset + 1 + count;
        if (terminatorPos >= view.length) return false;
        return view[terminatorPos] === 0xFF;
    }

    _validateChecksumRange(view, start, end, checksumOffset) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            sum += view[i];
        }
        const calculated = (sum & 0xFFFF) >>> 0;
        if (checksumOffset + 1 >= view.length) return false;
        const storedLow = view[checksumOffset];
        const storedHigh = view[checksumOffset + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0;
        return calculated === stored;
    }

    _validateGSChecksum2(view) {
        let sum = 0;
        for (const region of GS_BACKUP_REGIONS) {
            for (let i = 0; i < region.len; i++) {
                if (region.dst + i < view.length) {
                    sum += view[region.dst + i];
                }
            }
        }
        const calculated = (sum & 0xFFFF) >>> 0;
        const storeOffset = 0x7E6D;
        if (storeOffset + 1 >= view.length) return null;
        const storedLow = view[storeOffset];
        const storedHigh = view[storeOffset + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0;
        return calculated === stored;
    }
}
