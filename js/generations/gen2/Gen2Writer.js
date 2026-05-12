/**
 * Gen2Writer.js — Generation II Save File Writer
 *
 * Writes CanonicalSaveFile data back to Gen 2 binary format.
 * Updates checksums after writing. Uses game-version-specific offsets.
 *
 * VERIFIED against PKHeX source code (SAV2.cs, PK2.cs, PokeList2.cs).
 * Key corrections:
 * - Uses game-version-specific offsets (GS vs Crystal)
 * - Checksums use PLAIN 16-bit additive sum (NOT 1's complement)
 * - PokeList2 format: separate blocks for species/structs/OT/nicknames
 * - Box offsets are at FIXED positions in SRAM banks
 * - Money is 3-byte big-endian binary integer (NOT BCD)
 */

import {
    GEN2_PARTY_STRUCT, GEN2_BOX_STRUCT, GEN2_EGG_SPECIES_ID,
    GEN2_CHECKSUM_VARIANTS, GEN2_BACKUP_REGIONS,
    getOffsetsForVersion, GS_INT_BOX_OFFSETS, C_INT_BOX_OFFSETS,
    BOX_LIST_SIZE_INT
} from './constants.js';
import { encodeGen2Text } from './textCodec.js';
import { GEN2_MOVE_DATA } from './data/moveData.js';

export class Gen2Writer {
    /**
     * Write a complete Gen 2 save file from CanonicalSaveFile data.
     * @param {import('../../core/CanonicalModel.js').CanonicalSaveFile} canonicalSave
     * @returns {Uint8Array}
     */
    writeSaveFile(canonicalSave) {
        const rawData = canonicalSave.rawData;
        const view = new Uint8Array(rawData.length);
        view.set(rawData);

        const gameVariant = this._detectGameVariant(canonicalSave);
        const gameVersion = canonicalSave.gameVersion || 'Gold';
        const off = getOffsetsForVersion(gameVersion);
        const isCrystal = gameVersion === 'Crystal';

        // Write trainer info
        this._writeTrainer(view, canonicalSave, off, isCrystal);

        // Write party
        this._writeParty(view, canonicalSave, off);

        // Write PC boxes
        this._writeBoxes(view, canonicalSave, off, isCrystal);

        // Write items
        this._writeItems(view, canonicalSave, off);

        // Recalculate and write checksums
        this._writeChecksums(view, gameVariant);

        // Write backup regions
        this._writeBackupRegions(view, gameVariant);

        return view;
    }

    /**
     * Create a .pk2 binary from a CanonicalPokemon.
     * @param {import('../../core/CanonicalModel.js').CanonicalPokemon} pokemon
     * @returns {Uint8Array}
     */
    createPk2(pokemon, isJapanese = false) {
        const strLen = isJapanese ? 6 : 11;
        const totalSize = 1 + 1 + 1 + 48 + strLen + strLen;
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
     * Parse a .pk2 binary and return raw data.
     */
    parsePk2(data) {
        if (data.length < 50) return null;
        let pos = 0;
        const count = data[pos++];
        const species = data[pos++];
        const term = data[pos++];

        if (count !== 1 || term !== 0xFF) return null;

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

    _detectGameVariant(save) {
        const gameVersion = save.gameVersion || 'Gold';
        if (gameVersion === 'Crystal') return 'c-int';
        return 'gs-int';
    }

    _writeTrainer(view, save, off, isCrystal) {
        const trainer = save.trainer;

        // Player name
        const nameBytes = encodeGen2Text(trainer.name || '', 11);
        for (let i = 0; i < 11; i++) {
            view[off.PLAYER_NAME + i] = nameBytes[i] || 0x50;
        }

        // Rival name
        const rivalBytes = encodeGen2Text(trainer.rivalName || '', 11);
        for (let i = 0; i < 11; i++) {
            view[off.RIVAL_NAME + i] = rivalBytes[i] || 0x50;
        }

        // Money: 3-byte big-endian binary integer
        const money = Math.min(trainer.money || 0, 999999);
        view[off.MONEY] = (money >> 16) & 0xFF;
        view[off.MONEY + 1] = (money >> 8) & 0xFF;
        view[off.MONEY + 2] = money & 0xFF;

        // Player ID (big-endian)
        const id = parseInt(trainer.id) || 0;
        view[off.PLAYER_ID] = (id >> 8) & 0xFF;
        view[off.PLAYER_ID + 1] = id & 0xFF;

        // Badges (2 separate bytes)
        const badgesCombined = trainer.badgesCombined || trainer.badges || 0;
        view[off.JOHTO_BADGES] = badgesCombined & 0xFF;
        view[off.KANTO_BADGES] = (badgesCombined >> 8) & 0xFF;

        // Casino coins (big-endian)
        const coins = Math.min(trainer.coins || 0, 9999);
        const coinsOffset = off.CASINO_COINS || (off.MONEY + 7);
        view[coinsOffset] = (coins >> 8) & 0xFF;
        view[coinsOffset + 1] = coins & 0xFF;

        // Party count
        const partyCount = save.party ? save.party.length : 0;
        view[off.PARTY_COUNT] = partyCount;

        // Current box
        view[off.CURRENT_BOX] = (save.currentBoxId || 0) & 0x7F;

        // Gender (Crystal only)
        if (isCrystal && off.PLAYER_GENDER) {
            view[off.PLAYER_GENDER] = trainer.gender === 'Female' ? 1 : 0;
        }
    }

    /**
     * Write party Pokemon using PokeList2 format.
     * Format: [count(1)] [species(6+FF)] [structs(6×48)] [OT(6×11)] [Nicks(6×11)]
     */
    _writeParty(view, save, off) {
        const party = save.party || [];
        const count = Math.min(party.length, 6);

        // Write species list (6 slots + 0xFF terminator)
        for (let i = 0; i < 6; i++) {
            if (i < count && party[i]) {
                view[off.PARTY_SPECIES + i] = party[i].speciesId || 0;
            } else {
                view[off.PARTY_SPECIES + i] = 0xFF;
            }
        }
        view[off.PARTY_SPECIES + 6] = 0xFF; // Terminator

        // Write Pokemon structs (separate block)
        for (let i = 0; i < 6; i++) {
            const structOffset = off.PARTY_STRUCTS + (i * 48);
            if (i < count && party[i]) {
                this._writePokemonStruct(view, structOffset, party[i], true);
            } else {
                // Clear unused slots
                for (let j = 0; j < 48; j++) view[structOffset + j] = 0;
            }
        }

        // Write OT names (separate block)
        for (let i = 0; i < 6; i++) {
            const otOffset = off.PARTY_OT_NAMES + (i * 11);
            if (i < count && party[i]) {
                this._writeText(view, otOffset, party[i].otName || '', 11);
            } else {
                view[otOffset] = 0x50;
            }
        }

        // Write nicknames (separate block)
        for (let i = 0; i < 6; i++) {
            const nickOffset = off.PARTY_NICKNAMES + (i * 11);
            if (i < count && party[i]) {
                this._writeText(view, nickOffset, party[i].nickname || '', 11);
            } else {
                view[nickOffset] = 0x50;
            }
        }
    }

    /**
     * Write PC boxes using FIXED offsets in SRAM banks.
     * Current box data is written to both its permanent position AND the current box slot.
     */
    _writeBoxes(view, save, off, isCrystal) {
        const boxes = save.pcBoxes || [];
        const currentBoxId = save.currentBoxId || 0;
        const boxOffsets = isCrystal ? C_INT_BOX_OFFSETS : GS_INT_BOX_OFFSETS;

        for (let boxIdx = 0; boxIdx < Math.min(boxes.length, 14); boxIdx++) {
            const box = boxes[boxIdx] || [];

            // Write to permanent box position
            this._writeBoxList(view, boxOffsets[boxIdx], box, 20);

            // If this is the current box, also write to the current box data slot
            if (boxIdx === currentBoxId) {
                this._writeBoxList(view, off.CURRENT_BOX_DATA, box, 20);
            }
        }
    }

    /**
     * Write a box list in PokeList2 format.
     * Format: [count(1)] [species(20+FF)] [structs(20×32)] [OT(20×11)] [Nicks(20×11)] [FF00]
     */
    _writeBoxList(view, boxStart, boxPokemon, maxSlots) {
        const count = Math.min(boxPokemon.length, maxSlots);

        // Count byte
        view[boxStart] = count;

        // Species list: maxSlots entries + 0xFF terminator
        const speciesStart = boxStart + 1;
        for (let i = 0; i < maxSlots; i++) {
            if (i < count && boxPokemon[i]) {
                const speciesId = boxPokemon[i].speciesId || 0;
                view[speciesStart + i] = boxPokemon[i].genExtension?.isEgg ? 0xFD : speciesId;
            } else {
                view[speciesStart + i] = 0xFF;
            }
        }
        view[speciesStart + maxSlots] = 0xFF; // Terminator

        // Structs block (separate, after species list)
        const structsStart = boxStart + 1 + (maxSlots + 1);
        for (let i = 0; i < maxSlots; i++) {
            const structOffset = structsStart + (i * 32);
            if (i < count && boxPokemon[i]) {
                this._writePokemonStruct(view, structOffset, boxPokemon[i], false);
            } else {
                for (let j = 0; j < 32; j++) view[structOffset + j] = 0;
            }
        }

        // OT names block (separate, after all structs)
        const otNamesStart = structsStart + (maxSlots * 32);
        for (let i = 0; i < maxSlots; i++) {
            const otOffset = otNamesStart + (i * 11);
            if (i < count && boxPokemon[i]) {
                this._writeText(view, otOffset, boxPokemon[i].otName || '', 11);
            } else {
                view[otOffset] = 0x50;
            }
        }

        // Nicknames block (separate, after all OT names)
        const nicknamesStart = otNamesStart + (maxSlots * 11);
        for (let i = 0; i < maxSlots; i++) {
            const nickOffset = nicknamesStart + (i * 11);
            if (i < count && boxPokemon[i]) {
                this._writeText(view, nickOffset, boxPokemon[i].nickname || '', 11);
            } else {
                view[nickOffset] = 0x50;
            }
        }

        // FF00 terminator after the box list
        const ff00Offset = nicknamesStart + (maxSlots * 11);
        if (ff00Offset + 1 < view.length) {
            view[ff00Offset] = 0xFF;
            view[ff00Offset + 1] = 0x00;
        }
    }

    /**
     * Write a Pokemon struct to the buffer.
     */
    _writePokemonStruct(view, offset, pokemon, isParty) {
        const struct = isParty ? GEN2_PARTY_STRUCT : GEN2_BOX_STRUCT;

        // Species
        view[offset + struct.SPECIES] = pokemon.speciesId || 0;

        // Held Item
        const heldItem = pokemon.genExtension?.heldItem || 0;
        view[offset + struct.HELD_ITEM] = heldItem;

        // Moves (4 bytes at offsets 0x02-0x05)
        const moves = pokemon.moves || [];
        view[offset + struct.MOVES] = moves[0]?.id || 0;
        view[offset + struct.MOVES + 1] = moves[1]?.id || 0;
        view[offset + struct.MOVES + 2] = moves[2]?.id || 0;
        view[offset + struct.MOVES + 3] = moves[3]?.id || 0;

        // Trainer ID (2 bytes big-endian at 0x06)
        const otId = pokemon.otId || 0;
        view[offset + struct.TRAINER_ID] = (otId >> 8) & 0xFF;
        view[offset + struct.TRAINER_ID + 1] = otId & 0xFF;

        // Experience (3 bytes big-endian at 0x08)
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

        // DVs (2 bytes packed at 0x15-0x16)
        const ivs = pokemon.ivs || {};
        const atkDv = (ivs.attack || 0) & 0xF;
        const defDv = (ivs.defense || 0) & 0xF;
        const spdDv = (ivs.speed || 0) & 0xF;
        const spcDv = (ivs.special || ivs.spAttack || 0) & 0xF;
        view[offset + struct.DVS] = (atkDv << 4) | defDv;
        view[offset + struct.DVS + 1] = (spdDv << 4) | spcDv;

        // PP + PP Ups at offsets 0x17-0x1A (4 bytes)
        for (let i = 0; i < 4; i++) {
            const move = moves[i] || { id: 0, pp: 0, ppUps: 0 };
            const ppUps = (move.ppUps || 0) & 0x3;
            const pp = move.pp || 0;
            const basePP = (move.id > 0 && GEN2_MOVE_DATA && GEN2_MOVE_DATA[move.id]) ? GEN2_MOVE_DATA[move.id].pp : 0;
            const effectivePP = pp > 0 ? pp : (basePP + Math.floor(basePP * ppUps * 20 / 100));
            view[offset + struct.PP_UPS + i] = ((ppUps << 6) | (effectivePP & 0x3F)) & 0xFF;
        }

        // Friendship at offset 0x1B
        view[offset + struct.FRIENDSHIP] = pokemon.genExtension?.friendship || 0;

        // Pokerus at offset 0x1C
        view[offset + struct.POKERUS] = pokemon.genExtension?.pokerus || 0;

        // Caught Data at offset 0x1D-0x1E (Crystal only, big-endian)
        if (pokemon.genExtension?.caughtData !== undefined) {
            const caughtData = pokemon.genExtension.caughtData;
            view[offset + struct.CAUGHT_DATA] = (caughtData >> 8) & 0xFF;
            view[offset + struct.CAUGHT_DATA + 1] = caughtData & 0xFF;
        }

        // Party-only fields
        if (isParty) {
            const stats = pokemon.stats || {};
            view[offset + GEN2_PARTY_STRUCT.LEVEL] = pokemon.level || 1;

            const statusMap = { 'OK': 0, 'SLP': 0x07, 'PSN': 0x08, 'BRN': 0x10, 'FRZ': 0x20, 'PAR': 0x40, 'TOX': 0x08 };
            view[offset + GEN2_PARTY_STRUCT.STATUS] = statusMap[pokemon.status] || 0;

            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.CURRENT_HP, stats.hp || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.MAX_HP, stats.maxHp || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.ATTACK, stats.attack || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.DEFENSE, stats.defense || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SPEED, stats.speed || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SP_ATK, stats.spAttack || stats.special || 0);
            this._writeUInt16BE(view, offset + GEN2_PARTY_STRUCT.SP_DEF, stats.spDefense || stats.special || 0);
        }
    }

    _writeItems(view, save, off) {
        this._writeItemPocket(view, off.BAG_ITEMS, save.items || [], 20);
        this._writeItemPocket(view, off.PC_ITEMS, save.pcItems || [], 50);
    }

    _writeItemPocket(view, startOffset, items, maxCapacity) {
        const count = Math.min(items.length, maxCapacity);
        view[startOffset] = count;

        for (let i = 0; i < count; i++) {
            view[startOffset + 1 + (i * 2)] = items[i].id || 0;
            view[startOffset + 2 + (i * 2)] = items[i].count || 0;
        }

        if (count < maxCapacity) {
            view[startOffset + 1 + (count * 2)] = 0xFF;
        }
    }

    _writeText(view, offset, str, maxLength) {
        const bytes = encodeGen2Text(str, maxLength);
        for (let i = 0; i < bytes.length && i < maxLength; i++) {
            view[offset + i] = bytes[i];
        }
    }

    _writeUInt16BE(view, offset, value) {
        view[offset] = (value >> 8) & 0xFF;
        view[offset + 1] = value & 0xFF;
    }

    /**
     * Write checksums using PLAIN 16-bit additive sum.
     */
    _writeChecksums(view, gameVariant = 'gs-int') {
        const variant = GEN2_CHECKSUM_VARIANTS[gameVariant] || GEN2_CHECKSUM_VARIANTS['gs-int'];

        // Checksum 1
        if (variant.checksum1) {
            const { start, end, store } = variant.checksum1;
            let sum1 = 0;
            for (let i = start; i <= end; i++) {
                sum1 += view[i];
            }
            const checksum1 = (sum1 & 0xFFFF) >>> 0;
            view[store] = checksum1 & 0xFF;
            view[store + 1] = (checksum1 >> 8) & 0xFF;
        }

        // Checksum 2
        if (variant.checksum2) {
            const { start, end, store } = variant.checksum2;
            let sum2 = 0;
            for (let i = start; i <= end; i++) {
                sum2 += view[i];
            }
            const checksum2 = (sum2 & 0xFFFF) >>> 0;
            view[store] = checksum2 & 0xFF;
            view[store + 1] = (checksum2 >> 8) & 0xFF;
        }

        // For GS: also write backup regions and update checksum 2
        if (gameVariant === 'gs-int') {
            this._writeGSBackupRegions(view);
            this._writeGSChecksum2(view);
        }

        // For Crystal: write backup (mirror of primary to secondary)
        if (gameVariant === 'c-int') {
            const srcStart = 0x2009;
            const dstStart = 0x1209;
            const len = 0x2B83 - 0x2009;
            for (let i = 0; i < len; i++) {
                if (dstStart + i < view.length) {
                    view[dstStart + i] = view[srcStart + i];
                }
            }
        }
    }

    /**
     * Write GS backup regions (copy primary data to scattered secondary locations).
     */
    _writeGSBackupRegions(view) {
        const regions = GEN2_BACKUP_REGIONS['gs-int'];
        if (!regions) return;
        for (const region of regions) {
            for (let i = 0; i < region.len; i++) {
                if (region.src + i < view.length && region.dst + i < view.length) {
                    view[region.dst + i] = view[region.src + i];
                }
            }
        }
    }

    /**
     * Write GS checksum 2 (sum of all backup region bytes).
     */
    _writeGSChecksum2(view) {
        const regions = GEN2_BACKUP_REGIONS['gs-int'];
        if (!regions) return;
        let sum = 0;
        for (const region of regions) {
            for (let i = 0; i < region.len; i++) {
                if (region.dst + i < view.length) {
                    sum += view[region.dst + i];
                }
            }
        }
        const checksum2 = (sum & 0xFFFF) >>> 0;
        const storeOffset = 0x7E6D;
        view[storeOffset] = checksum2 & 0xFF;
        view[storeOffset + 1] = (checksum2 >> 8) & 0xFF;
    }

    _writeBackupRegions(view, gameVariant = 'gs-int') {
        // Already handled in _writeChecksums for both GS and Crystal
    }
}
