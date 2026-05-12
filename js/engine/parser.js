/**
 * parser.js — Gen 1 Save File Parser
 *
 * Ported from lib/parser/index.ts
 * Reads binary .sav/.srm files and produces ParsedSave objects.
 */

import { decodeText } from './textDecoder.js';
import {
  getUInt16BigEndian,
  getUInt24BigEndian,
  parseBCD,
  countSetBits,
  decodeStatus,
  getAsciiString
} from './byteHelpers.js';
import { GEN1_OFFSETS, GEN1_INTERNAL_TO_DEX } from '../data/offsets.js';
import { getPokemonName } from '../data/pokemonNames.js';
import { getTypeName } from '../data/pokemonTypes.js';
import { getMoveName } from '../data/moves.js';
import { getItemName } from '../data/items.js';
import { getPokemonTypes } from '../data/pokemonTypes.js';
import { GEN1_BASE_STATS } from '../data/baseStats.js';
import { calculateGen1Stat } from './statCalculator.js';

// --- Gen 1 Parsing Logic (Consolidated) ---

function getPokedexFlags(data, start) {
  const flags = [];
  flags.push(false);

  for (let i = 0; i < 152; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;

    if (byteIndex < 19) {
      const byte = data[start + byteIndex];
      flags.push((byte & (1 << bitIndex)) !== 0);
    } else {
      flags.push(false);
    }
  }
  return flags;
}

function getEventFlags(data, start) {
  const flags = [];
  // Gen 1 Missable Objects array is 32 bytes (256 bits)
  for (let i = 0; i < 256; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;
    const byte = data[start + byteIndex];
    flags.push((byte & (1 << bitIndex)) !== 0);
  }
  return flags;
}

function parseItems(view, startOffset, maxCapacity = 20) {
  const count = view[startOffset];
  const items = [];

  let currentOffset = startOffset + 1;
  for (let i = 0; i < count && i < maxCapacity; i++) {
    const itemId = view[currentOffset];
    const quantity = view[currentOffset + 1];

    if (itemId === 0xFF) break;

    items.push({
      id: itemId,
      name: getItemName(itemId),
      count: quantity
    });

    currentOffset += 2;
  }
  return items;
}

function parsePokemonStruct(
  view,
  offset,
  isParty,
  nickname,
  otName,
  nicknameRaw,
  otNameRaw
) {
  const speciesId = view[offset];
  const dexId = GEN1_INTERNAL_TO_DEX[speciesId] || 0;

  const catchRate = view[offset + 0x07];

  const moveIds = [
    view[offset + 8],
    view[offset + 9],
    view[offset + 10],
    view[offset + 11]
  ];

  const moves = moveIds.map(id => getMoveName(id));

  const pps = [
    view[offset + 29] & 0x3F,
    view[offset + 30] & 0x3F,
    view[offset + 31] & 0x3F,
    view[offset + 32] & 0x3F
  ];

  const ppUps = [
    view[offset + 29] >> 6,
    view[offset + 30] >> 6,
    view[offset + 31] >> 6,
    view[offset + 32] >> 6
  ];

  const originalTrainerId = getUInt16BigEndian(view, offset + 0x0C);

  const hpEv = getUInt16BigEndian(view, offset + 0x11);
  const atkEv = getUInt16BigEndian(view, offset + 0x13);
  const defEv = getUInt16BigEndian(view, offset + 0x15);
  const spdEv = getUInt16BigEndian(view, offset + 0x17);
  const spcEv = getUInt16BigEndian(view, offset + 0x19);

  const ivByte1 = view[offset + 0x1B];
  const ivByte2 = view[offset + 0x1C];

  const atkIv = (ivByte1 >> 4) & 0xF;
  const defIv = ivByte1 & 0xF;
  const spdIv = (ivByte2 >> 4) & 0xF;
  const spcIv = ivByte2 & 0xF;
  const hpIv = ((atkIv & 1) << 3) | ((defIv & 1) << 2) | ((spdIv & 1) << 1) | (spcIv & 1);

  let currentHp = 0;
  let maxHp = 0;
  let attack = 0;
  let defense = 0;
  let speed = 0;
  let special = 0;

  let level = view[offset + 0x03];

  if (isParty) {
    const partyLevel = view[offset + 33];
    if (partyLevel > 0) {
      level = partyLevel;
    }
    currentHp = getUInt16BigEndian(view, offset + 1);
    maxHp = getUInt16BigEndian(view, offset + 34);
    attack = getUInt16BigEndian(view, offset + 36);
    defense = getUInt16BigEndian(view, offset + 38);
    speed = getUInt16BigEndian(view, offset + 40);
    special = getUInt16BigEndian(view, offset + 42);
  } else {
    currentHp = getUInt16BigEndian(view, offset + 1);
    // For Box Pokemon, stats are not stored. We must calculate them using Base Stats + IVs + EVs.
    const base = GEN1_BASE_STATS[dexId];
    if (base) {
      maxHp = calculateGen1Stat(base.hp, hpIv, hpEv, level, true);
      attack = calculateGen1Stat(base.atk, atkIv, atkEv, level, false);
      defense = calculateGen1Stat(base.def, defIv, defEv, level, false);
      speed = calculateGen1Stat(base.spe, spdIv, spdEv, level, false);
      special = calculateGen1Stat(base.spc, spcIv, spcEv, level, false);
    } else {
      maxHp = currentHp;
    }
  }

  const structSize = isParty ? 44 : 33;

  return {
    pid: 0,
    speciesId,
    dexId,
    speciesName: getPokemonName(dexId),
    nickname,
    isNicknamed: nickname !== getPokemonName(dexId),
    form: 0,
    originalTrainerName: otName,
    originalTrainerId,
    secretId: 0,
    originalTrainerGender: 'Male',
    level,
    exp: getUInt24BigEndian(view, offset + 14),
    friendship: 0,
    hp: currentHp,
    maxHp,
    attack,
    defense,
    speed,
    special,
    spAtk: special,
    spDef: special,
    type1: view[offset + 5],
    type2: view[offset + 6],
    type1Name: getTypeName(view[offset + 5]),
    type2Name: getTypeName(view[offset + 6]),
    status: decodeStatus(view[offset + 4]),
    catchRate: catchRate,
    moves,
    moveIds,
    movePp: pps,
    movePpUps: ppUps,
    isParty,
    isEgg: false,
    isShiny: false,
    gender: 'Genderless',
    pokerus: 0,

    iv: { hp: hpIv, attack: atkIv, defense: defIv, speed: spdIv, special: spcIv, spAtk: spcIv, spDef: spcIv },
    ev: { hp: hpEv, attack: atkEv, defense: defEv, speed: spdEv, special: spcEv, spAtk: spcEv, spDef: spcEv },

    raw: view.slice(offset, offset + structSize),
    startOffset: offset,
    nicknameRaw: nicknameRaw.slice(0),
    otNameRaw: otNameRaw.slice(0)
  };
}

function parseBox(view, boxStart) {
  const boxPokemon = [];
  const boxCount = view[boxStart];

  if (boxCount > 20) return [];

  const boxStructSize = GEN1_OFFSETS.BOX_MON_SIZE;
  const boxStructsStart = boxStart + 0x16;
  const boxOtNamesStart = boxStructsStart + (20 * boxStructSize);
  const boxNicknamesStart = boxOtNamesStart + (20 * 11);

  for (let i = 0; i < boxCount; i++) {
    const currentStruct = boxStructsStart + (i * boxStructSize);
    const currentNickOffset = boxNicknamesStart + (i * 11);
    const currentOtOffset = boxOtNamesStart + (i * 11);

    const nickname = decodeText(view, currentNickOffset, 11);
    const otName = decodeText(view, currentOtOffset, 11);

    const nicknameRaw = view.slice(currentNickOffset, currentNickOffset + 11);
    const otNameRaw = view.slice(currentOtOffset, currentOtOffset + 11);

    const pokemon = parsePokemonStruct(view, currentStruct, false, nickname, otName, nicknameRaw, otNameRaw);

    boxPokemon.push(pokemon);
  }
  return boxPokemon;
}

function parseDaycare(view) {
  const inUse = view[GEN1_OFFSETS.DAYCARE_IN_USE];
  if (inUse === 0) return undefined;

  const nickname = decodeText(view, GEN1_OFFSETS.DAYCARE_NAME, 11);
  const otName = decodeText(view, GEN1_OFFSETS.DAYCARE_OT, 11);
  const nicknameRaw = view.slice(GEN1_OFFSETS.DAYCARE_NAME, GEN1_OFFSETS.DAYCARE_NAME + 11);
  const otNameRaw = view.slice(GEN1_OFFSETS.DAYCARE_OT, GEN1_OFFSETS.DAYCARE_OT + 11);

  return parsePokemonStruct(
    view,
    GEN1_OFFSETS.DAYCARE_MON,
    false,
    nickname,
    otName,
    nicknameRaw,
    otNameRaw
  );
}

function parseOptions(view) {
  const byte = view[GEN1_OFFSETS.OPTIONS];
  const battleAnimation = (byte & 0x80) ? 'Off' : 'On';
  const battleStyle = (byte & 0x40) ? 'Set' : 'Shift';
  const speedBits = byte & 0x7;
  let textSpeed = 'Normal';
  if (speedBits === 1) textSpeed = 'Fast';
  if (speedBits === 5) textSpeed = 'Slow';

  const soundBits = (byte >> 4) & 0x3;
  let sound = 'Mono';
  if (soundBits === 0) sound = 'Mono';
  else if (soundBits === 1) sound = 'Earphone1';
  else if (soundBits === 2) sound = 'Earphone2';
  else if (soundBits === 3) sound = 'Earphone3';

  if (speedBits !== 0 && soundBits === 1) sound = 'Stereo';

  return { textSpeed, battleAnimation, battleStyle, sound };
}

function parseHallOfFame(view) {
  const teams = [];
  const hofStart = 0x0598;
  const structSize = 16;
  const monsPerTeam = 6;
  const maxTeams = 50;

  for (let i = 0; i < maxTeams; i++) {
    const teamMons = [];

    for (let j = 0; j < monsPerTeam; j++) {
      const offset = hofStart + (i * monsPerTeam * structSize) + (j * structSize);
      const speciesId = view[offset];
      const dexId = GEN1_INTERNAL_TO_DEX[speciesId] || 0;

      if (speciesId === 0 || speciesId === 0xFF || dexId === 0) continue;

      const level = view[offset + 1];
      const nickname = decodeText(view, offset + 2, 10);
      const speciesName = getPokemonName(dexId);
      const finalNickname = (nickname && nickname.trim()) ? nickname : speciesName;

      teamMons.push({ speciesId, dexId, speciesName, nickname: finalNickname, level, types: getPokemonTypes(dexId) });
    }

    if (teamMons.length > 0) {
      teams.push({ id: i + 1, pokemon: teamMons });
    } else {
      break;
    }
  }
  return teams.reverse();
}

function detectGameVersion(view, filename) {
  const potentialHeaderOffsets = [0x30, 0x134];
  for (const offset of potentialHeaderOffsets) {
    if (view.byteLength < offset + 16) continue;
    const title = getAsciiString(view, offset, 16).toUpperCase();
    if (title.startsWith("POKEMON")) {
      if (title.includes("RED")) return 'Red';
      if (title.includes("BLUE")) return 'Blue';
      if (title.includes("YELL")) return 'Yellow';
    }
  }
  const pikachuFriendship = view[GEN1_OFFSETS.PIKACHU_FRIENDSHIP];
  if (pikachuFriendship > 0) return 'Yellow';
  if (filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('yellow')) return 'Yellow';
    if (lower.includes('red')) return 'Red';
    if (lower.includes('blue')) return 'Blue';
  }
  return 'Red';
}

function validateGen1Checksum(view) {
  let sum = 0;
  for (let i = GEN1_OFFSETS.PLAYER_NAME; i <= 0x3522; i++) {
    sum += view[i];
  }
  const calculated = (~sum) & 0xFF;
  const actual = view[GEN1_OFFSETS.CHECKSUM];
  return calculated === actual;
}

function parseGen1Save(buffer, filename = "save.sav") {
  const view = buffer;
  const isValid = validateGen1Checksum(view);
  const name = decodeText(view, GEN1_OFFSETS.PLAYER_NAME, 11);
  const rivalName = decodeText(view, GEN1_OFFSETS.RIVAL_NAME, 11);
  const id = getUInt16BigEndian(view, GEN1_OFFSETS.PLAYER_ID).toString().padStart(5, '0');
  const money = parseBCD(view, GEN1_OFFSETS.MONEY, 3);
  const coins = parseBCD(view, GEN1_OFFSETS.CASINO_COINS, 2);
  const pikachuFriendship = view[GEN1_OFFSETS.PIKACHU_FRIENDSHIP];
  const hours = view[GEN1_OFFSETS.PLAY_TIME];
  const minutes = view[GEN1_OFFSETS.PLAY_TIME + 2];
  const playTime = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  const badges = view[GEN1_OFFSETS.BADGES];

  const pokedexOwned = countSetBits(view, GEN1_OFFSETS.POKEDEX_OWNED, 19);
  const pokedexSeen = countSetBits(view, GEN1_OFFSETS.POKEDEX_SEEN, 19);
  const pokedexOwnedFlags = getPokedexFlags(view, GEN1_OFFSETS.POKEDEX_OWNED);
  const pokedexSeenFlags = getPokedexFlags(view, GEN1_OFFSETS.POKEDEX_SEEN);
  const eventFlags = getEventFlags(view, GEN1_OFFSETS.MISSABLE_OBJECTS);

  const gameVersion = detectGameVersion(view, filename);
  const options = parseOptions(view);
  const daycare = parseDaycare(view);
  const playerStarterId = GEN1_INTERNAL_TO_DEX[view[GEN1_OFFSETS.PLAYER_STARTER]] || 0;
  const rivalStarterId = GEN1_INTERNAL_TO_DEX[view[GEN1_OFFSETS.RIVAL_STARTER]] || 0;

  const mapData = {
    currentMapId: view[GEN1_OFFSETS.CURRENT_MAP],
    x: view[GEN1_OFFSETS.X_COORD],
    y: view[GEN1_OFFSETS.Y_COORD],
    lastMapId: view[GEN1_OFFSETS.LAST_MAP],
    warpedFromMap: view[GEN1_OFFSETS.WARPED_FROM_MAP]
  };

  const partyCount = view[GEN1_OFFSETS.PARTY_DATA];
  const party = [];
  const partyStart = GEN1_OFFSETS.PARTY_DATA;
  const partyStructSize = GEN1_OFFSETS.PARTY_MON_SIZE;
  const partyStructsStart = partyStart + 8;
  const partyOtNamesStart = partyStructsStart + (6 * partyStructSize);
  const partyNicknamesStart = partyOtNamesStart + (6 * 11);

  for (let i = 0; i < partyCount; i++) {
    const currentStruct = partyStructsStart + (i * partyStructSize);
    const currentNickOffset = partyNicknamesStart + (i * 11);
    const currentOtOffset = partyOtNamesStart + (i * 11);
    const nickname = decodeText(view, currentNickOffset, 11);
    const otName = decodeText(view, currentOtOffset, 11);
    const nicknameRaw = view.slice(currentNickOffset, currentNickOffset + 11);
    const otNameRaw = view.slice(currentOtOffset, currentOtOffset + 11);

    party.push(parsePokemonStruct(view, currentStruct, true, nickname, otName, nicknameRaw, otNameRaw));
  }

  const currentBoxId = view[GEN1_OFFSETS.CURRENT_BOX_ID] & 0x7F;
  const allBoxes = [];
  for (let i = 0; i < 12; i++) {
    let boxOffset = 0;
    if (i < 6) boxOffset = GEN1_OFFSETS.PC_BANK_2_START + (i * GEN1_OFFSETS.BOX_STRUCT_SIZE);
    else boxOffset = GEN1_OFFSETS.PC_BANK_3_START + ((i - 6) * GEN1_OFFSETS.BOX_STRUCT_SIZE);
    allBoxes.push(parseBox(view, boxOffset));
  }
  allBoxes[currentBoxId] = parseBox(view, GEN1_OFFSETS.CURRENT_BOX_DATA);

  const bagItems = parseItems(view, GEN1_OFFSETS.ITEM_BAG, 20);
  const pcItems = parseItems(view, GEN1_OFFSETS.PC_ITEMS, 50);
  const hallOfFame = parseHallOfFame(view);

  return {
    generation: 1,
    gameVersion: gameVersion,
    originalFilename: filename,
    fileSize: view.length,
    isValid: isValid,
    trainer: { name, id, money, coins, playTime, badges, rivalName, pikachuFriendship, gender: 'Male' },
    options,
    map: mapData,
    daycare: daycare ? [daycare] : [],
    playerStarterId,
    rivalStarterId,
    pokedexOwned, pokedexSeen, pokedexOwnedFlags, pokedexSeenFlags,
    eventFlags,
    partyCount,
    party,
    currentBoxId,
    currentBoxCount: allBoxes[currentBoxId].length,
    currentBoxPokemon: allBoxes[currentBoxId],
    pcBoxes: allBoxes,
    hallOfFame,
    items: bagItems,
    pcItems,
    rawData: view
  };
}

/**
 * Parses a standalone .pk1 file.
 * Supports:
 * - 66 bytes: Raw data (44 struct + 11 OT + 11 Nick)
 * - 69 bytes: PKHeX format (3 padding + 66 data)
 */
export function parsePk1(buffer) {
  let view = buffer;

  // Handle 69-byte file (Header/Padding usually 0x00 0x00 0x00)
  // The actual data starts at index 3.
  if (buffer.length === 69) {
    view = buffer.slice(3); // Strip first 3 bytes
  }
  else if (buffer.length !== 66) {
    console.error("Invalid .pk1 size", buffer.length);
    return null;
  }

  // After stripping, view should be 66 bytes.
  // 0-43: Pokemon Struct (44 bytes)
  // 44-54: OT Name (11 bytes)
  // 55-65: Nickname (11 bytes)

  const otNameOffset = 44;
  const nickOffset = 55;

  const otName = decodeText(view, otNameOffset, 11);
  const nickname = decodeText(view, nickOffset, 11);
  const otRaw = view.slice(otNameOffset, otNameOffset + 11);
  const nickRaw = view.slice(nickOffset, nickOffset + 11);

  // Treat as Party Mon (isParty=true) to parse stats if present
  return parsePokemonStruct(view, 0, true, nickname, otName, nickRaw, otRaw);
}

// --- Main Parser Entry ---

// Gen 2 checksum validation (fixed: uses plain 16-bit sum, NOT complement)
// Gold/Silver and Crystal have DIFFERENT checksum positions and ranges.
// Reference: pokecrystal disassembly, PKHeX SAV2.cs, Bulbapedia
function validateGen2Checksum(view) {
  // Try all known Gen 2 checksum configurations
  // Return true if ANY configuration validates successfully
  // Also validate PokeList format at known offsets for extra confidence

  // International Gold/Silver: sum 0x2009-0x2D68, checksum at 0x2D69 (LE)
  if (validateGen2ChecksumRange(view, 0x2009, 0x2D68, 0x2D69)) {
    // Also check PokeList: party count at 0x288A should be <= 6
    // and species list should be terminated with 0xFF
    if (isPokeListValid(view, 0x288A, 6)) return true;
  }

  // International Crystal: sum 0x2009-0x2B82, checksum at 0x2D0D (LE)
  if (validateGen2ChecksumRange(view, 0x2009, 0x2B82, 0x2D0D)) {
    if (isPokeListValid(view, 0x2865, 6)) return true;
  }

  // Japanese Gold/Silver: sum 0x2009-0x2C8B, checksum at 0x2D0D (LE)
  if (validateGen2ChecksumRange(view, 0x2009, 0x2C8B, 0x2D0D)) return true;

  // Fallback: try checksums without PokeList validation
  if (validateGen2ChecksumRange(view, 0x2009, 0x2D68, 0x2D69)) return true;
  if (validateGen2ChecksumRange(view, 0x2009, 0x2B82, 0x2D0D)) return true;

  return false;
}

function isPokeListValid(view, offset, maxCount) {
  if (offset >= view.length) return false;
  const count = view[offset];
  if (count > maxCount) return false;
  const terminatorPos = offset + 1 + count;
  if (terminatorPos >= view.length) return false;
  return view[terminatorPos] === 0xFF;
}

function validateGen2ChecksumRange(view, start, end, checksumOffset) {
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

export const detectAndParseSave = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new Uint8Array(arrayBuffer);
    const size = view.length;
    const filename = file.name;

    console.log(`[Parser] Analyzing: ${filename} (${size} bytes)`);

    // --- 32KB save files (Gen 1 or Gen 2) ---
    // Some .srm files have a 16-byte header prepended, making them 32784 bytes
    let view32k = view;
    if (size === 32768 + 16) {
      // Strip the 16-byte header (used by some emulators/flash carts)
      view32k = view.slice(16);
    }

    if (view32k.length === 32768) {
      // Try Gen 2 first — both Gen 1 and Gen 2 are 32KB, but different checksum algorithms
      const isGen2Valid = validateGen2Checksum(view32k);
      if (isGen2Valid) {
        // This is a Gen 2 save — defer to Gen2Adapter via SaveManager
        console.log(`[Parser] Detected Gen 2 checksum. Routing to Gen2Adapter.`);
        // Return a marker so AppState knows to use SaveManager for Gen 2
        return {
          success: true,
          data: null,
          _requiresGen2Adapter: true,
          _rawData: view32k,
          _filename: filename
        };
      }

      // Try Gen 1 checksum
      const isValid = validateGen1Checksum(view32k);

      if (!isValid) {
        return {
          success: false,
          error: "Invalid Checksum! This does not look like a valid Gen 1 (Red/Blue/Yellow) or Gen 2 (Gold/Silver/Crystal) save file."
        };
      }

      return { success: true, data: parseGen1Save(view32k, filename) };
    }

    // Default error for any other file size
    return {
      success: false,
      error: `Unsupported File Format.\n\nBilKo's PC accepts Generation 1 (Red/Blue/Yellow) and Generation 2 (Gold/Silver/Crystal) Save Files (32KB .sav).\n\nDetected Size: ${size} bytes.`
    };

  } catch (err) {
    console.error("[Parser Error]", err);
    return { success: false, error: "Critical error during file structural analysis." };
  }
};
