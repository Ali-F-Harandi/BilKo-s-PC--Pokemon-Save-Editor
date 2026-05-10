/**
 * writer.js — Gen 1 Save File Writer
 *
 * Ported from lib/writer/gen1.ts
 * Takes a ParsedSave object and produces a binary Uint8Array for export.
 */

import { GEN1_OFFSETS, GEN1_INTERNAL_TO_DEX } from '../data/offsets.js';
import { BinaryWriter } from './io.js';

// Reverse map: National Dex ID -> Internal ID
const DEX_TO_INTERNAL = {};
GEN1_INTERNAL_TO_DEX.forEach((dex, internal) => {
  if (dex !== 0) DEX_TO_INTERNAL[dex] = internal;
});

// Helper: Write Pokedex Flags
function writePokedexFlags(writer, flags) {
  // Gen 1 uses 19 bytes (152 bits)
  for (let i = 0; i < 19; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const dexNum = (i * 8) + bit;
      if (flags[dexNum] === true) {
        byte |= (1 << bit);
      }
    }
    writer.u8(byte);
  }
}

// Helper: Write Event Flags
function writeEventFlags(writer, flags) {
  for (let i = 0; i < 32; i++) { // 32 bytes
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const flagIndex = (i * 8) + bit;
      if (flags[flagIndex] === true) {
        byte |= (1 << bit);
      }
    }
    writer.u8(byte);
  }
}

// Helper: Write Items
function writeItems(writer, items, maxCapacity) {
  writer.u8(items.length); // Item Count

  for (let i = 0; i < items.length && i < maxCapacity; i++) {
    writer.u8(items[i].id);
    writer.u8(items[i].count);
  }
  writer.u8(0xFF); // Terminator
}

// Helper: Write Pokemon Structure
function writePokemonStruct(writer, mon, isParty) {
  const startPos = writer.tell();

  const internalId = DEX_TO_INTERNAL[mon.dexId] || 1;
  writer.u8(internalId);

  const currentHp = Math.min(mon.hp, mon.maxHp);
  writer.u16be(currentHp);
  writer.u8(mon.level);

  // Status (04)
  writer.u8(0);

  // Types (05, 06)
  writer.u8(mon.type1);
  writer.u8(mon.type2);

  // Catch Rate (07)
  writer.u8(mon.catchRate);

  // Moves (08-0B)
  for (let i = 0; i < 4; i++) {
    writer.u8(mon.moveIds[i] || 0);
  }

  // OT ID (0C-0D)
  writer.u16be(mon.originalTrainerId);

  // Exp (0E-10)
  writer.u24be(mon.exp);

  // EV/Stat Exp (11-1A)
  writer.u16be(mon.ev.hp);
  writer.u16be(mon.ev.attack);
  writer.u16be(mon.ev.defense);
  writer.u16be(mon.ev.speed);
  writer.u16be(mon.ev.special);

  // DVs (1B-1C)
  const ivByte1 = ((mon.iv.attack & 0xF) << 4) | (mon.iv.defense & 0xF);
  const ivByte2 = ((mon.iv.speed & 0xF) << 4) | (mon.iv.special & 0xF);
  writer.u8(ivByte1);
  writer.u8(ivByte2);

  // PP (1D-20)
  for (let i = 0; i < 4; i++) {
    const ppVal = (mon.movePp[i] & 0x3F) | ((mon.movePpUps[i] & 0x3) << 6);
    writer.u8(ppVal);
  }

  if (isParty) {
    // Party Specifics (Level, Stats) - Offset 33
    writer.u8(mon.level);
    writer.u16be(mon.maxHp);
    writer.u16be(mon.attack);
    writer.u16be(mon.defense);
    writer.u16be(mon.speed);
    writer.u16be(mon.special);
  }
}

// Helper: Write a full Box
function writeBox(writer, boxPokemon) {
  // 1. Count
  writer.u8(boxPokemon.length);

  // 2. Species List
  for (const p of boxPokemon) {
    const internal = DEX_TO_INTERNAL[p.dexId] || 1;
    writer.u8(internal);
  }
  writer.u8(0xFF); // Terminator

  // Padding for Species List
  const bytesWritten = 1 + boxPokemon.length + 1;
  const paddingNeeded = 0x16 - bytesWritten;
  for (let k = 0; k < paddingNeeded; k++) writer.u8(0);

  // 3. Pokemon Structs
  // Relative Offset 0x16
  for (let i = 0; i < 20; i++) { // Always write 20 slots space
    if (i < boxPokemon.length) {
      writePokemonStruct(writer, boxPokemon[i], false);
    } else {
      // Write Empty Struct (33 bytes)
      for (let j = 0; j < 33; j++) writer.u8(0);
    }
  }

  // 4. OT Names (11 bytes * 20)
  for (let i = 0; i < 20; i++) {
    if (i < boxPokemon.length) {
      writer.string(boxPokemon[i].originalTrainerName, 11);
    } else {
      for (let j = 0; j < 11; j++) writer.u8(0x50);
    }
  }

  // 5. Nicknames (11 bytes * 20)
  for (let i = 0; i < 20; i++) {
    if (i < boxPokemon.length) {
      writer.string(boxPokemon[i].nickname, 11);
    } else {
      for (let j = 0; j < 11; j++) writer.u8(0x50);
    }
  }
}

function calculateChecksum(buffer, start, end) {
  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += buffer[i];
  }
  return (~sum) & 0xFF;
}

/**
 * Creates a standard .pk1 binary (69 bytes)
 * Format: 3 Bytes Padding + 44 Bytes (Party Struct) + 11 Bytes (OT) + 11 Bytes (Nickname)
 * This format ensures compatibility with PKHeX and other tools.
 */
export function createPk1Binary(mon) {
  const writer = new BinaryWriter(69);

  // 1. Write Header/Padding (3 bytes)
  writer.u8(0); writer.u8(0); writer.u8(0);

  // 2. Write Struct (Force Party Format = 44 bytes to include stats)
  // Starts at offset 3
  writePokemonStruct(writer, mon, true);

  // 3. Write OT Name (11 bytes) - Offset 44 + 3 = 47
  writer.seek(47);
  writer.string(mon.originalTrainerName, 11);

  // 4. Write Nickname (11 bytes) - Offset 55 + 3 = 58
  writer.seek(58);
  writer.string(mon.nickname, 11);

  return writer.getBuffer();
}

/**
 * Write a Gen 1 save file from parsed data.
 * @param {Object} save - ParsedSave object
 * @returns {Uint8Array}
 */
export function writeGen1Save(save) {
  // Clone raw data
  const writer = new BinaryWriter(new Uint8Array(save.rawData));

  // --- MAIN DATA BANK (Bank 1) ---

  // 1. Trainer Name
  writer.seek(GEN1_OFFSETS.PLAYER_NAME);
  writer.string(save.trainer.name, 11);

  // 2. Pokedex Flags
  writer.seek(GEN1_OFFSETS.POKEDEX_OWNED);
  writePokedexFlags(writer, save.pokedexOwnedFlags);

  writer.seek(GEN1_OFFSETS.POKEDEX_SEEN);
  writePokedexFlags(writer, save.pokedexSeenFlags);

  // 3. Event Flags
  if (save.eventFlags && save.eventFlags.length > 0) {
    writer.seek(GEN1_OFFSETS.MISSABLE_OBJECTS);
    writeEventFlags(writer, save.eventFlags);
  }

  // 4. Inventory (Bag)
  writer.seek(GEN1_OFFSETS.ITEM_BAG);
  writeItems(writer, save.items, 20);

  // 5. Money & Coins
  writer.seek(GEN1_OFFSETS.MONEY);
  writer.bcd(save.trainer.money, 3);

  writer.seek(GEN1_OFFSETS.CASINO_COINS);
  writer.bcd(save.trainer.coins, 2);

  // 6. Trainer ID
  writer.seek(GEN1_OFFSETS.PLAYER_ID);
  writer.u16be(parseInt(save.trainer.id));

  // 7. PC Items
  writer.seek(GEN1_OFFSETS.PC_ITEMS);
  writeItems(writer, save.pcItems, 50);

  // 8. Current Box ID
  writer.seek(GEN1_OFFSETS.CURRENT_BOX_ID);
  writer.u8((save.currentBoxId & 0x7F) | 0x80);

  // 9. Party Pokemon
  writer.seek(GEN1_OFFSETS.PARTY_DATA);
  writer.u8(save.party.length);
  for (const p of save.party) {
    const internal = DEX_TO_INTERNAL[p.dexId] || 1;
    writer.u8(internal);
  }
  writer.u8(0xFF);

  // Jump to structs (Party Data + 8)
  writer.seek(GEN1_OFFSETS.PARTY_DATA + 8);
  for (let i = 0; i < 6; i++) {
    if (i < save.party.length) {
      writePokemonStruct(writer, save.party[i], true);
    } else {
      // Fill empty slots with 0
      for (let j = 0; j < 44; j++) writer.u8(0);
    }
  }

  // Party OT Names
  // Party Data Start + 8 + (6 * 44)
  writer.seek(GEN1_OFFSETS.PARTY_DATA + 8 + (6 * 44));
  for (let i = 0; i < 6; i++) {
    if (i < save.party.length) {
      writer.string(save.party[i].originalTrainerName, 11);
    } else {
      for (let j = 0; j < 11; j++) writer.u8(0x50);
    }
  }

  // Party Nicknames
  // Party Data Start + 8 + (6 * 44) + (6 * 11)
  writer.seek(GEN1_OFFSETS.PARTY_DATA + 8 + (6 * 44) + (6 * 11));
  for (let i = 0; i < 6; i++) {
    if (i < save.party.length) {
      writer.string(save.party[i].nickname, 11);
    } else {
      for (let j = 0; j < 11; j++) writer.u8(0x50);
    }
  }

  // --- EXTERNAL BANKS (PC BOXES) ---

  // Bank 2 (Boxes 1-6)
  const BANK2_START = 0x4000;
  const BANK2_CHKSUM_ALL = 0x5A4C;
  const BANK2_CHKSUM_INDIV = 0x5A4D;
  const BANK2_END_DATA = 0x5A52;

  // Bank 3 (Boxes 7-12)
  const BANK3_START = 0x6000;
  const BANK3_CHKSUM_ALL = 0x7A4C;
  const BANK3_CHKSUM_INDIV = 0x7A4D;
  const BANK3_END_DATA = 0x7A52;

  const buffer = writer.getBuffer();

  for (let i = 0; i < 12; i++) {
    let boxOffset = 0;
    let isBank2 = i < 6;

    if (isBank2) boxOffset = GEN1_OFFSETS.PC_BANK_2_START + (i * GEN1_OFFSETS.BOX_STRUCT_SIZE);
    else boxOffset = GEN1_OFFSETS.PC_BANK_3_START + ((i - 6) * GEN1_OFFSETS.BOX_STRUCT_SIZE);

    const boxMons = save.pcBoxes[i] || [];

    writer.seek(boxOffset);
    writeBox(writer, boxMons);

    // Copy to Current Box Data Area (RAM cache) if active
    if (i === save.currentBoxId) {
      writer.seek(GEN1_OFFSETS.CURRENT_BOX_DATA);
      writeBox(writer, boxMons);
    }

    // Calculate Individual Checksum
    const boxChecksum = calculateChecksum(buffer, boxOffset, boxOffset + GEN1_OFFSETS.BOX_STRUCT_SIZE - 1);

    if (isBank2) {
      writer.seek(BANK2_CHKSUM_INDIV + i);
      writer.u8(boxChecksum);
    } else {
      writer.seek(BANK3_CHKSUM_INDIV + (i - 6));
      writer.u8(boxChecksum);
    }
  }

  // Bank 2 Checksum
  let b2Sum = 0;
  for (let j = BANK2_START; j <= BANK2_END_DATA; j++) {
    if (j !== BANK2_CHKSUM_ALL) b2Sum += buffer[j];
  }
  writer.seek(BANK2_CHKSUM_ALL);
  writer.u8((~b2Sum) & 0xFF);

  // Bank 3 Checksum
  let b3Sum = 0;
  for (let j = BANK3_START; j <= BANK3_END_DATA; j++) {
    if (j !== BANK3_CHKSUM_ALL) b3Sum += buffer[j];
  }
  writer.seek(BANK3_CHKSUM_ALL);
  writer.u8((~b3Sum) & 0xFF);

  // Main Checksum
  const mainChecksum = calculateChecksum(buffer, GEN1_OFFSETS.PLAYER_NAME, 0x3522);
  writer.seek(GEN1_OFFSETS.CHECKSUM);
  writer.u8(mainChecksum);

  return buffer;
}
