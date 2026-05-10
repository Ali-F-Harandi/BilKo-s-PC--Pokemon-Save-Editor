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
import { GEN2_INTERNAL_TO_DEX } from './constants.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_POKEMON_TYPES, GEN2_GENDER_RATIOS } from './data/pokemonData.js';
import { GEN2_MOVE_NAMES, GEN2_MOVE_DATA } from './data/moveData.js';
import { GEN2_ITEM_NAMES, GEN2_HELD_ITEM_IDS } from './data/itemData.js';
import { GEN2_TYPE_NAMES, GEN2_TYPE_COLORS, GEN2_TYPE_CHART } from './data/typeChart.js';
import { GEN2_BASE_STATS } from './data/baseStats.js';
import { decodeGen2Text, encodeGen2Text } from './textCodec.js';
import { getAsciiString } from '../../engine/byteHelpers.js';
import { GEN2_OFFSETS, GEN2_SHINY_ATTACK_DVS, GEN2_SHINY_STAT_DV } from './constants.js';
import { REGION_BADGES } from '../../data/gameData.js';
import { getGrowthRate, getLevelFromExp, getExpAtLevel } from '../../data/experience.js';

export class Gen2Adapter extends BaseAdapter {
    constructor() {
        super(2, ['gold', 'silver', 'crystal'], 'Generation II');
        this.parser = new Gen2Parser();
        this.writer = new Gen2Writer();
        this.validator = new Gen2Validator();
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
        // Check Game Boy header for title
        const titleOffset = GEN2_OFFSETS.GAME_TITLE_OFFSET;
        if (uint8Array.length > titleOffset + 16) {
            const title = getAsciiString(uint8Array, titleOffset, 16).toUpperCase();
            if (title.includes('CRYSTAL')) return 'Crystal';
            if (title.includes('GOLD')) return 'Gold';
            if (title.includes('SILVER')) return 'Silver';
        }

        // Fallback: check filename
        if (filename) {
            const lower = filename.toLowerCase();
            if (lower.includes('crystal')) return 'Crystal';
            if (lower.includes('gold')) return 'Gold';
            if (lower.includes('silver')) return 'Silver';
        }

        return 'Gold';
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
        return typeIds.map(id => GEN2_TYPE_NAMES[id] || 'Normal').filter(t => t && t !== '');
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
        const supported = ['heldItems', 'shiny', 'gender', 'friendship', 'pokerus', 'eggSteps'];
        return supported.includes(feature);
    }
}
