/**
 * Gen1Parser.js — Generation I Save File Parser
 *
 * Wraps the existing parser.js logic into a class that produces
 * CanonicalSaveFile objects. During Phase 1, this delegates to
 * the existing parser functions for full backward compatibility.
 */

import { detectAndParseSave, parsePk1 } from '../../engine/parser.js';
import { CanonicalSaveFile, CanonicalPokemon } from '../../core/CanonicalModel.js';

export class Gen1Parser {
    /**
     * Parse a save file from binary data.
     * Delegates to the existing parser and wraps the result in CanonicalSaveFile.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @returns {Promise<{ success: boolean, data?: CanonicalSaveFile, error?: string }>}
     */
    async parseSaveFile(uint8Array) {
        // Create a File-like object for the existing parser
        const file = new File([uint8Array], 'save.sav');
        const result = await detectAndParseSave(file);

        if (!result.success || !result.data) {
            return { success: false, error: result.error };
        }

        // Wrap legacy ParsedSave in CanonicalSaveFile
        const canonicalSave = CanonicalSaveFile.fromLegacy(result.data);
        return { success: true, data: canonicalSave };
    }

    /**
     * Parse a single .pk1 Pokemon file.
     * @param {Uint8Array} uint8Array - Raw binary .pk1 data
     * @returns {CanonicalPokemon|null}
     */
    parsePk1(uint8Array) {
        const legacyMon = parsePk1(uint8Array);
        if (!legacyMon) return null;
        return CanonicalPokemon.fromLegacy(legacyMon);
    }
}
