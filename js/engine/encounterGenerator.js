/**
 * encounterGenerator.js — Generate Pokémon from Encounter Templates
 *
 * Ported from lib/utils/encounterGenerator.ts
 * Generates full PokemonStats objects from encounter templates,
 * including IVs, EVs, stats, moves, types, and catch rates.
 */

import { GEN1_BASE_STATS, GEN1_CATCH_RATES } from '../data/baseStats.js';
import { getPokemonName } from '../data/pokemonNames.js';
import { getPokemonTypes, GEN1_TYPE_ID_MAP } from '../data/pokemonTypes.js';
import { calculateGen1Stat } from './statCalculator.js';
import { getGrowthRate, getExpAtLevel } from '../data/experience.js';
import { getEncounterMovesGen1 } from '../data/gen1EncountersFull.js';
import { MOVES_LIST, MOVES_PP } from '../data/moves.js';

// Helper: Random Int between min and max (inclusive)
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Fuzzy find move ID to handle spelling differences (e.g. "Thundershock" vs "Thunder Shock")
function findMoveId(name) {
  let id = MOVES_LIST.indexOf(name);
  if (id !== -1) return id;

  // Normalize: lowercase and remove spaces/non-alphanumeric
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = clean(name);

  id = MOVES_LIST.findIndex(m => clean(m) === target);
  return id !== -1 ? id : 0;
}

/**
 * Generate a full PokemonStats object from an encounter template.
 * @param {Object} template - EncounterTemplate
 * @param {Object} trainer - Trainer info
 * @returns {Object|null} PokemonStats object or null on failure
 */
export function generatePokemonFromEncounter(template, trainer) {
  const dexId = template.speciesId;
  const baseStats = GEN1_BASE_STATS[dexId];

  if (!baseStats) {
    console.error("Missing base stats for encounter ID " + dexId);
    return null;
  }

  // 1. IVs (DVs)
  // Trades often have fixed DVs in Gen 1, otherwise random 0-15
  let ivs;
  if (template.fixedDVs && template.ivs) {
    ivs = {
      hp: 0, // Calculated below
      attack: template.ivs.atk,
      defense: template.ivs.def,
      speed: template.ivs.spd,
      special: template.ivs.spc
    };
  } else {
    ivs = {
      hp: 0,
      attack: rand(0, 15),
      defense: rand(0, 15),
      speed: rand(0, 15),
      special: rand(0, 15)
    };
  }
  // Calculate HP DV based on others
  // HP DV = (Atk&1)<<3 | (Def&1)<<2 | (Spd&1)<<1 | (Spc&1)
  ivs.hp = ((ivs.attack & 1) << 3) | ((ivs.defense & 1) << 2) | ((ivs.speed & 1) << 1) | (ivs.special & 1);
  // Gen 1 mirrors Special
  ivs.spAtk = ivs.special;
  ivs.spDef = ivs.special;

  // 2. EVs (Stat Exp) - Fresh encounters have 0
  const evs = { hp: 0, attack: 0, defense: 0, speed: 0, special: 0, spAtk: 0, spDef: 0 };

  // 3. Stats
  const level = template.level;
  const maxHp = calculateGen1Stat(baseStats.hp, ivs.hp, evs.hp, level, true);
  const attack = calculateGen1Stat(baseStats.atk, ivs.attack, evs.attack, level, false);
  const defense = calculateGen1Stat(baseStats.def, ivs.defense, evs.defense, level, false);
  const speed = calculateGen1Stat(baseStats.spe, ivs.speed, evs.speed, level, false);
  const special = calculateGen1Stat(baseStats.spc, ivs.special, evs.special, level, false);

  // 4. Identity
  const speciesName = getPokemonName(dexId);
  const nickname = template.name || speciesName;
  const isNicknamed = nickname !== speciesName;

  // OT details
  let otName = trainer.name;
  let otId = parseInt(trainer.id);

  if (template.category === 'Trade') {
    otName = template.ot || 'TRAINER';
    // USE FIXED TID IF AVAILABLE, otherwise fallback to random
    otId = template.tid !== undefined ? template.tid : rand(0, 65535);
  }

  // 5. Exp
  const rate = getGrowthRate(dexId);
  const exp = getExpAtLevel(level, rate);

  // 6. Types - Resolved from Data
  const typeNames = getPokemonTypes(dexId);
  const type1Name = typeNames[0] || 'Normal';
  const type2Name = typeNames[1] || type1Name;

  // Convert Names to Gen 1 Internal IDs
  const type1 = GEN1_TYPE_ID_MAP[type1Name] !== undefined ? GEN1_TYPE_ID_MAP[type1Name] : 0;
  const type2 = GEN1_TYPE_ID_MAP[type2Name] !== undefined ? GEN1_TYPE_ID_MAP[type2Name] : type1;

  // 7. Catch Rate
  const catchRate = GEN1_CATCH_RATES[dexId] || 45;

  // 8. Moves
  // Use the embedded learnset logic from gen1-encounters-full
  const generatedMoveNames = getEncounterMovesGen1(dexId, level);

  const moves = ['-', '-', '-', '-'];
  const moveIds = [0, 0, 0, 0];
  const movePp = [0, 0, 0, 0];
  const movePpUps = [0, 0, 0, 0];

  generatedMoveNames.slice(0, 4).forEach((name, i) => {
    const id = findMoveId(name);

    if (id !== 0) {
      moves[i] = MOVES_LIST[id]; // Use the canonical name from MOVES_LIST
      moveIds[i] = id;
      movePp[i] = MOVES_PP[id] || 0;
    } else {
      console.warn(`Encounter Generation: Move '${name}' not found in Gen 1 DB.`);
    }
  });

  return {
    pid: 0, // Gen 1 doesn't use PID
    speciesId: 0, // Will be mapped by writer or UI based on Dex ID
    dexId: dexId,
    speciesName: speciesName,
    nickname: nickname,
    isNicknamed: isNicknamed,
    form: 0,

    originalTrainerName: otName,
    originalTrainerId: otId,
    secretId: 0,
    originalTrainerGender: 'Male',

    level: level,
    exp: exp,
    friendship: 0,

    hp: maxHp,
    maxHp: maxHp,
    attack: attack,
    defense: defense,
    speed: speed,
    special: special,
    spAtk: special,
    spDef: special,

    iv: ivs,
    ev: evs,

    moves: moves,
    moveIds: moveIds,
    movePp: movePp,
    movePpUps: movePpUps,

    status: 'OK',
    catchRate: catchRate,

    type1: type1,
    type2: type2,
    type1Name: type1Name,
    type2Name: type2Name,

    isParty: false,
    isEgg: false,
    isShiny: false,
    gender: 'Genderless', // Gen 1 has no gender concept in structure (calculated by DVs in Gen 2)
    pokerus: 0,

    raw: new Uint8Array(0),
    startOffset: 0,
    nicknameRaw: new Uint8Array(11), // Padding
    otNameRaw: new Uint8Array(11)
  };
}
