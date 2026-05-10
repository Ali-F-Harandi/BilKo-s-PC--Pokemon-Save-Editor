/**
 * Gen2Writer.js — Generation II Save File Writer
 *
 * Writes CanonicalSaveFile data back to Gen 2 binary format.
 * Updates both checksums after writing.
 *
 * The writer takes a CanonicalSaveFile, converts it to the Gen 2 binary
 * layout, and recalculates checksums for both save regions.
 */

import { GEN2_OFFSETS, GEN2_PARTY_STRUCT, GEN2_BOX_STRUCT, GEN2_INTERNAL_TO_DEX, GEN2_EGG_SPECIES_ID } from './constants.js';
import { encodeGen2Text } from './textCodec.js';
import { GEN2_POKEMON_NAMES } from './data/pokemonData.js';
import { GEN2_ITEM_NAMES } from './data/itemData.js';

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

        // Write trainer info
        this._writeTrainer(view, canonicalSave);

        // Write party
        this._writeParty(view, canonicalSave);

        // Write PC boxes
        this._writeBoxes(view, canonicalSave);

        // Write items
        this._writeItems(view, canonicalSave);

        // Recalculate and write checksums
        this._writeChecksums(view);

        return view;
    }

    /**
     * Create a .pk2 binary from a CanonicalPokemon.
     * @param {import('../../core/CanonicalModel.js').CanonicalPokemon} pokemon - Canonical Pokemon data
     * @returns {Uint8Array}
     */
    createPk2(pokemon) {
        // PK2 format: 48-byte party struct + 11-byte OT name + 11-byte nickname = 70 bytes
        const buffer = new Uint8Array(70);

        this._writePokemonStruct(buffer, 0, pokemon, true);
        this._writeText(buffer, 48, pokemon.otName || '', 11);
        this._writeText(buffer, 59, pokemon.nickname || '', 11);

        return buffer;
    }

    // ================================================================
    // ---- PRIVATE WRITE METHODS ----
    // ================================================================

    /**
     * Write trainer info to the save buffer.
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

        // Money (BCD)
        const money = Math.min(trainer.money || 0, 999999);
        this._writeBCD(view, GEN2_OFFSETS.MONEY, money, 3);

        // Player ID (big-endian)
        const id = parseInt(trainer.id) || 0;
        view[GEN2_OFFSETS.PLAYER_ID] = (id >> 8) & 0xFF;
        view[GEN2_OFFSETS.PLAYER_ID + 1] = id & 0xFF;

        // Badges
        const totalBadges = Math.min(trainer.badges || 0, 16);
        view[GEN2_OFFSETS.BADGES] = totalBadges & 0xFF; // Johto badges
        view[GEN2_OFFSETS.BADGES + 1] = (totalBadges > 8) ? (totalBadges - 8) & 0xFF : 0; // Kanto badges

        // Party count
        const partyCount = save.party ? save.party.length : 0;
        view[GEN2_OFFSETS.PARTY_COUNT] = partyCount;

        // Current box
        view[GEN2_OFFSETS.CURRENT_BOX] = (save.currentBoxId || 0) & 0x7F;

        // Gender (Crystal)
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
     * Write PC boxes.
     * @private
     */
    _writeBoxes(view, save) {
        const boxes = save.pcBoxes || [];
        const currentBoxId = save.currentBoxId || 0;

        // This is simplified - a full implementation would need to
        // properly lay out boxes across the two bank regions
        // For now, write the current box data
        for (let boxIdx = 0; boxIdx < Math.min(boxes.length, 14); boxIdx++) {
            const box = boxes[boxIdx] || [];
            let boxOffset;

            if (boxIdx === currentBoxId) {
                boxOffset = GEN2_OFFSETS.CURRENT_BOX_DATA;
            } else {
                // Calculate offset in banks
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
                view[speciesStart + i] = boxPokemon[i].speciesId || 0;
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
     * @private
     * @param {Uint8Array} view - Target buffer
     * @param {number} offset - Start offset
     * @param {Object} pokemon - CanonicalPokemon data
     * @param {boolean} isParty - Whether this is a party Pokemon (48 bytes) or box (32 bytes)
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
        this._writeUInt16BE(view, offset + struct.SPC_EV, evs.special || 0);

        // DVs (2 bytes packed)
        const ivs = pokemon.ivs || {};
        const atkDv = (ivs.attack || 0) & 0xF;
        const defDv = (ivs.defense || 0) & 0xF;
        const spdDv = (ivs.speed || 0) & 0xF;
        const spcDv = (ivs.special || ivs.spAttack || 0) & 0xF;
        view[offset + struct.DVS] = (atkDv << 4) | defDv;
        view[offset + struct.DVS + 1] = (spdDv << 4) | spcDv;

        // Pokerus
        view[offset + struct.POKERUS] = pokemon.genExtension?.pokerus || 0;

        // Friendship
        view[offset + struct.FRIENDSHIP] = pokemon.genExtension?.friendship || 0;

        // Egg Steps
        const eggSteps = pokemon.genExtension?.eggSteps || 0;
        this._writeUInt16BE(view, offset + struct.EGG_STEPS, eggSteps);

        // Party-only fields
        if (isParty) {
            const stats = pokemon.stats || {};
            view[offset + GEN2_PARTY_STRUCT.LEVEL] = pokemon.level || 1;

            // Status
            const statusMap = { 'OK': 0, 'SLP': 0x07, 'PSN': 0x08, 'BRN': 0x10, 'FRZ': 0x20, 'PAR': 0x40, 'TOX': 0x08 };
            view[offset + GEN2_PARTY_STRUCT.STATUS] = statusMap[pokemon.status] || 0;

            // Stats (2 bytes big-endian each)
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
     * Write a BCD value.
     * @private
     */
    _writeBCD(view, offset, value, numBytes) {
        for (let i = numBytes - 1; i >= 0; i--) {
            const byteVal = value % 100;
            view[offset + i] = ((Math.floor(byteVal / 10) << 4) | (byteVal % 10));
            value = Math.floor(value / 100);
        }
    }

    /**
     * Recalculate and write both checksums.
     * @private
     */
    _writeChecksums(view) {
        // Checksum 1: complement of sum of bytes from CHECKSUM_1_START to CHECKSUM_1_END
        let sum1 = 0;
        for (let i = GEN2_OFFSETS.CHECKSUM_1_START; i <= GEN2_OFFSETS.CHECKSUM_1_END; i++) {
            sum1 += view[i];
        }
        const checksum1 = ((~sum1) & 0xFFFF) >>> 0;
        view[GEN2_OFFSETS.CHECKSUM_1] = checksum1 & 0xFF;
        view[GEN2_OFFSETS.CHECKSUM_1 + 1] = (checksum1 >> 8) & 0xFF;

        // Checksum 2: complement of sum of bytes from CHECKSUM_2_START to CHECKSUM_2_END
        let sum2 = 0;
        for (let i = GEN2_OFFSETS.CHECKSUM_2_START; i <= GEN2_OFFSETS.CHECKSUM_2_END; i++) {
            sum2 += view[i];
        }
        const checksum2 = ((~sum2) & 0xFFFF) >>> 0;
        view[GEN2_OFFSETS.CHECKSUM_2] = checksum2 & 0xFF;
        view[GEN2_OFFSETS.CHECKSUM_2 + 1] = (checksum2 >> 8) & 0xFF;
    }
}
