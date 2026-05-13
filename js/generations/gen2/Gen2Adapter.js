/**
 * Gen2Adapter.js — Generation II Adapter (Gold/Silver/Crystal)
 *
 * Full implementation of the BaseAdapter interface for Pokemon Gold, Silver, and Crystal.
 * This adapter handles Gen 2-specific features:
 * - Held Items
 * - Shiny Pokemon (determined by DVs)
 * - Gender (determined by DVs)
 * - Friendship/Happiness
 * - Pokerus
 * - Special stat split into SpAtk/SpDef
 * - 14 PC boxes with 20 Pokemon each
 * - 251 Pokemon (151 original + 100 new)
 * - Steel and Dark types
 * - Real-Time Clock
 *
 * Phase 3: Full implementation replacing the stub.
 */

import { BaseAdapter } from '../../core/BaseAdapter.js';
import { CanonicalPokemon } from '../../core/CanonicalModel.js';
import { Gen2Parser } from './Gen2Parser.js';
import { Gen2Writer } from './Gen2Writer.js';
import { Gen2Validator } from './Gen2Validator.js';
import { Gen2Schema } from './Gen2Schema.js';
import { Gen2FieldValidator } from './Gen2FieldValidator.js';
import { GEN2_INTERNAL_TO_DEX } from './constants.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_POKEMON_TYPES, GEN2_GENDER_RATIOS } from './data/pokemonData.js';
import { GEN2_MOVE_NAMES, GEN2_MOVE_DATA } from './data/moveData.js';
import { GEN2_ITEM_NAMES, GEN2_HELD_ITEM_IDS } from './data/itemData.js';
import { GEN2_TYPE_NAMES, GEN2_TYPE_COLORS, GEN2_TYPE_CHART } from './data/typeChart.js';
import { GEN2_BASE_STATS } from './data/baseStats.js';
import { decodeGen2Text, encodeGen2Text } from './textCodec.js';
import { getAsciiString } from '../../engine/byteHelpers.js';
import { GEN2_OFFSETS, GEN2_SHINY_ATTACK_DVS, GEN2_SHINY_STAT_DV, GS_INT_OFFSETS, C_INT_OFFSETS } from './constants.js';
import { REGION_BADGES } from '../../data/gameData.js';
import { getGrowthRate, getLevelFromExp, getExpAtLevel } from '../../data/experience.js';

export class Gen2Adapter extends BaseAdapter {
    constructor() {
        super(2, ['gold', 'silver', 'crystal'], 'Generation II');
        this.parser = new Gen2Parser();
        this.writer = new Gen2Writer();
        this.validator = new Gen2Validator();
        this.fieldValidator = new Gen2FieldValidator();
        // Manual game version override — allows users to disambiguate
        // Gold from Silver, since they cannot be distinguished from save data alone.
        this._manualGameVersion = null;
    }

    /**
     * Set a manual game version override.
     * Use this when auto-detection cannot distinguish Gold from Silver.
     * @param {string|null} version - 'Gold', 'Silver', 'Crystal', or null to clear
     */
    setGameVersion(version) {
        const valid = ['Gold', 'Silver', 'Crystal', null];
        if (!valid.includes(version)) {
            console.warn(`[Gen2Adapter] Invalid game version: ${version}. Use 'Gold', 'Silver', 'Crystal', or null.`);
            return;
        }
        this._manualGameVersion = version;
    }

    /**
     * Get the current manual game version override.
     * @returns {string|null}
     */
    getGameVersion() {
        return this._manualGameVersion;
    }

    // ================================================================
    // ---- PARSING ----
    // ================================================================

    async parseSaveFile(uint8Array) {
        return this.parser.parseSaveFile(uint8Array);
    }

    async parsePokemon(uint8Array, context = 'party') {
        return this.parser.parsePokemon(uint8Array, context);
    }

    // ================================================================
    // ---- WRITING ----
    // ================================================================

    async writeSaveFile(canonicalSave) {
        return this.writer.writeSaveFile(canonicalSave);
    }

    async writePokemon(canonicalPokemon) {
        return this.writer.createPk2(canonicalPokemon);
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
        // Manual override takes priority — allows users to disambiguate
        // Gold from Silver, since they share identical save structure.
        if (this._manualGameVersion) {
            return this._manualGameVersion;
        }

        // Use PokeList validation (PKHeX method) — the ROM header at 0x134
        // is NOT reliable for .sav files since it's part of the ROM, not SRAM.
        
        // GS International: party at 0x288A, current box at 0x2D6C (20 per box)
        if (this._isPokeListValid(uint8Array, GS_INT_OFFSETS.PARTY_COUNT, 6)) {
            // Could be GS or Crystal — check Crystal offset too
            if (this._isPokeListValid(uint8Array, C_INT_OFFSETS.PARTY_COUNT, 6)) {
                // Both are valid — use checksum to distinguish
                // Crystal checksum 1 covers 0x2009-0x2B82, stored at 0x2D0D
                if (this._validateChecksum(uint8Array, 0x2009, 0x2B82, 0x2D0D)) {
                    return 'Crystal';
                }
            }
            // GS checksum 1 covers 0x2009-0x2D68, stored at 0x2D69
            if (this._validateChecksum(uint8Array, 0x2009, 0x2D68, 0x2D69)) {
                // Can't distinguish Gold vs Silver from save data — default to Gold
                // Users can override with setGameVersion('Silver')
                return 'Gold';
            }
        }
        
        // Crystal International: party at 0x2865
        if (this._isPokeListValid(uint8Array, C_INT_OFFSETS.PARTY_COUNT, 6)) {
            return 'Crystal';
        }
        
        // Fallback: check ROM header (unreliable but worth trying)
        const titleOffset = GEN2_OFFSETS.GAME_TITLE_OFFSET;
        if (uint8Array.length > titleOffset + 16) {
            const title = getAsciiString(uint8Array, titleOffset, 16).toUpperCase();
            if (title.includes('CRYSTAL')) return 'Crystal';
            if (title.includes('SILVER')) return 'Silver';
            if (title.includes('GOLD')) return 'Gold';
        }

        // Fallback: check filename
        if (filename) {
            const lower = filename.toLowerCase();
            if (lower.includes('crystal')) return 'Crystal';
            if (lower.includes('silver')) return 'Silver';
            if (lower.includes('gold')) return 'Gold';
        }

        // Default to Gold (can't distinguish from save data alone)
        return 'Gold';
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

    /**
     * Validate a checksum range.
     * @private
     */
    _validateChecksum(view, start, end, checksumOffset) {
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

    // ================================================================
    // ---- SCHEMA ----
    // ================================================================

    getSaveSchema() { return Gen2Schema.saveSchema; }
    getPokemonSchema() { return Gen2Schema.pokemonSchema; }
    getMoveSchema() { return Gen2Schema.moveSchema; }

    getTrainerSchema() {
        return {
            sections: [
                {
                    id: 'trainer',
                    label: 'Trainer Info',
                    fields: [
                        { key: 'name', label: 'Name', type: 'text', maxLength: 7 },
                        { key: 'id', label: 'Trainer ID', type: 'text', maxLength: 5 },
                        { key: 'money', label: 'Money', type: 'number', min: 0, max: 999999 },
                        { key: 'badges', label: 'Badges', type: 'number', min: 0, max: 16 },
                        { key: 'rivalName', label: 'Rival Name', type: 'text', maxLength: 7 },
                        { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
                    ]
                }
            ]
        };
    }

    // ================================================================
    // ---- DATA ACCESS ----
    // ================================================================

    getPokemonList() {
        return [...GEN2_POKEMON_NAMES];
    }

    getMoveList() {
        return [...GEN2_MOVE_NAMES];
    }

    getItemList() {
        return [...GEN2_ITEM_NAMES];
    }

    getTypeList() {
        return [...GEN2_TYPE_NAMES];
    }

    getAbilityList() {
        return []; // Gen 2 still has no abilities
    }

    getBaseStats(dexId) {
        const stats = GEN2_BASE_STATS[dexId];
        if (!stats) return null;
        return {
            hp: stats.hp,
            attack: stats.atk,
            defense: stats.def,
            speed: stats.spe,
            special: stats.spc,
            spAttack: stats.spc, // Gen 2: same base Special stat for both
            spDefense: stats.spc,
        };
    }

    getInternalToDexMap() {
        return GEN2_INTERNAL_TO_DEX;
    }

    // ================================================================
    // ---- BADGES ----
    // ================================================================

    getBadges() {
        return REGION_BADGES[2] || [
            // Johto
            { name: 'Zephyr', region: 'Johto' }, { name: 'Hive', region: 'Johto' },
            { name: 'Plain', region: 'Johto' }, { name: 'Fog', region: 'Johto' },
            { name: 'Storm', region: 'Johto' }, { name: 'Mineral', region: 'Johto' },
            { name: 'Glacier', region: 'Johto' }, { name: 'Rising', region: 'Johto' },
            // Kanto
            { name: 'Boulder', region: 'Kanto' }, { name: 'Cascade', region: 'Kanto' },
            { name: 'Thunder', region: 'Kanto' }, { name: 'Rainbow', region: 'Kanto' },
            { name: 'Soul', region: 'Kanto' }, { name: 'Marsh', region: 'Kanto' },
            { name: 'Volcano', region: 'Kanto' }, { name: 'Earth', region: 'Kanto' }
        ];
    }

    // ================================================================
    // ---- TYPE DATA ----
    // ================================================================

    getTypeColors() {
        return { ...GEN2_TYPE_COLORS };
    }

    getTypeChart() {
        return GEN2_TYPE_CHART;
    }

    getPokemonTypes(dexId) {
        const typeIds = GEN2_POKEMON_TYPES[dexId];
        if (!typeIds) return ['Normal'];
        const typeNames = typeIds.map(id => GEN2_TYPE_NAMES[id] || 'Normal').filter(t => t && t !== '');
        // For single-type Pokemon (type1 === type2), return only one type name
        // The editor/pokemonDetailView will show Type 2 as "—" for these
        if (typeNames.length === 2 && typeNames[0] === typeNames[1]) {
            return [typeNames[0]];
        }
        return typeNames;
    }

    // ================================================================
    // ---- MOVE DATA ----
    // ================================================================

    getMovePP(moveId) {
        const moveData = GEN2_MOVE_DATA[moveId];
        return moveData ? moveData.pp : 0;
    }

    // ================================================================
    // ---- EXPERIENCE ----
    // ================================================================

    getGrowthRate(dexId) {
        return getGrowthRate(dexId);
    }

    getLevelFromExp(exp, rate) {
        return getLevelFromExp(exp, rate);
    }

    getExpAtLevel(level, rate) {
        return getExpAtLevel(level, rate);
    }

    // ================================================================
    // ---- HELD ITEMS ----
    // ================================================================

    getHeldItemIds() {
        return GEN2_HELD_ITEM_IDS;
    }

    // ================================================================
    // ---- SHINY & GENDER ----
    // ================================================================

    /**
     * Determine if a Pokemon is shiny from its DVs.
     * @param {number} atkDv - Attack DV (0-15)
     * @param {number} defDv - Defense DV (0-15)
     * @param {number} spdDv - Speed DV (0-15)
     * @param {number} spcDv - Special DV (0-15)
     * @returns {boolean}
     */
    isShiny(atkDv, defDv, spdDv, spcDv) {
        return defDv === GEN2_SHINY_STAT_DV &&
               spdDv === GEN2_SHINY_STAT_DV &&
               spcDv === GEN2_SHINY_STAT_DV &&
               GEN2_SHINY_ATTACK_DVS.includes(atkDv);
    }

    /**
     * Determine a Pokemon's gender from its Dex ID and Attack DV.
     * @param {number} dexId - National Dex ID
     * @param {number} atkDv - Attack DV (0-15)
     * @returns {'Male'|'Female'|'Genderless'}
     */
    determineGender(dexId, atkDv) {
        const ratio = GEN2_GENDER_RATIOS[dexId];
        if (!ratio) return 'Genderless';

        switch (ratio) {
            case 'genderless': return 'Genderless';
            case 'all-male': return 'Male';
            case 'all-female': return 'Female';
            case 'male-87.5': return atkDv >= 1 ? 'Male' : 'Female';
            case 'male-75': return atkDv >= 4 ? 'Male' : 'Female';
            case 'male-50': return atkDv >= 7 ? 'Male' : 'Female';
            case 'female-75': return atkDv >= 12 ? 'Male' : 'Female';
            default: return 'Genderless';
        }
    }

    // ================================================================
    // ---- STAT CALCULATION ----
    // ================================================================

    calculateStat(base, iv, ev, level, isHp) {
        if (isHp) {
            return Math.floor(((2 * (base + iv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + level + 10);
        } else {
            return Math.floor(((2 * (base + iv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + 5);
        }
    }

    recalculateStats(pokemon) {
        const base = this.getBaseStats(pokemon.dexId);
        if (!base) return pokemon;

        const ivs = pokemon.ivs || {};
        const evs = pokemon.evs || {};
        const level = pokemon.level || 1;

        // Gen 2: SpAtk and SpDef use the same Special base stat and same Special DV/EV
        const spcIv = ivs.special !== undefined ? ivs.special : (ivs.spAttack || 0);
        const spcEv = evs.special !== undefined ? evs.special : (evs.spAttack || 0);

        const newStats = {
            hp: this.calculateStat(base.hp, ivs.hp || 0, evs.hp || 0, level, true),
            maxHp: this.calculateStat(base.hp, ivs.hp || 0, evs.hp || 0, level, true),
            attack: this.calculateStat(base.attack, ivs.attack || 0, evs.attack || 0, level, false),
            defense: this.calculateStat(base.defense, ivs.defense || 0, evs.defense || 0, level, false),
            speed: this.calculateStat(base.speed, ivs.speed || 0, evs.speed || 0, level, false),
            special: this.calculateStat(base.special, spcIv, spcEv, level, false),
            spAttack: this.calculateStat(base.spAttack, spcIv, spcEv, level, false),
            spDefense: this.calculateStat(base.spDefense, spcIv, spcEv, level, false),
        };

        // Create updated Pokemon with new stats
        const updated = new CanonicalPokemon({
            ...pokemon.toJSON(),
            stats: newStats
        });

        return updated;
    }

    // ================================================================
    // ---- TEXT ENCODING ----
    // ================================================================

    encodeText(str, maxLength, terminator = 0x50) {
        return encodeGen2Text(str, maxLength, terminator);
    }

    decodeText(uint8Array, offset, maxLength) {
        return decodeGen2Text(uint8Array, offset, maxLength);
    }

    // ================================================================
    // ---- CAPACITY & LIMITS ----
    // ================================================================

    getMaxPartySize() { return 6; }
    getBoxCapacity() { return 20; }
    getBoxCount() { return 14; } // Gen 2 has 14 boxes

    getValidFileSizes() {
        return [32768]; // Gen 2 is exactly 32KB
    }

    // ================================================================
    // ---- SUPPORTED FEATURES ----
    // ================================================================

    supportsFeature(feature) {
        const supported = ['heldItems', 'shiny', 'gender', 'friendship', 'pokerus', 'eggSteps', 'ppUps', 'legality', 'caughtData'];
        return supported.includes(feature);
    }

    // ================================================================
    // ---- VERSION METADATA (Scalability) ----
    // ================================================================

    getSupportedVersions() {
        return [
            { id: 'gold',    label: 'GOLD',    sublabel: 'Gold Version',    gradient: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)' },
            { id: 'silver',  label: 'SILVER',  sublabel: 'Silver Version',  gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' },
            { id: 'crystal', label: 'CRYSTAL', sublabel: 'Crystal Version', gradient: 'linear-gradient(135deg, #4FD0E7 0%, #2BA0B7 100%)' },
        ];
    }

    // ================================================================
    // ---- LEGALITY & DATA ACCESS (Phase 6) ----
    // ================================================================

    getMaxSpecies() { return 251; }
    getMaxMoveId() { return 251; }
    getMaxItemId() { return 255; }

    getMoveBasePP(moveId) {
        if (GEN2_MOVE_DATA && GEN2_MOVE_DATA[moveId]) {
            return GEN2_MOVE_DATA[moveId].pp || 0;
        }
        return 0;
    }

    /**
     * Get the .pk2 file bytes for a Pokemon.
     * @param {CanonicalPokemon} pokemon
     * @returns {Uint8Array}
     */
    exportPk2(pokemon) {
        return this.writer.createPk2(pokemon);
    }

    /**
     * Import a .pk2 file and return raw struct data for parsing.
     * @param {Uint8Array} data
     * @returns {Object|null}
     */
    importPk2(data) {
        return this.writer.parsePk2(data);
    }
}
