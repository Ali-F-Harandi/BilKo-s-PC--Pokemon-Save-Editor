/**
 * Gen1Writer.js — Generation I Save File Writer
 *
 * Wraps the existing writer.js logic into a class that accepts
 * CanonicalSaveFile objects. During Phase 1, this converts
 * CanonicalSaveFile back to legacy format and delegates to the
 * existing writer for full backward compatibility.
 */

import { writeGen1Save, createPk1Binary } from '../../engine/writer.js';
import { CanonicalSaveFile } from '../../core/CanonicalModel.js';

export class Gen1Writer {
    /**
     * Write a complete save file from CanonicalSaveFile data.
     * @param {CanonicalSaveFile} canonicalSave - Canonical save data
     * @returns {Uint8Array}
     */
    writeSaveFile(canonicalSave) {
        // Convert to legacy format for the existing writer
        const legacySave = canonicalSave.toLegacy();
        return writeGen1Save(legacySave);
    }

    /**
     * Create a .pk1 binary from a legacy PokemonStats object.
     * @param {Object} mon - Legacy PokemonStats object
     * @returns {Uint8Array}
     */
    createPk1(mon) {
        return createPk1Binary(mon);
    }
}
