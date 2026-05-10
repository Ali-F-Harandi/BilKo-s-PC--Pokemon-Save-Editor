/**
 * Gen1Adapter.js — Generation I Adapter
 *
 * Implements the BaseAdapter interface for Pokemon Red, Blue, and Yellow.
 * This is the primary adapter that powers the current application.
 *
 * Architecture Bridge:
 * During Phase 1, this adapter wraps the existing engine/ modules
 * (parser.js, writer.js, statCalculator.js, etc.) and provides
 * a clean adapter interface. The existing modules remain untouched
 * for full backward compatibility.
 *
 * When future generations are added, each will have its own adapter
 * following the same interface, and the application code won't need
 * to know which generation it's dealing with.
 */

import { BaseAdapter } from '../../core/BaseAdapter.js';
import { CanonicalPokemon } from '../../core/CanonicalModel.js';
import { Gen1Parser } from './Gen1Parser.js';
import { Gen1Writer } from './Gen1Writer.js';
import { Gen1Validator } from './Gen1Validator.js';
import { Gen1Schema } from './Gen1Schema.js';
import { GEN1_OFFSETS, GEN1_INTERNAL_TO_DEX } from '../../data/offsets.js';
import { getPokemonName } from '../../data/pokemonNames.js';
import { getTypeName, getPokemonTypes, GEN1_TYPE_ID_MAP } from '../../data/pokemonTypes.js';
import { MOVES_LIST } from '../../data/moves.js';
import { getItemName } from '../../data/items.js';
import { GEN1_BASE_STATS } from '../../data/baseStats.js';
import { calculateGen1Stat, recalculateStats } from '../../engine/statCalculator.js';
import { decodeText, encodeText } from '../../engine/textDecoder.js';
import { getAsciiString } from '../../engine/byteHelpers.js';

export class Gen1Adapter extends BaseAdapter {
    constructor() {
        super(1, ['red', 'blue', 'yellow'], 'Generation I');
        this.parser = new Gen1Parser();
        this.writer = new Gen1Writer();
        this.validator = new Gen1Validator();
    }

    // ================================================================
    // ---- PARSING ----
    // ================================================================

    async parseSaveFile(uint8Array) {
        return this.parser.parseSaveFile(uint8Array);
    }

    async parsePokemon(uint8Array, context = 'party') {
        return this.parser.parsePk1(uint8Array);
    }

    // ================================================================
    // ---- WRITING ----
    // ================================================================

    async writeSaveFile(canonicalSave) {
        return this.writer.writeSaveFile(canonicalSave);
    }

    async writePokemon(canonicalPokemon) {
        // For Gen 1, single Pokemon export uses .pk1 format
        const legacyMon = canonicalPokemon.toLegacy ? canonicalPokemon.toLegacy() : canonicalPokemon;
        return this.writer.createPk1(legacyMon);
    }

    // ================================================================
    // ---- VALIDATION ----
    // ================================================================

    validateSaveFile(uint8Array) {
        return this.validator.validateSaveFile(uint8Array);
    }

    validatePokemon(canonicalPokemon) {
        return this.validator.validatePokemon(canonicalPokemon);
    }

    detectGameVersion(uint8Array, filename) {
        const potentialHeaderOffsets = [0x30, 0x134];
        for (const offset of potentialHeaderOffsets) {
            if (uint8Array.byteLength < offset + 16) continue;
            const title = getAsciiString(uint8Array, offset, 16).toUpperCase();
            if (title.startsWith("POKEMON")) {
                if (title.includes("RED")) return 'Red';
                if (title.includes("BLUE")) return 'Blue';
                if (title.includes("YELL")) return 'Yellow';
            }
        }
        const pikachuFriendship = uint8Array[GEN1_OFFSETS.PIKACHU_FRIENDSHIP];
        if (pikachuFriendship > 0) return 'Yellow';
        if (filename) {
            const lower = filename.toLowerCase();
            if (lower.includes('yellow')) return 'Yellow';
            if (lower.includes('red')) return 'Red';
            if (lower.includes('blue')) return 'Blue';
        }
        return 'Red';
    }

    // ================================================================
    // ---- SCHEMA ----
    // ================================================================

    getSaveSchema() { return Gen1Schema.saveSchema; }
    getPokemonSchema() { return Gen1Schema.pokemonSchema; }
    getMoveSchema() { return Gen1Schema.moveSchema; }

    // ================================================================
    // ---- DATA ACCESS ----
    // ================================================================

    getPokemonList() {
        const list = [];
        for (let i = 0; i <= 151; i++) {
            list.push(getPokemonName(i));
        }
        return list;
    }

    getMoveList() {
        return [...MOVES_LIST];
    }

    getItemList() {
        const list = [];
        for (let i = 0; i < 256; i++) {
            list.push(getItemName(i));
        }
        return list;
    }

    getTypeList() {
        const list = [];
        for (let i = 0; i < 256; i++) {
            const name = getTypeName(i);
            if (name && name !== `Type ${i}`) {
                list.push(name);
            } else {
                break; // No more valid types
            }
        }
        return list;
    }

    getAbilityList() {
        return []; // Gen 1 has no abilities
    }

    getBaseStats(dexId) {
        const stats = GEN1_BASE_STATS[dexId];
        if (!stats) return null;
        return {
            hp: stats.hp,
            attack: stats.atk,
            defense: stats.def,
            speed: stats.spe,
            special: stats.spc,
            spAttack: stats.spc, // Gen 1: Special = SpAtk = SpDef
            spDefense: stats.spc,
            catchRate: stats.catchRate
        };
    }

    getInternalToDexMap() {
        return GEN1_INTERNAL_TO_DEX;
    }

    // ================================================================
    // ---- TEXT ENCODING ----
    // ================================================================

    encodeText(str, maxLength, terminator = 0x50) {
        return encodeText(str, maxLength, terminator);
    }

    decodeText(uint8Array, offset, maxLength) {
        return decodeText(uint8Array, offset, maxLength);
    }

    // ================================================================
    // ---- STAT CALCULATION ----
    // ================================================================

    calculateStat(base, iv, ev, level, isHp) {
        return calculateGen1Stat(base, iv, ev, level, isHp);
    }

    recalculateStats(pokemon) {
        const legacyMon = pokemon.toLegacy ? pokemon.toLegacy() : pokemon;
        const base = this.getBaseStats(legacyMon.dexId);
        if (!base) return pokemon;

        const updatedLegacy = recalculateStats(legacyMon, {
            hp: base.hp,
            atk: base.attack,
            def: base.defense,
            spe: base.speed,
            spc: base.special
        }, 1);

        if (pokemon.toLegacy) {
            return CanonicalPokemon.fromLegacy(updatedLegacy);
        }
        return updatedLegacy;
    }

    // ================================================================
    // ---- CAPACITY & LIMITS ----
    // ================================================================

    getMaxPartySize() { return 6; }
    getBoxCapacity() { return 20; }
    getBoxCount() { return 12; }

    getValidFileSizes() {
        return [32768, 32768 + 16];
    }
}
