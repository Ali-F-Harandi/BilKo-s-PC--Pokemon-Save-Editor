/**
 * Gen2Writer.js — Generation II Save File Writer
 *
 * Writes CanonicalSaveFile data back to Gen 2 binary format.
 * Updates both checksums after writing.
 *
 * CRITICAL FIXES from improvement plan:
 * - Checksums now use PLAIN 16-bit additive sum (NOT 1's complement)
 * - PP/PPUps are now written at correct offsets (0x17-0x1A)
 * - Money is now written as integer (NOT BCD) for Gen2
 * - Game variant-specific checksum offsets are supported
 */

import { GEN2_OFFSETS, GEN2_PARTY_STRUCT, GEN2_BOX_STRUCT, GEN2_INTERNAL_TO_DEX, GEN2_EGG_SPECIES_ID, GEN2_CHECKSUM_VARIANTS, GEN2_BACKUP_REGIONS } from './constants.js';
import { encodeGen2Text } from './textCodec.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_ITEM_NAMES } from './data/itemData.js';
import { GEN2_MOVE_DATA } from './data/moveData.js';

export class Gen2Writer {
    /**
     * Write a complete Gen 2 save file from CanonicalSaveFile data.
     * @param {import('../../core/CanonicalModel.js').CanonicalSaveFile} canonicalSave - Canonical save data
     * @returns {Uint8Array}
     */
    writeSaveFile(canonicalSave) {
        // Start with the raw data as a base (preserves untouched regions)
        const rawData = canonicalSave.rawData;
        const view = new Uint8Array(rawData.length);
        view.set(rawData);

        // Detect game variant for correct checksum offsets
        const gameVariant = this._detectGameVariant(canonicalSave);

        // Write trainer info
        this._writeTrainer(view, canonicalSave);

        // Write party
        this._writeParty(view, canonicalSave);

        // Write PC boxes
        this._writeBoxes(view, canonicalSave);

        // Write items
        this._writeItems(view, canonicalSave);

        // Recalculate and write checksums using CORRECT algorithm
        this._writeChecksums(view, gameVariant);

        // Write backup regions
        this._writeBackupRegions(view, gameVariant);

        return view;
    }

    /**
     * Create a .pk2 binary from a CanonicalPokemon.
     * .pk2 format: [count=1, species, 0xFF, body(48 bytes), OT(11 bytes), Nick(11 bytes)] = 73 bytes (INT)
     * @param {import('../../core/CanonicalModel.js').CanonicalPokemon} pokemon - Canonical Pokemon data
     * @returns {Uint8Array}
     */
    createPk2(pokemon, isJapanese = false) {
        const strLen = isJapanese ? 6 : 11;
        const totalSize = 1 + 1 + 1 + 48 + strLen + strLen; // count + species + term + body + OT + nick
        const buffer = new Uint8Array(totalSize);

        let pos = 0;
        buffer[pos++] = 1; // count = 1
        buffer[pos++] = pokemon.speciesId || 0; // species
        buffer[pos++] = 0xFF; // terminator

        this._writePokemonStruct(buffer, pos, pokemon, true);
        pos += 48;

        this._writeText(buffer, pos, pokemon.otName || '', strLen);
        pos += strLen;

        this._writeText(buffer, pos, pokemon.nickname || '', strLen);

        return buffer;
    }

    /**
     * Parse a .pk2 binary and return CanonicalPokemon data.
     * @param {Uint8Array} data - .pk2 binary data
     * @returns {Object|null}
     */
    parsePk2(data) {
        if (data.length < 50) return null;
        let pos = 0;
        const count = data[pos++]; // should be 1
        const species = data[pos++]; // species
        const term = data[pos++]; // should be 0xFF

        if (count !== 1 || term !== 0xFF) return null;

        // The remaining data is a 48-byte party struct + OT + nick
        // We just return the raw struct for the parser to handle
        return {
            speciesId: species,
            rawData: data.slice(3, 3 + 48),
            otNameRaw: data.slice(3 + 48, 3 + 48 + 11),
            nickNameRaw: data.slice(3 + 48 + 11, 3 + 48 + 22),
        };
    }

    // ================================================================
    // ---- PRIVATE WRITE METHODS ----
    // ================================================================

    /**
     * Detect game variant from save data for correct checksum offsets.
     * @private
     */
    _detectGameVariant(save) {
        const gameVersion = save.gameVersion || 'Gold';
        const isCrystal = gameVersion === 'Crystal';

        // For now, assume International. Japanese detection would need file size check.
        if (isCrystal) return 'c-int';
        return 'gs-int';
    }

    /**
     * Write trainer info to the save buffer.
     * FIX: Uses PKHeX-verified offsets for MONEY (0x23D9) and BADGES (0x23E4).
     * @private
     */
    _writeTrainer(view, save) {
        const trainer = save.trainer;

        // Player name
        const nameBytes = encodeGen2Text(trainer.name || '', 11);
        for (let i = 0; i < 11; i++) {
            view[GEN2_OFFSETS.PLAYER_NAME + i] = nameBytes[i] || 0x50;
        }

        // Rival name
        const rivalBytes = encodeGen2Text(trainer.rivalName || '', 11);
        for (let i = 0; i < 11; i++) {
            view[GEN2_OFFSETS.RIVAL_NAME + i] = rivalBytes[i] || 0x50;
        }

        // FIX: Gen2 money is stored as a 3-byte big-endian INTEGER at offset 0x23D9 (NOT BCD!)
        const money = Math.min(trainer.money || 0, 999999);
        const moneyVal = money; // Direct integer value
        view[GEN2_OFFSETS.MONEY] = (moneyVal >> 16) & 0xFF;
        view[GEN2_OFFSETS.MONEY + 1] = (moneyVal >> 8) & 0xFF;
        view[GEN2_OFFSETS.MONEY + 2] = moneyVal & 0xFF;

        // Player ID (big-endian)
        const id = parseInt(trainer.id) || 0;
        view[GEN2_OFFSETS.PLAYER_ID] = (id >> 8) & 0xFF;
        view[GEN2_OFFSETS.PLAYER_ID + 1] = id & 0xFF;

        // FIX: Badges at 0x23E4 — 2 bytes LE (Johto + Kanto)
        const totalBadges = trainer.badges || 0;
        // If badgesCombined is available, use it for accurate 2-byte storage
        const badgesCombined = trainer.badgesCombined || totalBadges;
        view[GEN2_OFFSETS.BADGES] = badgesCombined & 0xFF;          // Johto badges
        view[GEN2_OFFSETS.BADGES + 1] = (badgesCombined >> 8) & 0xFF; // Kanto badges

        // Party count
        const partyCount = save.party ? save.party.length : 0;
        view[GEN2_OFFSETS.PARTY_COUNT] = partyCount;

        // Current box
        view[GEN2_OFFSETS.CURRENT_BOX] = (save.currentBoxId || 0) & 0x7F;

        // Gender (Crystal) — use correct offset 0x3E3D
        if (save.genExtension?.isCrystal) {
            view[GEN2_OFFSETS.PLAYER_GENDER] = trainer.gender === 'Female' ? 1 : 0;
        }
    }

    /**
     * Write party Pokemon.
     * @private
     */
    _writeParty(view, save) {
        const party = save.party || [];
        const count = Math.min(party.length, 6);

        // Write species list (6 bytes + 0xFF terminator)
        for (let i = 0; i < 6; i++) {
            const mon = party[i];
            if (mon && i < count) {
                view[GEN2_OFFSETS.PARTY_SPECIES + i] = mon.speciesId || 0;
            } else {
                view[GEN2_OFFSETS.PARTY_SPECIES + i] = 0xFF;
            }
        }
        view[GEN2_OFFSETS.PARTY_SPECIES + 6] = 0xFF; // Terminator

        // Write Pokemon structs, OT names, nicknames
        for (let i = 0; i < 6; i++) {
            const structOffset = GEN2_OFFSETS.PARTY_STRUCTS + (i * GEN2_OFFSETS.PARTY_MON_SIZE);
            const otOffset = GEN2_OFFSETS.PARTY_OT_NAMES + (i * 11);
            const nickOffset = GEN2_OFFSETS.PARTY_NICKNAMES + (i * 11);

            if (i < count && party[i]) {
                this._writePokemonStruct(view, structOffset, party[i], true);
                this._writeText(view, otOffset, party[i].otName || '', 11);
                this._writeText(view, nickOffset, party[i].nickname || '', 11);
            } else {
                // Clear unused slots
                for (let j = 0; j < GEN2_OFFSETS.PARTY_MON_SIZE; j++) {
                    view[structOffset + j] = 0;
                }
                view[otOffset] = 0x50;
                view[nickOffset] = 0x50;
            }
        }
    }

    /**
     * Write PC boxes with proper bank layout.
     * @private
     */
    _writeBoxes(view, save) {
        const boxes = save.pcBoxes || [];
        const currentBoxId = save.currentBoxId || 0;

        // Write all 14 boxes
        for (let boxIdx = 0; boxIdx < Math.min(boxes.length, 14); boxIdx++) {
            const box = boxes[boxIdx] || [];
            let boxOffset;

            if (boxIdx === currentBoxId) {
                boxOffset = GEN2_OFFSETS.CURRENT_BOX_DATA;
            } else {
                // Calculate position in banks
                let bankIndex = 0;
                for (let j = 0; j < boxIdx; j++) {
                    if (j === currentBoxId) continue;
                    bankIndex++;
                }
                const boxDataSize = 21 + (20 * 32) + (20 * 11) + (20 * 11);
                if (bankIndex < 7) {
                    boxOffset = GEN2_OFFSETS.BOX_BANK_1 + (bankIndex * boxDataSize);
                } else {
                    boxOffset = GEN2_OFFSETS.BOX_BANK_2 + ((bankIndex - 7) * boxDataSize);
                }
            }

            this._writeBox(view, boxOffset, box);
        }
    }

    /**
     * Write a single PC box.
     * @private
     */
    _writeBox(view, boxStart, boxPokemon) {
        const count = Math.min(boxPokemon.length, 20);
        const speciesStart = boxStart;
        const structsStart = speciesStart + 21;
        const otNamesStart = structsStart + (20 * 32);
        const nicknamesStart = otNamesStart + (20 * 11);

        // Write species list
        for (let i = 0; i < 20; i++) {
            if (i < count && boxPokemon[i]) {
                const speciesId = boxPokemon[i].speciesId || 0;
                view[speciesStart + i] = boxPokemon[i].genExtension?.isEgg ? 0xFD : speciesId;
            } else {
                view[speciesStart + i] = 0xFF;
            }
        }
        view[speciesStart + 20] = 0xFF; // Terminator

        // Write Pokemon structs, OT names, nicknames
        for (let i = 0; i < 20; i++) {
            const structOffset = structsStart + (i * 32);
            const otOffset = otNamesStart + (i * 11);
            const nickOffset = nicknamesStart + (i * 11);

            if (i < count && boxPokemon[i]) {
                this._writePokemonStruct(view, structOffset, boxPokemon[i], false);
                this._writeText(view, otOffset, boxPokemon[i].otName || '', 11);
                this._writeText(view, nickOffset, boxPokemon[i].nickname || '', 11);
            } else {
                // Clear unused slots
                for (let j = 0; j < 32; j++) view[structOffset + j] = 0;
                view[otOffset] = 0x50;
                view[nickOffset] = 0x50;
            }
        }
    }

    /**
     * Write a Pokemon struct to the buffer.
     * FIXED: PP/PPUps now written at correct offset 0x17-0x1A.
     * FIXED: Pokerus at 0x1C, Friendship at 0x1B (were swapped before).
     * @private
     */
    _writePokemonStruct(view, offset, pokemon, isParty) {
        const struct = isParty ? GEN2_PARTY_STRUCT : GEN2_BOX_STRUCT;

        // Species
        view[offset + struct.SPECIES] = pokemon.speciesId || 0;

        // Held Item
        const heldItem = pokemon.genExtension?.heldItem || 0;
        view[offset + struct.HELD_ITEM] = heldItem;

        // Moves
        const moves = pokemon.moves || [];
        view[offset + struct.MOVES] = moves[0]?.id || 0;
        view[offset + struct.MOVES + 1] = moves[1]?.id || 0;
        view[offset + struct.MOVES + 2] = moves[2]?.id || 0;
        view[offset + struct.MOVES + 3] = moves[3]?.id || 0;

        // Trainer ID (big-endian)
        const otId = pokemon.otId || 0;
        view[offset + struct.TRAINER_ID] = (otId >> 8) & 0xFF;
        view[offset + struct.TRAINER_ID + 1] = otId & 0xFF;

        // Experience (3 bytes big-endian)
        const exp = pokemon.experience || 0;
        view[offset + struct.EXPERIENCE] = (exp >> 16) & 0xFF;
        view[offset + struct.EXPERIENCE + 1] = (exp >> 8) & 0xFF;
        view[offset + struct.EXPERIENCE + 2] = exp & 0xFF;

        // EVs (2 bytes big-endian each)
        const evs = pokemon.evs || {};
        this._writeUInt16BE(view, offset + struct.HP_EV, evs.hp || 0);
        this._writeUInt16BE(view, offset + struct.ATK_EV, evs.attack || 0);
        this._writeUInt16BE(view, offset + struct.DEF_EV, evs.defense || 0);
        this._writeUInt16BE(view, offset + struct.SPD_EV, evs.speed || 0);
        this._writeUInt16BE(view, offset + struct.SPC_EV, evs.special || evs.spAttack || 0);

        // DVs (2 bytes packed)
        const ivs = pokemon.ivs || {};
        const atkDv = (ivs.attack || 0) & 0xF;
        const defDv = (ivs.defense || 0) & 0xF;
        const spdDv = (ivs.speed || 0) & 0xF;
        const spcDv = (ivs.special || ivs.spAttack || 0) & 0xF;
        view[offset + struct.DVS] = (atkDv << 4) | defDv;
        view[offset + struct.DVS + 1] = (spdDv << 4) | spcDv;

        // FIX: PP + PP Ups at offset 0x17-0x1A (4 bytes)
        // Each byte: bits 5-0 = current PP, bits 7-6 = PP Ups count
        for (let i = 0; i < 4; i++) {
            const move = moves[i] || { id: 0, pp: 0, ppUps: 0 };
            const ppUps = (move.ppUps || 0) & 0x3;
            const pp = move.pp || 0;
            const basePP = (move.id > 0 && GEN2_MOVE_DATA && GEN2_MOVE_DATA[move.id]) ? GEN2_MOVE_DATA[move.id].pp : 0;
            // If pp is 0 but we have a move, calculate from base PP
            const effectivePP = pp > 0 ? pp : (basePP + Math.floor(basePP * ppUps * 20 / 100));
            view[offset + struct.PP_UPS + i] = ((ppUps << 6) | (effectivePP & 0x3F)) & 0xFF;
        }

        // FIX: Friendship at offset 0x1B (NOT 0x18)
        view[offset + struct.FRIENDSHIP] = pokemon.genExtension?.friendship || 0;

        // FIX: Pokerus at offset 0x1C (NOT 0x17)
        view[offset + struct.POKERUS] = pokemon.genExtension?.pokerus || 0;

        // Caught Data (Crystal only, offset 0x1D-0x1E)
        // FIX: Must write big-endian to match parser (getUInt16BigEndian reads high byte first)
        if (pokemon.genExtension?.caughtData !== undefined) {
            const caughtData = pokemon.genExtension.caughtData;
            view[offset + struct.CAUGHT_DATA] = (caughtData >> 8) & 0xFF;     // High byte first (big-endian)
            view[offset + struct.CAUGHT_DATA + 1] = caughtData & 0xFF;        // Low byte second
        }

        // Party-only fields
        if (isParty) {
            const stats = pokemon.stats || {};
            view[offset + GEN2_PARTY_STRUCT.LEVEL] = pokemon.level || 1;

            // Status
            const statusMap = { 'OK': 0, 'SLP': 0x07, 'PSN': 0x08, 'BRN': 0x10, 'FRZ': 0x20, 'PAR': 0x40, 'TOX': 0x08 };
            view[offset + GEN2_PARTY_STRUCT.STATUS] = statusMap[pokemon.status] || 0;

            // Stats (2 bytes big-endian each) — FIXED offsets
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.CURRENT_HP, stats.hp || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.MAX_HP, stats.maxHp || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.ATTACK, stats.attack || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.DEFENSE, stats.defense || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SPEED, stats.speed || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SP_ATK, stats.spAttack || stats.special || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SP_DEF, stats.spDefense || stats.special || 0);
        }
    }

    /**
     * Write items to save buffer.
     * @private
     */
    _writeItems(view, save) {
        this._writeItemPocket(view, GEN2_OFFSETS.BAG_ITEMS, save.items || [], 20);
        this._writeItemPocket(view, GEN2_OFFSETS.PC_ITEMS, save.pcItems || [], 50);
    }

    /**
     * Write an item pocket.
     * @private
     */
    _writeItemPocket(view, startOffset, items, maxCapacity) {
        const count = Math.min(items.length, maxCapacity);
        view[startOffset] = count;

        for (let i = 0; i < count; i++) {
            view[startOffset + 1 + (i * 2)] = items[i].id || 0;
            view[startOffset + 2 + (i * 2)] = items[i].count || 0;
        }

        // Mark end
        if (count < maxCapacity) {
            view[startOffset + 1 + (count * 2)] = 0xFF;
        }
    }

    /**
     * Write text string to buffer using Gen 2 encoding.
     * @private
     */
    _writeText(view, offset, str, maxLength) {
        const bytes = encodeGen2Text(str, maxLength);
        for (let i = 0; i < bytes.length && i < maxLength; i++) {
            view[offset + i] = bytes[i];
        }
    }

    /**
     * Write a 16-bit big-endian value.
     * @private
     */
    _writeUInt16BE(view, offset, value) {
        view[offset] = (value >> 8) & 0xFF;
        view[offset + 1] = value & 0xFF;
    }

    /**
     * CRITICAL FIX: Write checksums using PLAIN 16-bit additive sum.
     * Gen2 does NOT use 1's complement — it's a direct sum stored as u16 LE.
     * @private
     */
    _writeChecksums(view, gameVariant = 'gs-int') {
        const variant = GEN2_CHECKSUM_VARIANTS[gameVariant] || GEN2_CHECKSUM_VARIANTS['gs-int'];

        // Checksum 1: plain 16-bit additive sum, stored little-endian
        if (variant.checksum1) {
            const { start, end, store } = variant.checksum1;
            let sum1 = 0;
            for (let i = start; i <= end; i++) {
                sum1 += view[i];
            }
            const checksum1 = (sum1 & 0xFFFF) >>> 0; // PLAIN sum, NOT complement!
            view[store] = checksum1 & 0xFF;
            view[store + 1] = (checksum1 >> 8) & 0xFF;
        }

        // Checksum 2: plain 16-bit additive sum, stored little-endian
        if (variant.checksum2) {
            const { start, end, store } = variant.checksum2;
            let sum2 = 0;
            for (let i = start; i <= end; i++) {
                sum2 += view[i];
            }
            const checksum2 = (sum2 & 0xFFFF) >>> 0; // PLAIN sum, NOT complement!
            view[store] = checksum2 & 0xFF;
            view[store + 1] = (checksum2 >> 8) & 0xFF;
        }
    }

    /**
     * Write backup regions for data redundancy.
     * @private
     */
    _writeBackupRegions(view, gameVariant = 'gs-int') {
        const regions = GEN2_BACKUP_REGIONS[gameVariant];
        if (!regions) return;

        for (const region of regions) {
            for (let i = 0; i < region.len; i++) {
                if (region.src + i < view.length && region.dst + i < view.length) {
                    view[region.dst + i] = view[region.src + i];
                }
            }
        }
    }
}
