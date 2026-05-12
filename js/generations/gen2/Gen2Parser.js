/**
 * Gen2Parser.js — Generation II Save File Parser
 *
 * Parses Pokemon Gold, Silver, and Crystal save files from binary
 * into CanonicalSaveFile / CanonicalPokemon objects.
 *
 * Gen 2 save format (32768 bytes):
 * - 0x0000-0x0FFF: Hall of Fame, mystery gift, etc.
 * - 0x1000-0x1FFF: Mirror of current box data
 * - 0x2000-0x2D0C: Main save data (checksum 1)
 * - 0x2D0D: Checksum 1
 * - 0x2D0E-0x7F6C: Box data banks (checksum 2)
 * - 0x7F6D: Checksum 2
 */

import { CanonicalSaveFile, CanonicalPokemon } from '../../core/CanonicalModel.js';
import { GEN2_OFFSETS, GEN2_PARTY_STRUCT, GEN2_BOX_STRUCT, GEN2_INTERNAL_TO_DEX, GEN2_EGG_SPECIES_ID, GEN2_SHINY_ATTACK_DVS, GEN2_SHINY_STAT_DV, GEN2_GENDER_THRESHOLDS } from './constants.js';
import { decodeGen2Text } from './textCodec.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_POKEMON_TYPES, GEN2_GENDER_RATIOS } from './data/pokemonData.js';
import { GEN2_MOVE_NAMES } from './data/moveData.js';
import { GEN2_ITEM_NAMES } from './data/itemData.js';
import { GEN2_TYPE_NAMES } from './data/typeChart.js';
import { GEN2_BASE_STATS } from './data/baseStats.js';
import { getUInt16BigEndian, getUInt24BigEndian, parseBCD, countSetBits, decodeStatus, getAsciiString } from '../../engine/byteHelpers.js';

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

            // Detect game version first
            const gameVersion = this._detectGameVersion(view, filename);

            // Validate checksums (using correct algorithm: plain 16-bit sum, NOT complement)
            const checksumResult = this._validateChecksums(view, gameVersion);
            if (!checksumResult.valid) {
                return { success: false, error: 'Invalid checksums. This does not appear to be a valid Gen 2 save file.' };
            }
            if (checksumResult.checksum2Valid === false) {
                console.warn('[Gen2Parser] Checksum 2 (box data) invalid — boxes may be corrupted.');
            }

            // Parse trainer info
            const trainer = this._parseTrainer(view);

            // Parse Pokedex
            const pokedex = this._parsePokedex(view);

            // Parse party
            const party = this._parseParty(view);

            // Parse PC boxes
            const pcBoxes = this._parseBoxes(view);

            // Parse items (Gen 2 has 4 pockets)
            const items = this._parseItems(view);

            // Parse event flags
            const eventFlags = this._parseEventFlags(view);

            // Parse daycare
            const daycare = this._parseDaycare(view);

            // Parse options
            const options = this._parseOptions(view);

            // Build CanonicalSaveFile
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

                eventFlags: eventFlags,
                hallOfFame: [],
                daycare: daycare,

                options: options,
                map: {},

                playerStarterId: 0,
                rivalStarterId: 0,

                rawData: view,

                genExtension: {
                    timeOfDay: this._parseRTC(view),
                    isCrystal: gameVersion === 'Crystal',
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
    // ---- PRIVATE PARSING METHODS ----
    // ================================================================

    /**
     * Detect game version from save data.
     * @private
     */
    _detectGameVersion(view, filename) {
        // Check Game Boy header for title
        const titleOffset = GEN2_OFFSETS.GAME_TITLE_OFFSET;
        if (view.length > titleOffset + 16) {
            const title = getAsciiString(view, titleOffset, 16).toUpperCase();
            if (title.includes('PM_CRYSTAL') || title.includes('CRYSTAL')) return 'Crystal';
            if (title.includes('PM_GOLD') || title.includes('GOLD')) return 'Gold';
            if (title.includes('PM_SILVER') || title.includes('SILVER')) return 'Silver';
            // Check without PM_ prefix
            if (title.includes('CRYST')) return 'Crystal';
            if (title.includes('GOLD')) return 'Gold';
            if (title.includes('SILVER')) return 'Silver';
        }

        // Check Crystal-specific data (mobile phone, female trainer)
        if (view.length > GEN2_OFFSETS.PLAYER_GENDER) {
            const gender = view[GEN2_OFFSETS.PLAYER_GENDER];
            // Crystal can have female trainer (0x01)
            // This is a heuristic — not 100% reliable
        }

        // Fallback: check filename
        if (filename) {
            const lower = filename.toLowerCase();
            if (lower.includes('crystal')) return 'Crystal';
            if (lower.includes('gold')) return 'Gold';
            if (lower.includes('silver')) return 'Silver';
        }

        // Default to Gold
        return 'Gold';
    }

    /**
     * Validate Gen 2 checksums using the correct algorithm (plain 16-bit sum).
     * Gold/Silver and Crystal have DIFFERENT checksum positions and ranges.
     * @param {Uint8Array} view
     * @param {string} gameVersion - Detected game version
     * @returns {{ valid: boolean, checksum2Valid: boolean|null }}
     * @private
     */
    _validateChecksums(view, gameVersion) {
        if (gameVersion === 'Crystal') {
            // International Crystal: sum 0x2009-0x2B82, checksum at 0x2D0D
            const ck1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
            if (ck1) {
                // Crystal checksum 2: sum 0x1209-0x1D82, checksum at 0x1F0D
                const ck2 = this._validateChecksumRange(view, 0x1209, 0x1D82, 0x1F0D);
                return { valid: true, checksum2Valid: ck2 };
            }
            // Fallback: try Gold/Silver offsets too (game detection might be wrong)
            const gsCk1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
            if (gsCk1) {
                return { valid: true, checksum2Valid: null };
            }
            return { valid: false, checksum2Valid: false };
        } else {
            // Gold/Silver: sum 0x2009-0x2D68, checksum at 0x2D69
            const ck1 = this._validateChecksumRange(view, 0x2009, 0x2D68, 0x2D69);
            if (ck1) {
                // Gold/Silver checksum 2: sum 0x2D6E-0x7E6C, checksum at 0x7E6D
                const ck2 = this._validateChecksumRange(view, 0x2D6E, 0x7E6C, 0x7E6D);
                return { valid: true, checksum2Valid: ck2 };
            }
            // Fallback: try Crystal offsets (game detection might be wrong)
            const cryCk1 = this._validateChecksumRange(view, 0x2009, 0x2B82, 0x2D0D);
            if (cryCk1) {
                return { valid: true, checksum2Valid: null };
            }
            // Fallback: try Japanese Gold/Silver offsets
            const jpnCk1 = this._validateChecksumRange(view, 0x2009, 0x2C8B, 0x2D0D);
            if (jpnCk1) {
                return { valid: true, checksum2Valid: null };
            }
            return { valid: false, checksum2Valid: false };
        }
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

    /**
     * Parse trainer information.
     * FIX: Uses PKHeX-verified offsets for MONEY (0x23D9) and BADGES (0x23E4).
     * @private
     */
    _parseTrainer(view) {
        const name = decodeGen2Text(view, GEN2_OFFSETS.PLAYER_NAME, 11);
        const id = getUInt16BigEndian(view, GEN2_OFFSETS.PLAYER_ID).toString().padStart(5, '0');
        // FIX: Gen2 money is stored as 3-byte big-endian INTEGER at offset 0x23D9 (NOT BCD like Gen1!)
        const moneyRaw = (view[GEN2_OFFSETS.MONEY] << 16) | (view[GEN2_OFFSETS.MONEY + 1] << 8) | view[GEN2_OFFSETS.MONEY + 2];
        const money = moneyRaw & 0xFFFFFF; // Max 999999
        const rivalName = decodeGen2Text(view, GEN2_OFFSETS.RIVAL_NAME, 11);

        // FIX: Badges at 0x23E4 — 2 bytes LE (Johto + Kanto)
        const badgesLow = view[GEN2_OFFSETS.BADGES] || 0;       // Johto badges byte
        const badgesHigh = view[GEN2_OFFSETS.BADGES + 1] || 0;  // Kanto badges byte
        const totalBadges = countSetBits([badgesLow], 0, 1) + countSetBits([badgesHigh], 0, 1);
        // Store as combined 16-bit value (low byte = Johto, high byte = Kanto)
        const badgesCombined = badgesLow | (badgesHigh << 8);

        // Play time
        const hoursLow = view[GEN2_OFFSETS.TIME_PLAYED];
        const hoursHigh = view[GEN2_OFFSETS.TIME_PLAYED + 1];
        const hours = ((hoursHigh << 8) | hoursLow);
        const minutes = view[GEN2_OFFSETS.TIME_PLAYED + 2];
        const playTime = `${hours}h ${minutes.toString().padStart(2, '0')}m`;

        // Gender (Crystal)
        const genderByte = view[GEN2_OFFSETS.PLAYER_GENDER] || 0;
        const gender = genderByte === 1 ? 'Female' : 'Male';

        return {
            name, id, money,
            coins: 0,
            playTime,
            badges: totalBadges,
            badgesCombined,  // Store combined for accurate badge editing
            rivalName,
            pikachuFriendship: 0,
            gender
        };
    }

    /**
     * Parse Pokedex data.
     * @private
     */
    _parsePokedex(view) {
        const ownedFlags = [false]; // index 0 unused
        const seenFlags = [false];

        for (let i = 1; i <= 251; i++) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;

            const ownedByte = view[GEN2_OFFSETS.POKEDEX_OWNED + byteIndex];
            const seenByte = view[GEN2_OFFSETS.POKEDEX_SEEN + byteIndex];

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

    /**
     * Parse party Pokemon.
     * @private
     */
    _parseParty(view) {
        const count = view[GEN2_OFFSETS.PARTY_COUNT];
        const pokemon = [];

        for (let i = 0; i < count && i < 6; i++) {
            const structOffset = GEN2_OFFSETS.PARTY_STRUCTS + (i * GEN2_OFFSETS.PARTY_MON_SIZE);
            const otOffset = GEN2_OFFSETS.PARTY_OT_NAMES + (i * 11);
            const nickOffset = GEN2_OFFSETS.PARTY_NICKNAMES + (i * 11);

            const mon = this._parsePokemonStruct(view, structOffset, true, otOffset, nickOffset);
            if (mon) pokemon.push(mon);
        }

        return { pokemon, count };
    }

    /**
     * Parse PC boxes.
     * @private
     */
    _parseBoxes(view) {
        const currentBoxId = view[GEN2_OFFSETS.CURRENT_BOX] & 0x7F;
        const boxes = [];

        // Box data layout in Gen 2:
        // Current box is at CURRENT_BOX_DATA
        // Other boxes are in two banks
        const boxOffsets = this._calculateBoxOffsets(view, currentBoxId);

        for (let i = 0; i < 14; i++) {
            const boxOffset = boxOffsets[i];
            const boxPokemon = this._parseBox(view, boxOffset);
            boxes.push(boxPokemon);
        }

        return { boxes, currentBoxId };
    }

    /**
     * Calculate byte offsets for each of the 14 PC boxes.
     * @private
     */
    _calculateBoxOffsets(view, currentBoxId) {
        const offsets = [];
        const boxStructSize = 32; // Box Pokemon struct size
        const boxDataSize = 21 + (20 * boxStructSize) + (20 * 11) + (20 * 11);

        // Current box is always at CURRENT_BOX_DATA
        // Bank 1 contains boxes in order (depends on current box)
        // Bank 2 contains the remaining boxes

        for (let i = 0; i < 14; i++) {
            if (i === currentBoxId) {
                offsets.push(GEN2_OFFSETS.CURRENT_BOX_DATA);
            } else {
                // Calculate position in banks
                let bankOffset;
                let boxIndex = 0;
                for (let j = 0; j < i; j++) {
                    if (j === currentBoxId) continue;
                    boxIndex++;
                }
                if (boxIndex < 7) {
                    bankOffset = GEN2_OFFSETS.BOX_BANK_1 + (boxIndex * boxDataSize);
                } else {
                    bankOffset = GEN2_OFFSETS.BOX_BANK_2 + ((boxIndex - 7) * boxDataSize);
                }
                offsets.push(bankOffset);
            }
        }

        return offsets;
    }

    /**
     * Parse a single PC box.
     * @private
     */
    _parseBox(view, boxStart) {
        const boxPokemon = [];

        // Species list: 20 bytes + 0xFF terminator = 21 bytes
        const speciesStart = boxStart;
        const structsStart = speciesStart + 21;
        const otNamesStart = structsStart + (20 * 32);
        const nicknamesStart = otNamesStart + (20 * 11);

        let count = 0;
        for (let i = 0; i < 20; i++) {
            const speciesId = view[speciesStart + i];
            if (speciesId === 0xFF || speciesId === 0x00) break;
            count++;
        }

        for (let i = 0; i < count; i++) {
            const structOffset = structsStart + (i * 32);
            const otOffset = otNamesStart + (i * 11);
            const nickOffset = nicknamesStart + (i * 11);

            const mon = this._parsePokemonStruct(view, structOffset, false, otOffset, nickOffset);
            if (mon) boxPokemon.push(mon);
        }

        return boxPokemon;
    }

    /**
     * Parse a Pokemon struct from binary data.
     * @private
     * @param {Uint8Array} view - Save file binary data
     * @param {number} offset - Start offset of the Pokemon struct
     * @param {boolean} isParty - Whether this is a party Pokemon (48 bytes) or box (32 bytes)
     * @param {number} [otOffset] - Offset of OT name string
     * @param {number} [nickOffset] - Offset of nickname string
     * @returns {CanonicalPokemon|null}
     */
    _parsePokemonStruct(view, offset, isParty, otOffset, nickOffset) {
        const struct = isParty ? GEN2_PARTY_STRUCT : GEN2_BOX_STRUCT;

        // Species
        const speciesId = view[offset + struct.SPECIES];
        if (speciesId === 0 || speciesId === 0xFF) return null;

        const isEgg = speciesId === GEN2_EGG_SPECIES_ID;
        const dexId = isEgg ? 0 : (GEN2_INTERNAL_TO_DEX[speciesId] || 0);

        // Held Item
        const heldItemId = view[offset + struct.HELD_ITEM];
        const heldItemName = heldItemId > 0 && heldItemId < GEN2_ITEM_NAMES.length ? GEN2_ITEM_NAMES[heldItemId] : '';

        // Moves
        const moveIds = [
            view[offset + struct.MOVES],
            view[offset + struct.MOVES + 1],
            view[offset + struct.MOVES + 2],
            view[offset + struct.MOVES + 3]
        ];

        // Trainer ID
        const otId = getUInt16BigEndian(view, offset + struct.TRAINER_ID);

        // Experience
        const experience = getUInt24BigEndian(view, offset + struct.EXPERIENCE);

        // EVs
        const hpEv = getUInt16BigEndian(view, offset + struct.HP_EV);
        const atkEv = getUInt16BigEndian(view, offset + struct.ATK_EV);
        const defEv = getUInt16BigEndian(view, offset + struct.DEF_EV);
        const spdEv = getUInt16BigEndian(view, offset + struct.SPD_EV);
        const spcEv = getUInt16BigEndian(view, offset + struct.SPC_EV);

        // DVs (16-bit packed)
        const dvByte1 = view[offset + struct.DVS];
        const dvByte2 = view[offset + struct.DVS + 1];
        const atkDv = (dvByte1 >> 4) & 0xF;
        const defDv = dvByte1 & 0xF;
        const spdDv = (dvByte2 >> 4) & 0xF;
        const spcDv = dvByte2 & 0xF;
        // HP DV is derived from other DVs
        const hpDv = ((atkDv & 1) << 3) | ((defDv & 1) << 2) | ((spdDv & 1) << 1) | (spcDv & 1);

        // FIX: PP + PP Ups at offset 0x17-0x1A (4 bytes)
        // Each byte: bits 5-0 = current PP, bits 7-6 = PP Ups count
        // This was previously INCORRECTLY claimed to be "not stored" — it IS stored!
        const ppUpsBytes = [
            view[offset + struct.PP_UPS],
            view[offset + struct.PP_UPS + 1],
            view[offset + struct.PP_UPS + 2],
            view[offset + struct.PP_UPS + 3]
        ];

        // FIX: Friendship at offset 0x1B (was incorrectly at 0x18)
        const friendship = view[offset + struct.FRIENDSHIP];

        // FIX: Pokerus at offset 0x1C (was incorrectly at 0x17)
        const pokerusByte = view[offset + struct.POKERUS];
        const pokerus = pokerusByte; // Full byte: high nibble = strain, low nibble = days

        // Caught Data (Crystal only, offset 0x1D-0x1E)
        const caughtData = getUInt16BigEndian(view, offset + struct.CAUGHT_DATA);

        // Egg steps not a separate field — friendship+caughtData overlap for non-eggs
        const isEggMon = speciesId === GEN2_EGG_SPECIES_ID;
        const eggSteps = isEggMon ? 0 : 0; // Egg steps stored differently in PokeList

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
                spDefense = spAttack; // Gen 2 uses same Special base stat for both
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

        // FIX: PP and PP Ups ARE stored in the Pokemon struct at offsets 0x17-0x1A
        // Each byte: bits 5-0 = current PP, bits 7-6 = PP Ups count (0-3)
        const moves = moveIds.map((id, idx) => {
            if (id === 0 || id > 251) return { id: 0, pp: 0, ppUps: 0 };
            const ppByte = ppUpsBytes[idx] || 0;
            const pp = ppByte & 0x3F;          // bits 5-0 = current PP
            const ppUps = (ppByte >> 6) & 0x3; // bits 7-6 = PP Ups (0-3)
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
            otGender: 'Male', // Gen 2 doesn't store OT gender

            level,
            experience,

            moves,

            stats: {
                hp: currentHp,
                maxHp,
                attack,
                defense,
                speed,
                special: spAttack, // Use SpAtk for backward compat
                spAttack,
                spDefense
            },

            evs: {
                hp: hpEv,
                attack: atkEv,
                defense: defEv,
                speed: spdEv,
                special: spcEv,
                spAttack: spcEv, // Gen 2: shared EV
                spDefense: spcEv
            },

            ivs: {
                hp: hpDv,
                attack: atkDv,
                defense: defDv,
                speed: spdDv,
                special: spcDv,
                spAttack: spcDv, // Gen 2: shared DV
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
                pokerus,
                pokerusStrain: (pokerusByte >> 4) & 0xF,
                pokerusDays: pokerusByte & 0xF,
                caughtData,
                eggSteps,
                isEgg
            }
        });
    }

    /**
     * Determine Pokemon gender from Attack DV and species gender ratio.
     * @private
     */
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

    /**
     * Calculate a stat value using the Gen 2 formula.
     * @private
     */
    _calculateStat(base, dv, ev, level, isHp) {
        // Gen 2 stat formula (same as Gen 1)
        if (isHp) {
            return Math.floor(((2 * (base + dv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + level + 10);
        } else {
            return Math.floor(((2 * (base + dv) + Math.floor(Math.min(ev, 65535) / 4)) * level / 100) + 5);
        }
    }

    /**
     * Calculate level from experience using growth rate.
     * @private
     */
    _calculateLevel(dexId, experience) {
        // Simplified: use lookup or formula based on growth rate
        // For now, use a binary search approach
        const base = GEN2_BASE_STATS[dexId];
        if (!base) return 1;

        // Determine growth rate group from species
        const growthRate = this._getGrowthRate(dexId);

        for (let lvl = 100; lvl >= 1; lvl--) {
            const expNeeded = this._getExpForLevel(lvl, growthRate);
            if (experience >= expNeeded) return lvl;
        }
        return 1;
    }

    /**
     * Get growth rate group for a Pokemon.
     * Gen 2 has 4 growth rate groups: Fast, Medium Fast, Medium Slow, Slow.
     * Erratic and Fluctuating are Gen3+ only and do NOT exist in Gen2.
     * Species lists derived from PKHeX personal table data.
     * @private
     */
    _getGrowthRate(dexId) {
        // Growth rate groups in Gen 2 (PKHeX-verified)
        const fast = [1,2,3,4,5,6,43,44,45,60,61,62,129,152,153,154,187,188,189,233];
        const mediumFast = [25,26,37,38,39,40,52,53,54,55,77,78,81,82,109,110,120,121,131,132,133,134,135,136,137,143,155,156,157,169,175,176,179,180,181,196,197,199,209,210,215,217,222,225,226,231,232,241,242,249,250,251];
        const mediumSlow = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,27,28,29,30,31,32,33,34,35,36,41,42,46,47,48,49,50,51,56,57,58,59,63,64,65,66,67,68,69,70,71,72,73,74,75,76,79,80,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,111,112,113,114,115,116,117,118,119,122,123,124,125,126,127,128,130,138,139,140,141,142,144,145,146,147,148,149,150,151,158,159,160,163,164,165,166,167,168,170,171,172,173,174,177,178,182,183,184,185,186,190,191,192,193,194,195,198,200,201,202,203,204,205,206,207,208,211,212,213,214,216,218,219,220,221,223,224,227,228,229,230,234,235,236,237,238,239,240,243,244,245,246,247,248];
        const slow = [];

        if (fast.includes(dexId)) return 'fast';
        if (mediumFast.includes(dexId)) return 'medium-fast';
        if (mediumSlow.includes(dexId)) return 'medium-slow';
        // Everything else is slow
        return 'slow';
    }

    /**
     * Get experience needed for a given level and growth rate.
     * @private
     */
    _getExpForLevel(level, growthRate) {
        switch (growthRate) {
            case 'fast':
                return Math.floor(4 * level * level * level / 5);
            case 'medium-fast':
                return level * level * level;
            case 'medium-slow':
                return Math.floor(6 / 5 * level * level * level - 15 * level * level + 100 * level - 140);
            case 'slow':
                return Math.floor(5 * level * level * level / 4);
            default:
                return level * level * level;
        }
    }

    /**
     * Parse items (Gen 2 has multiple pockets).
     * TM/HM pocket uses a fixed 57-byte array (1 byte per TM/HM slot).
     * Other pockets use the list format: count + [id,qty] pairs + 0xFF.
     * @private
     */
    _parseItems(view) {
        const bag = this._parseItemPocket(view, GEN2_OFFSETS.BAG_ITEMS, 20);
        const pc = this._parseItemPocket(view, GEN2_OFFSETS.PC_ITEMS, 50);

        return { bag, pc };
    }

    /**
     * Parse an item pocket.
     * @private
     */
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

    /**
     * Parse event flags.
     * @private
     */
    _parseEventFlags(view) {
        // Gen 2 has many more event flags than Gen 1
        const flags = [];
        const startOffset = GEN2_OFFSETS.EVENT_FLAGS_START;
        const numBytes = GEN2_OFFSETS.EVENT_FLAGS_NUM_BYTES;

        for (let i = 0; i < numBytes * 8; i++) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            const byte = view[startOffset + byteIndex] || 0;
            flags.push((byte & (1 << bitIndex)) !== 0);
        }

        return flags;
    }

    /**
     * Parse daycare data.
     * @private
     */
    _parseDaycare(view) {
        const inUse = view[GEN2_OFFSETS.DAYCARE_IN_USE];
        if (!inUse) return [];

        const mon = this._parsePokemonStruct(
            view,
            GEN2_OFFSETS.DAYCARE_MON,
            false,
            GEN2_OFFSETS.DAYCARE_OT,
            GEN2_OFFSETS.DAYCARE_NICK
        );

        return mon ? [mon] : [];
    }

    /**
     * Parse game options.
     * @private
     */
    _parseOptions(view) {
        const byte = view[GEN2_OFFSETS.OPTIONS] || 0;
        const textSpeedBits = byte & 0x0F;
        let textSpeed = 'Medium';
        if (textSpeedBits <= 1) textSpeed = 'Fast';
        else if (textSpeedBits >= 5) textSpeed = 'Slow';

        const battleStyle = (byte & 0x40) ? 'Set' : 'Shift';
        const battleAnimation = (byte & 0x80) ? 'Off' : 'On';

        return { textSpeed, battleStyle, battleAnimation };
    }

    /**
     * Parse RTC data.
     * @private
     */
    _parseRTC(view) {
        const hoursLow = view[GEN2_OFFSETS.RTC_HOURS] || 0;
        const hoursHigh = view[GEN2_OFFSETS.RTC_HOURS + 1] || 0;
        const hours = ((hoursHigh << 8) | hoursLow);
        const daysLow = view[GEN2_OFFSETS.RTC_DAYS] || 0;
        const daysHigh = view[GEN2_OFFSETS.RTC_DAYS + 1] || 0;
        const days = ((daysHigh << 8) | daysLow);

        return { hours, days };
    }
}
