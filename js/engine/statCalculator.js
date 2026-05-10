/**
 * statCalculator.js — Gen 1 Stat Calculation
 *
 * Ported from lib/utils/statCalculator.ts
 */

import { GEN1_BASE_STATS } from '../data/baseStats.js';

// --- Gen 1 Formula ---
// HP: floor(( (Base + DV) * 2 + floor( ceil( sqrt(Stat Exp) ) / 4 ) ) * Level / 100) + Level + 10
// Other: floor(( (Base + DV) * 2 + floor( ceil( sqrt(Stat Exp) ) / 4 ) ) * Level / 100) + 5

/**
 * Calculate a Gen 1 stat.
 * @param {number} base - Base stat
 * @param {number} dv - DV (0-15)
 * @param {number} statExp - Stat experience (0-65535)
 * @param {number} level - Pokémon level (1-100)
 * @param {boolean} isHp - Whether this is the HP stat
 * @returns {number}
 */
export function calculateGen1Stat(base, dv, statExp, level, isHp) {
  const evFactor = Math.floor(Math.ceil(Math.sqrt(statExp)) / 4);
  const core = ((base + dv) * 2 + evFactor) * level;

  if (isHp) {
    return Math.floor(core / 100) + level + 10;
  } else {
    return Math.floor(core / 100) + 5;
  }
}

// --- Reverse Engineer Base Stats ---

/**
 * Derive base stats from a Pokémon's actual stats.
 * @param {Object} mon - PokemonStats object
 * @param {number} generation
 * @returns {Object|null}
 */
export function deriveBaseStats(mon, generation) {
  if (mon.maxHp === 0 || mon.level === 0) return null;

  const derive = (statVal, iv, ev, level, isHp) => {
    // Gen 1 Reversal
    // HP = floor(core/100) + level + 10  => core approx (HP - Level - 10) * 100
    // Core = (Base + DV)*2 + EVFactor
    // (Base + DV) * 2 = Core / Level - evFactor
    // Base = ((Core / Level - evFactor) / 2) - DV
    const evFactor = Math.floor(Math.ceil(Math.sqrt(ev)) / 4);
    const targetCore = isHp ? (statVal - level - 10) * 100 : (statVal - 5) * 100;
    return Math.round(((targetCore / level - evFactor) / 2) - iv);
  };

  try {
    return {
      hp: derive(mon.maxHp, mon.iv.hp, mon.ev.hp, mon.level, true),
      attack: derive(mon.attack, mon.iv.attack, mon.ev.attack, mon.level, false),
      defense: derive(mon.defense, mon.iv.defense, mon.ev.defense, mon.level, false),
      speed: derive(mon.speed, mon.iv.speed, mon.ev.speed, mon.level, false),
      spAtk: derive(mon.spAtk, mon.iv.special, mon.ev.special, mon.level, false),
      spDef: derive(mon.spDef, mon.iv.special, mon.ev.special, mon.level, false)
    };
  } catch (e) {
    console.warn("Failed to derive base stats", e);
    return null;
  }
}

/**
 * Recalculate all stats for a Pokémon.
 * @param {Object} mon - PokemonStats object
 * @param {Object} baseStats
 * @param {number} generation
 * @returns {Object} Updated PokemonStats
 */
export function recalculateStats(mon, baseStats, generation) {
  const newMon = { ...mon };

  // Gen 1 Logic Only
  newMon.maxHp = calculateGen1Stat(baseStats.hp, mon.iv.hp, mon.ev.hp, mon.level, true);
  newMon.hp = newMon.maxHp; // Auto heal on edit
  newMon.attack = calculateGen1Stat(baseStats.attack, mon.iv.attack, mon.ev.attack, mon.level, false);
  newMon.defense = calculateGen1Stat(baseStats.defense, mon.iv.defense, mon.ev.defense, mon.level, false);
  newMon.speed = calculateGen1Stat(baseStats.speed, mon.iv.speed, mon.ev.speed, mon.level, false);
  newMon.special = calculateGen1Stat(baseStats.spAtk, mon.iv.special, mon.ev.special, mon.level, false);
  newMon.spAtk = newMon.special;
  newMon.spDef = newMon.special;

  return newMon;
}
