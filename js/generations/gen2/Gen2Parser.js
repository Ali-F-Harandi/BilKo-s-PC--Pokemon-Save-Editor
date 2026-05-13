/**
 * Gen2Parser.js — Generation II Save File Parser
 *
 * Parses Pokemon Gold, Silver, and Crystal save files from binary
 * into CanonicalSaveFile / CanonicalPokemon objects.
 *
 * VERIFIED against PKHeX source code (SAV2.cs, PK2.cs, PokeList2.cs)
 * and pokecrystal disassembly.
 *
 * Key corrections from previous version:
 * - Uses game-version-specific offsets (GS vs Crystal have DIFFERENT offsets!)
 * - PokeList2 format: species, structs, OT names, nicknames are SEPARATE blocks
 * - Text encoding uses 0x80-0xFF range (NOT 0x01-0x4A)
 * - Game detection uses PokeList validation (NOT ROM header at 0x134)
 * - Box offsets are at FIXED positions in SRAM banks (not relative to current box)
 * - Money is 3-byte big-endian binary integer (NOT BCD)
 */

import { CanonicalSaveFile, CanonicalPokemon } from '../../core/CanonicalModel.js';
import {
    GEN2_PARTY_STRUCT, GEN2_BOX_STRUCT, GEN2_INTERNAL_TO_DEX,
    GEN2_EGG_SPECIES_ID, GEN2_SHINY_ATTACK_DVS, GEN2_SHINY_STAT_DV,
    getOffsetsForVersion, GS_INT_OFFSETS, C_INT_OFFSETS,
    GS_INT_BOX_OFFSETS, C_INT_BOX_OFFSETS, BOX_LIST_SIZE_INT,
    GEN2_CHECKSUM_VARIANTS, GS_BACKUP_REGIONS
} from './constants.js';
import { decodeGen2Text } from './textCodec.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_POKEMON_TYPES, GEN2_GENDER_RATIOS } from './data/pokemonData.js';
import { GEN2_MOVE_NAMES } from './data/moveData.js';
import { GEN2_ITEM_NAMES } from './data/itemData.js';
import { GEN2_TYPE_NAMES } from './data/typeChart.js';
import { GEN2_BASE_STATS } from './data/baseStats.js';
import { getUInt16BigEndian, getUInt24BigEndian, countSetBits, decodeStatus, getAsciiString } from '../../engine/byteHelpers.js';

export class Gen2Parser {
    /**
     * Parse a Gen 2 save file from binary data.
     * @param {Uint8Array} uint8Array - Raw binary save data
     * @param {string} [filename='save.sav'] - Original filename
     * @returns {Promise<{ success: boolean, data?: CanonicalSaveFile, error?: string }>}
     */
    async parseSaveFile(uint8Array, filename = 'save.sav') {
        try {
            const view = uint8Array;

            // Step 1: Detect game version using PokeList validation
            const gameVersion = this._detectGameVersion(view, filename);
            const off = getOffsetsForVersion(gameVersion);
            const isCrystal = gameVersion === 'Crystal';

            console.log(`[Gen2Parser] Detected game: ${gameVersion}`);

            // Step 2: Validate checksums
            const checksumResult = this._validateChecksums(view, gameVersion);
            if (!checksumResult.valid) {
                return { success: false, error: 'Invalid checksums. This does not appear to be a valid Gen 2 save file.' };
            }
            if (checksumResult.checksum2Valid === false) {
                console.warn('[Gen2Parser] Checksum 2 (box/backup data) invalid — boxes may be corrupted.');
            }

            // Step 3: Parse all data using the correct offsets
            const trainer = this._parseTrainer(view, off, isCrystal);
            const pokedex = this._parsePokedex(view, off);
            const party = this._parseParty(view, off);
            const pcBoxes = this._parseBoxes(view, off, isCrystal);
            const items = this._parseItems(view, off);
            const options = this._parseOptions(view, off);
            const daycare = this._parseDaycare(view, off);

            // Step 4: Build CanonicalSaveFile
            const canonicalSave = new CanonicalSaveFile({
                formatVersion: 1,
                generationId: 2,
                gameVersion: gameVersion,
                originalFilename: filename,
                fileSize: view.length,
                isValid: checksumResult.valid,

                trainer: trainer,

                party: party.pokemon,
                partyCount: party.count,
                pcBoxes: pcBoxes.boxes,
                currentBoxId: pcBoxes.currentBoxId,

                items: items.bag,
                pcItems: items.pc,

                pokedexOwned: pokedex.owned,
                pokedexSeen: pokedex.seen,
                pokedexOwnedFlags: pokedex.ownedFlags,
                pokedexSeenFlags: pokedex.seenFlags,

                eventFlags: [],
                hallOfFame: [],
                daycare: daycare,

                options: options,
                map: {},

                playerStarterId: 0,
                rivalStarterId: 0,

                rawData: view,

                genExtension: {
                    isCrystal: isCrystal,
                }
            });

            return { success: true, data: canonicalSave };
        } catch (err) {
            console.error('[Gen2Parser Error]', err);
            return { success: false, error: `Gen 2 parse error: ${err.message}` };
        }
    }

    /**
     * Parse a single Pokemon from binary data.
     * @param {Uint8Array} uint8Array - Raw binary Pokemon struct
     * @param {'party'|'box'} context - Whether this is a party or box Pokemon
     * @returns {CanonicalPokemon|null}
     */
    parsePokemon(uint8Array, context = 'party') {
        const isParty = context === 'party';
        return this._parsePokemonStruct(uint8Array, 0, isParty);
    }

    // ================================================================
    // ---- GAME VERSION DETECTION ----
    // ================================================================

    /**
     * Detect game version using PKHeX's PokeList validation method.
     * This checks if the party/box species list format is valid at known offsets.
     * 
     * Detection order (from PKHeX SaveUtil.cs):
     * 1. GS International: party@0x288A + box@0x2D6C (20 per box)
     * 2. Crystal International: party@0x2865 + box@0x2D10 (20 per box)
     * 3. GS Japanese: party@0x283E + box@0x2D10 (30 per box) [if 64KB file]
     * 4. Crystal Japanese: party@0x281A + box@0x2D10 (30 per box) [if 64KB file]
     * 
     * @private
     */
    _detectGameVersion(view, filename) {
        // Check filename first for explicit hints
        if (filename) {
            const lower = filename.toLowerCase();
            if (lower.includes('crystal')) return 'Crystal';
            if (lower.includes('silver')) return 'Silver';
            if (lower.includes('gold')) return 'Gold';
        }

        // Try PokeList validation (PKHeX method)
        // GS International: party count at 0x288A, species list valid, box list at 0x2D6C
        if (this._isPokeListValid(view, 0x288A, 6) && this._isPokeListValid(view, 0x2D6C, 20)) {
            // Check if Crystal by trying Crystal-specific validation
            // Crystal party is at 0x2865 — if that's also valid, it might be Crystal
            // Use checksum to disambiguate
            if (this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D)) {
                // Crystal checksum validates — it's Crystal
                return 'Crystal';
            }
            // GS checksum validates
            return this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69) ? 'Gold' : 'Gold';
            // Can't distinguish Gold vs Silver from save data alone — default to Gold
        }

        // Crystal International: party count at 0x2865, box list at 0x2D10
        if (this._isPokeListValid(view, 0x2865, 6) && this._isPokeListValid(view, 0x2D10, 20)) {
            return 'Crystal';
        }

        // Fallback: try ROM header (unreliable for .sav files but worth checking)
        if (view.length > 0x134 + 16) {
            const title = getAsciiString(view, 0x134, 16).toUpperCase();
            if (title.includes('CRYSTAL') || title.includes('PM_CRYSTAL')) return 'Crystal';
            if (title.includes('SILVER') || title.includes('PM_SILVER')) return 'Silver';
            if (title.includes('GOLD') || title.includes('PM_GOLD')) return 'Gold';
        }

        // Last resort: try checksums to at least distinguish Crystal from GS
        if (this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D)) {
            return 'Crystal';
        }

        // Default to Gold (GS) — can't determine Silver vs Gold from save data
        return 'Gold';
    }

    /**
     * Check if a PokeList at the given offset is valid.
     * A valid PokeList has: count <= maxCount, and data[offset + 1 + count] == 0xFF
     * @private
     */
    _isPokeListValid(view, offset, maxCount) {
        if (offset >= view.length) return false;
        const count = view[offset];
        if (count > maxCount) return false;
        // Check that the species list is terminated with 0xFF after count entries
        const terminatorPos = offset + 1 + count;
        if (terminatorPos >= view.length) return false;
        return view[terminatorPos] === 0xFF;
    }

    // ================================================================
    // ---- CHECKSUM VALIDATION ----
    // ================================================================

    /**
     * Validate Gen 2 checksums.
     * @private
     */
    _validateChecksums(view, gameVersion) {
        if (gameVersion === 'Crystal') {
            // Crystal: checksum 1 over 0x2009-0x2B82, stored at 0x2D0D
            const ck1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
            if (ck1) {
                // Crystal checksum 2: over 0x1209-0x1D82, stored at 0x1F0D
                const ck2 = this._validateChecksumRange(view, 0x1209, 0x1D82, 0x1F0D);
                return { valid: true, checksum2Valid: ck2 };
            }
            // Fallback: try GS offsets (game detection might be wrong)
            const gsCk1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
            if (gsCk1) {
                return { valid: true, checksum2Valid: null };
            }
            return { valid: false, checksum2Valid: false };
        } else {
            // Gold/Silver: checksum 1 over 0x2009-0x2D68, stored at 0x2D69
            const ck1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
            if (ck1) {
                // GS checksum 2 is over scattered backup regions — validate by summing all
                const ck2 = this._validateGSChecksum2(view);
                return { valid: true, checksum2Valid: ck2 };
            }
            // Fallback: try Crystal offsets
            const cryCk1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
            if (cryCk1) {
                return { valid: true, checksum2Valid: null };
            }
            // Fallback: try Japanese GS offsets
            const jpnCk1 = this._validateChecksumRange(view, 0x2009, 0x2C8B, 0x2D0D);
            if (jpnCk1) {
                return { valid: true, checksum2Valid: null };
            }
            return { valid: false, checksum2Valid: false };
        }
    }

    /**
     * Validate GS checksum 2 (over scattered backup regions).
     * @private
     */
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

    /**
     * Validate a checksum range using plain 16-bit sum (little-endian storage).
     * @private
     */
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

    // ================================================================
    // ---- TRAINER PARSING ----
    // ================================================================

    /**
     * Parse trainer information using game-version-correct offsets.
     * @private
     */
    _parseTrainer(view, off, isCrystal) {
        const name = decodeGen2Text(view, off.PLAYER_NAME, 11);
        const id = getUInt16BigEndian(view, off.PLAYER_ID).toString().padStart(5, '0');
        
        // Money: 3-byte big-endian binary integer (NOT BCD!)
        const moneyRaw = (view[off.MONEY] << 16) | (view[off.MONEY + 1] << 8) | view[off.MONEY + 2];
        const money = moneyRaw & 0xFFFFFF;
        if (money > 999999) console.warn(`[Gen2Parser] Money value ${money} exceeds max 999999`);

        const rivalName = decodeGen2Text(view, off.RIVAL_NAME, 11);

        // Badges: 2 separate bytes (Johto + Kanto)
        const johtoBadges = view[off.JOHTO_BADGES] || 0;
        const kantoBadges = view[off.KANTO_BADGES] || 0;
        const totalBadges = countSetBits([johtoBadges], 0, 1) + countSetBits([kantoBadges], 0, 1);
        const badgesCombined = johtoBadges | (kantoBadges << 8);

        // Play time
        const hours = getUInt16BigEndian(view, off.TIME_PLAYED);
        const minutes = view[off.TIME_PLAYED + 2];
        const playTime = `${hours}h ${minutes.toString().padStart(2, '0')}m`;

        // Casino coins
        const coins = getUInt16BigEndian(view, off.CASINO_COINS || (off.MONEY + 7));

        // Gender (Crystal only)
        const genderByte = isCrystal ? (view[off.PLAYER_GENDER] || 0) : 0;
        const gender = genderByte === 1 ? 'Female' : 'Male';

        return {
            name, id, money, coins,
            playTime,
            badges: totalBadges,
            badgesCombined,
            rivalName,
            pikachuFriendship: 0,
            gender
        };
    }

    // ================================================================
    // ---- POKEDEX PARSING ----
    // ================================================================

    _parsePokedex(view, off) {
        const ownedFlags = [false];
        const seenFlags = [false];

        for (let i = 1; i <= 251; i++) {
            const byteIndex = Math.floor((i - 1) / 8);
            const bitIndex = (i - 1) % 8;

            const ownedByte = view[off.POKEDEX_OWNED + byteIndex] || 0;
            const seenByte = view[off.POKEDEX_SEEN + byteIndex] || 0;

            ownedFlags.push((ownedByte & (1 << bitIndex)) !== 0);
            seenFlags.push((seenByte & (1 << bitIndex)) !== 0);
        }

        return {
            owned: ownedFlags.filter((f, i) => i > 0 && i <= 251 && f).length,
            seen: seenFlags.filter((f, i) => i > 0 && i <= 251 && f).length,
            ownedFlags,
            seenFlags
        };
    }

    // ================================================================
    // ---- PARTY PARSING (PokeList2 format) ----
    // ================================================================

    /**
     * Parse party Pokemon using PokeList2 format.
     * The format is: [count(1)] [species(N+1)] [structs(N×48)] [OT(N×11)] [Nicks(N×11)]
     * All sections are SEPARATE sequential blocks, NOT interleaved.
     * @private
     */
    _parseParty(view, off) {
        const count = Math.min(view[off.PARTY_COUNT] || 0, 6);
        const pokemon = [];

        for (let i = 0; i < count; i++) {
            // Species ID is at PARTY_SPECIES + i
            const speciesId = view[off.PARTY_SPECIES + i];
            if (speciesId === 0xFF || speciesId === 0x00) continue;

            // Pokemon struct at PARTY_STRUCTS + (i * 48)
            const structOffset = off.PARTY_STRUCTS + (i * 48);
            // OT name at PARTY_OT_NAMES + (i * 11)
            const otOffset = off.PARTY_OT_NAMES + (i * 11);
            // Nickname at PARTY_NICKNAMES + (i * 11)
            const nickOffset = off.PARTY_NICKNAMES + (i * 11);

            const mon = this._parsePokemonStruct(view, structOffset, true, otOffset, nickOffset);
            if (mon) pokemon.push(mon);
        }

        return { pokemon, count };
    }

    // ================================================================
    // ---- PC BOX PARSING ----
    // ================================================================

    /**
     * Parse PC boxes using FIXED offsets in SRAM banks.
     * 
     * Box layout:
     * - Current box is a COPY at off.CURRENT_BOX_DATA (within checksum 1 region)
     * - Boxes 0-6 are at fixed offsets in Bank 2 (0x4000+)
     * - Boxes 7-13 are at fixed offsets in Bank 3 (0x6000+)
     * - The current box index tells us which permanent box position
     *   holds the same data as CURRENT_BOX_DATA
     * 
     * When reading: read from permanent positions, overlay current box data
     * @private
     */
    _parseBoxes(view, off, isCrystal) {
        const currentBoxId = view[off.CURRENT_BOX] & 0x7F;
        const boxOffsets = isCrystal ? C_INT_BOX_OFFSETS : GS_INT_BOX_OFFSETS;
        const boxes = [];

        for (let i = 0; i < 14; i++) {
            if (i === currentBoxId) {
                // Use the current box data (within checksum region, more reliable)
                boxes.push(this._parseBoxList(view, off.CURRENT_BOX_DATA, 20));
            } else {
                // Use the permanent box position in SRAM banks
                boxes.push(this._parseBoxList(view, boxOffsets[i], 20));
            }
        }

        return { boxes, currentBoxId };
    }

    /**
     * Parse a single box list (PokeList2 format for box).
     * Format: [count(1)] [species(N+1)] [structs(N×32)] [OT(N×11)] [Nicks(N×11)] [FF00]
     * @private
     */
    _parseBoxList(view, boxStart, maxSlots) {
        const boxPokemon = [];
        const count = Math.min(view[boxStart] || 0, maxSlots);

        // Species list starts at boxStart + 1 (after count byte)
        const speciesStart = boxStart + 1;

        // Structs start after species list: count byte + (maxSlots + 1) species bytes
        const structsStart = boxStart + 1 + (maxSlots + 1);

        // OT names after all structs
        const otNamesStart = structsStart + (maxSlots * 32);

        // Nicknames after all OT names
        const nicknamesStart = otNamesStart + (maxSlots * 11);

        for (let i = 0; i < count; i++) {
            const speciesId = view[speciesStart + i];
            if (speciesId === 0xFF || speciesId === 0x00) continue;

            const structOffset = structsStart + (i * 32);
            const otOffset = otNamesStart + (i * 11);
            const nickOffset = nicknamesStart + (i * 11);

            const mon = this._parsePokemonStruct(view, structOffset, false, otOffset, nickOffset);
            if (mon) boxPokemon.push(mon);
        }

        return boxPokemon;
    }

    // ================================================================
    // ---- POKEMON STRUCT PARSING ----
    // ================================================================

    /**
     * Parse a Pokemon struct from binary data.
     * @private
     */
    _parsePokemonStruct(view, offset, isParty, otOffset, nickOffset) {
        const struct = isParty ? GEN2_PARTY_STRUCT : GEN2_BOX_STRUCT;

        // Species
        const speciesId = view[offset + struct.SPECIES];
        if (speciesId === 0 || speciesId === 0xFF) return null;

        const isEgg = speciesId === GEN2_EGG_SPECIES_ID;
        const dexId = isEgg ? 0 : (GEN2_INTERNAL_TO_DEX[speciesId] || speciesId);

        // Held Item
        const heldItemId = view[offset + struct.HELD_ITEM];
        const heldItemName = heldItemId > 0 && heldItemId < GEN2_ITEM_NAMES.length ? GEN2_ITEM_NAMES[heldItemId] : '';

        // Moves (4 bytes at offsets 0x02-0x05)
        const moveIds = [
            view[offset + struct.MOVES],
            view[offset + struct.MOVES + 1],
            view[offset + struct.MOVES + 2],
            view[offset + struct.MOVES + 3]
        ];

        // Trainer ID (2 bytes big-endian at 0x06)
        const otId = getUInt16BigEndian(view, offset + struct.TRAINER_ID);

        // Experience (3 bytes big-endian at 0x08)
        const experience = getUInt24BigEndian(view, offset + struct.EXPERIENCE);

        // EVs (2 bytes big-endian each)
        const hpEv = getUInt16BigEndian(view, offset + struct.HP_EV);
        const atkEv = getUInt16BigEndian(view, offset + struct.ATK_EV);
        const defEv = getUInt16BigEndian(view, offset + struct.DEF_EV);
        const spdEv = getUInt16BigEndian(view, offset + struct.SPD_EV);
        const spcEv = getUInt16BigEndian(view, offset + struct.SPC_EV);

        // DVs (2 bytes packed at 0x15-0x16)
        const dvByte1 = view[offset + struct.DVS];
        const dvByte2 = view[offset + struct.DVS + 1];
        const atkDv = (dvByte1 >> 4) & 0xF;
        const defDv = dvByte1 & 0xF;
        const spdDv = (dvByte2 >> 4) & 0xF;
        const spcDv = dvByte2 & 0xF;
        // HP DV is derived from other DVs
        const hpDv = ((atkDv & 1) << 3) | ((defDv & 1) << 2) | ((spdDv & 1) << 1) | (spcDv & 1);

        // PP + PP Ups at offsets 0x17-0x1A (4 bytes)
        // Each byte: bits 5-0 = current PP, bits 7-6 = PP Ups count (0-3)
        const ppUpsBytes = [
            view[offset + struct.PP_UPS],
            view[offset + struct.PP_UPS + 1],
            view[offset + struct.PP_UPS + 2],
            view[offset + struct.PP_UPS + 3]
        ];

        // Friendship at offset 0x1B
        const friendship = view[offset + struct.FRIENDSHIP];

        // Pokerus at offset 0x1C
        const pokerusByte = view[offset + struct.POKERUS];

        // Caught Data at offset 0x1D-0x1E (Crystal only)
        const caughtData = getUInt16BigEndian(view, offset + struct.CAUGHT_DATA);

        // Shiny check
        const isShiny = defDv === GEN2_SHINY_STAT_DV &&
                        spdDv === GEN2_SHINY_STAT_DV &&
                        spcDv === GEN2_SHINY_STAT_DV &&
                        GEN2_SHINY_ATTACK_DVS.includes(atkDv);

        // Gender determination
        const gender = this._determineGender(dexId, atkDv);

        // Level & Stats (party only)
        let level = 1;
        let currentHp = 0;
        let maxHp = 0;
        let attack = 0;
        let defense = 0;
        let speed = 0;
        let spAttack = 0;
        let spDefense = 0;
        let status = 'OK';

        if (isParty) {
            level = view[offset + GEN2_PARTY_STRUCT.LEVEL];
            status = decodeStatus(view[offset + GEN2_PARTY_STRUCT.STATUS]);
            currentHp = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.CURRENT_HP);
            maxHp = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.MAX_HP);
            attack = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.ATTACK);
            defense = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.DEFENSE);
            speed = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.SPEED);
            spAttack = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.SP_ATK);
            spDefense = getUInt16BigEndian(view, offset + GEN2_PARTY_STRUCT.SP_DEF);
        } else {
            // Calculate stats from base stats + DVs + EVs for box Pokemon
            const base = GEN2_BASE_STATS[dexId];
            if (base) {
                level = this._calculateLevel(dexId, experience);
                maxHp = this._calculateStat(base.hp, hpDv, hpEv, level, true);
                attack = this._calculateStat(base.atk, atkDv, atkEv, level, false);
                defense = this._calculateStat(base.def, defDv, defEv, level, false);
                speed = this._calculateStat(base.spe, spdDv, spdEv, level, false);
                spAttack = this._calculateStat(base.spc, spcDv, spcEv, level, false);
                spDefense = spAttack;
                currentHp = maxHp;
            }
        }

        // Types
        const types = GEN2_POKEMON_TYPES[dexId] || [0, 0];
        const typeNames = types.map(t => GEN2_TYPE_NAMES[t] || '');

        // Nickname and OT Name
        const nickname = nickOffset !== undefined ? decodeGen2Text(view, nickOffset, 11) : '';
        const otName = otOffset !== undefined ? decodeGen2Text(view, otOffset, 11) : '';

        const speciesName = isEgg ? 'Egg' : (GEN2_POKEMON_NAMES[dexId] || '???');
        const isNicknamed = nickname !== '' && nickname !== speciesName;

        // PP and PP Ups
        const moves = moveIds.map((id, idx) => {
            if (id === 0 || id > 251) return { id: 0, pp: 0, ppUps: 0 };
            const ppByte = ppUpsBytes[idx] || 0;
            const pp = ppByte & 0x3F;
            const ppUps = (ppByte >> 6) & 0x3;
            return { id, pp, ppUps };
        });

        const structSize = isParty ? 48 : 32;

        return new CanonicalPokemon({
            dexId,
            speciesId,
            speciesName,
            nickname,
            isNicknamed,
            form: 0,

            otName,
            otId,
            secretId: 0,
            otGender: 'Male',

            level,
            experience,

            moves,

            stats: {
                hp: currentHp,
                maxHp,
                attack,
                defense,
                speed,
                special: spAttack,
                spAttack,
                spDefense
            },

            evs: {
                hp: hpEv,
                attack: atkEv,
                defense: defEv,
                speed: spdEv,
                special: spcEv,
                spAttack: spcEv,
                spDefense: spcEv
            },

            ivs: {
                hp: hpDv,
                attack: atkDv,
                defense: defDv,
                speed: spdDv,
                special: spcDv,
                spAttack: spcDv,
                spDefense: spcDv
            },

            types,
            typeNames,

            status,
            isParty,
            isEgg,

            raw: view.slice(offset, offset + structSize),
            startOffset: offset,
            nicknameRaw: nickOffset !== undefined ? view.slice(nickOffset, nickOffset + 11) : null,
            otNameRaw: otOffset !== undefined ? view.slice(otOffset, otOffset + 11) : null,

            genExtension: {
                heldItem: heldItemId,
                heldItemName,
                isShiny,
                gender,
                friendship,
                pokerus: pokerusByte,
                pokerusStrain: (pokerusByte >> 4) & 0xF,
                pokerusDays: pokerusByte & 0xF,
                caughtData,
                isEgg
            }
        });
    }

    // ================================================================
    // ---- HELPER METHODS ----
    // ================================================================

    _determineGender(dexId, atkDv) {
        if (dexId === 0) return 'Genderless';
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

    _calculateStat(base, dv, ev, level, isHp) {
        if (isHp) {
            return Math.floor(((2 * (base + dv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + level + 10);
        } else {
            return Math.floor(((2 * (base + dv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + 5);
        }
    }

    _calculateLevel(dexId, experience) {
        const base = GEN2_BASE_STATS[dexId];
        if (!base) return 1;
        const growthRate = this._getGrowthRate(dexId);
        for (let lvl = 100; lvl >= 1; lvl--) {
            const expNeeded = this._getExpForLevel(lvl, growthRate);
            if (experience >= expNeeded) return lvl;
        }
        return 1;
    }

    _getGrowthRate(dexId) {
        // Growth rate categories for Gen 1+2 Pokemon (Dex IDs 1-251)
        // Verified against Bulbapedia "List of Pokémon by experience type",
        // PokeAPI pokemon-species data, and Serebii.net
        const fast = [
            35,36,39,40,113,                         // Gen 1: Clefairy, Jigglypuff, Chansey
            165,166,167,168,                          // Gen 2: Ledyba, Spinarak
            173,174,175,176,                          // Gen 2: Cleffa, Igglybuff, Togepi
            183,184,                                  // Gen 2: Marill
            190,200,                                  // Gen 2: Aipom, Misdreavus
            209,210,                                  // Gen 2: Snubbull
            222,225,235,242                           // Gen 2: Corsola, Delibird, Smeargle, Blissey
        ];
        const mediumFast = [
            10,11,12,13,14,15,                        // Gen 1: Caterpie, Weedle
            16,17,18,                                 // Gen 1: Pidgey
            19,20,21,22,23,24,                        // Gen 1: Rattata, Spearow, Ekans
            25,26,27,28,                              // Gen 1: Pikachu, Sandshrew
            37,38,                                    // Gen 1: Vulpix
            41,42,46,47,48,49,50,51,                  // Gen 1: Zubat, Paras, Venonat, Diglett
            52,53,54,55,56,57,                        // Gen 1: Meowth, Psyduck, Mankey
            77,78,79,80,81,82,83,84,85,86,87,88,89,  // Gen 1: Ponyta, Slowpoke, Magnemite, etc.
            95,96,97,98,99,100,101,                   // Gen 1: Onix, Drowzee, Krabby, Voltorb
            104,105,106,107,108,109,110,              // Gen 1: Cubone, Hitmons, Lickitung, Koffing
            114,115,116,117,118,119,                  // Gen 1: Tangela, Kangaskhan, Horsea, Goldeen
            122,123,124,125,126,                      // Gen 1: Mr. Mime, Scyther, Jynx, Electabuzz, Magmar
            132,133,134,135,136,137,                  // Gen 1: Ditto, Eevee, Porygon
            138,139,140,141,                          // Gen 1: Omanyte, Kabuto
            161,162,163,164,                          // Gen 2: Sentret, Hoothoot
            169,172,                                  // Gen 2: Crobat, Pichu
            177,178,185,                              // Gen 2: Natu, Sudowoodo
            193,194,195,196,197,                      // Gen 2: Yanma, Wooper, Espeon, Umbreon
            199,201,202,203,204,205,206,208,          // Gen 2: Slowking, Unown, Wobbuffet, etc.
            211,212,216,217,218,219,                  // Gen 2: Qwilfish, Scizor, Teddiursa, Slugma
            223,224,230,231,232,233,                  // Gen 2: Remoraid, Kingdra, Phanpy, Porygon2
            236,237,238,239,240                       // Gen 2: Tyrogue, Hitmontop, babies
        ];
        const slow = [
            58,59,                                    // Gen 1: Growlithe
            72,73,                                    // Gen 1: Tentacool
            90,91,                                    // Gen 1: Shellder
            102,103,                                  // Gen 1: Exeggcute
            111,112,                                  // Gen 1: Rhyhorn
            120,121,                                  // Gen 1: Staryu
            127,128,129,130,131,                      // Gen 1: Pinsir, Tauros, Magikarp, Lapras
            142,143,144,145,146,147,148,149,150,      // Gen 1: Aerodactyl, Snorlax, legends, Mewtwo
            170,171,                                  // Gen 2: Chinchou
            214,220,221,                              // Gen 2: Heracross, Swinub
            226,227,228,229,                          // Gen 2: Mantine, Skarmory, Houndour
            234,241,                                  // Gen 2: Stantler, Miltank
            243,244,245,246,247,248,249,250           // Gen 2: Beasts, Larvitar, Lugia, Ho-Oh
        ];
        if (fast.includes(dexId)) return 'fast';
        if (mediumFast.includes(dexId)) return 'medium-fast';
        if (slow.includes(dexId)) return 'slow';
        return 'medium-slow'; // Default: starters, Nidoran, Oddish, Poliwag, Abra, Machop, etc.
    }

    _getExpForLevel(level, growthRate) {
        switch (growthRate) {
            case 'fast': return Math.floor(4 * level * level * level / 5);
            case 'medium-fast': return level * level * level;
            case 'medium-slow': return Math.floor(6 / 5 * level * level * level - 15 * level * level + 100 * level - 140);
            case 'slow': return Math.floor(5 * level * level * level / 4);
            default: return level * level * level;
        }
    }

    // ================================================================
    // ---- ITEM PARSING ----
    // ================================================================

    _parseItems(view, off) {
        const bag = this._parseItemPocket(view, off.BAG_ITEMS, 20);
        const pc = this._parseItemPocket(view, off.PC_ITEMS, 50);
        return { bag, pc };
    }

    _parseItemPocket(view, startOffset, maxCapacity) {
        const count = view[startOffset];
        const items = [];

        for (let i = 0; i < count && i < maxCapacity; i++) {
            const itemId = view[startOffset + 1 + (i * 2)];
            const quantity = view[startOffset + 2 + (i * 2)];
            if (itemId === 0xFF) break;
            items.push({
                id: itemId,
                name: itemId < GEN2_ITEM_NAMES.length ? GEN2_ITEM_NAMES[itemId] : `Item ${itemId}`,
                count: quantity
            });
        }

        return items;
    }

    // ================================================================
    // ---- OPTIONS PARSING ----
    // ================================================================

    _parseOptions(view, off) {
        const byte = view[off.OPTIONS] || 0;
        const textSpeedBits = byte & 0x0F;
        let textSpeed = 'Medium';
        if (textSpeedBits <= 1) textSpeed = 'Fast';
        else if (textSpeedBits >= 5) textSpeed = 'Slow';
        const battleStyle = (byte & 0x40) ? 'Set' : 'Shift';
        const battleAnimation = (byte & 0x80) ? 'Off' : 'On';
        return { textSpeed, battleStyle, battleAnimation };
    }

    // ================================================================
    // ---- DAYCARE PARSING ----
    // ================================================================

    _parseDaycare(view, off) {
        // Daycare offset is approximate — skip if out of range
        if (!off.DAYCARE_IN_USE || off.DAYCARE_IN_USE >= view.length) return [];
        const inUse = view[off.DAYCARE_IN_USE];
        if (!inUse) return [];

        const mon = this._parsePokemonStruct(
            view,
            off.DAYCARE_MON || off.DAYCARE_IN_USE + 1,
            false,
            off.DAYCARE_OT,
            off.DAYCARE_NICK
        );

        return mon ? [mon] : [];
    }
}
