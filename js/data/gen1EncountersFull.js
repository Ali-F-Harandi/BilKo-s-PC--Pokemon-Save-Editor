
/**
 * gen1-encounters-full.js
 *
 * Contains Generation 1 Learnsets and logic to determine valid moves for wild encounters/trades
 * based on level.
 */

/* ---------------------------
   Simplified Gen1 learnset table (species -> array of [level, moveName])
   Only includes species referenced in encounters (approximate moves).
   If species not in table, fallbackMoves() is used.
   --------------------------- */

const LearnsetsGen1 = {
  // Bulbasaur (001)
  1: [
    [1, 'Tackle'],
    [3, 'Growl'],
    [7, 'Leech Seed'],
    [13, 'Vine Whip'],
    [20, 'Razor Leaf'],
    [27, 'Growth']
  ],

  // Charmander (004)
  4: [
    [1, 'Scratch'],
    [1, 'Growl'],
    [9, 'Ember'],
    [15, 'Leer'],
    [22, 'Rage'],
    [30, 'Slash']
  ],

  // Squirtle (007)
  7: [
    [1, 'Tackle'],
    [1, 'Tail Whip'],
    [8, 'Bubble'],
    [15, 'Bite'],
    [22, 'Withdraw'],
    [28, 'Skull Bash']
  ],

  // Pikachu (025)
  25: [
    [1, 'Thundershock'],
    [5, 'Growl'],
    [10, 'Quick Attack'],
    [13, 'Electro Ball'],
    [18, 'Thunderbolt']
  ],

  // Clefairy (035) & Clefable (036)
  35: [
    [1, 'Pound'],
    [9, 'Sing'],
    [16, 'Doubleslap'],
    [25, 'Follow Me'],
    [33, 'Minimize'],
  ],
  36: [
    [1, 'Pound'],
    [5, 'Growl'],
    [9, 'Sing'],
    [16, 'Doubleslap'],
    [25, 'Metronome'],
  ],

  // Vulpix (037)
  37: [
    [1, 'Ember'],
    [1, 'Tail Whip'],
    [14, 'Roar'],
    [19, 'Confuse Ray'],
  ],

  // Wigglytuff (040) - approximate
  40: [
    [1, 'Sing'],
    [5, 'Pound'],
    [12, 'Disable'],
    [20, 'Double-Edge']
  ],

  // Jigglypuff/MrMime placeholders (for trades)
  122: [ [1, 'Pound'], [6, 'Confuse Ray'] ],
  133: [ // Eevee
    [1, 'Tackle'],
    [9, 'Quick Attack'],
    [16, 'Bite'],
    [25, 'Baton Pass']
  ],

  // Scyther (123)
  123: [
    [1, 'Quick Attack'],
    [10, 'Double Team'],
    [20, 'Wing Attack'],
    [30, 'Slash']
  ],

  // Dratini (147) / Dragonair (148)
  147: [
    [1, 'Wrap'],
    [8, 'Leer'],
    [15, 'Thunder Wave'],
    [25, 'Twister']
  ],
  148: [
    [1, 'Wrap'],
    [10, 'Leer'],
    [20, 'Dragon Rage'],
    [30, 'Slam']
  ],

  // Magikarp (129)
  129: [
    [1, 'Splash'],
    [15, 'Tackle'],
    [30, 'Flail']
  ],

  // Snorlax (143)
  143: [
    [1, 'Tackle'],
    [1, 'Defense Curl'],
    [18, 'Amnesia'],
    [26, 'Body Slam']
  ],

  // Hitmonlee (106)
  106: [
    [1, 'Focus Energy'],
    [1, 'Double Kick'],
    [20, 'High Jump Kick']
  ],

  // Hitmonchan (107)
  107: [
    [1, 'Focus Energy'],
    [1, 'Double Punch'],
    [20, 'Mega Punch']
  ],

  // Lapras (131)
  131: [
    [1, 'Sing'],
    [1, 'Water Gun'],
    [20, 'Perish Song'],
    [30, 'Ice Beam']
  ],

  // Omanyte (138)
  138: [
    [1, 'Withdraw'],
    [15, 'Bite'],
    [30, 'Rock Throw']
  ],

  // Kabuto (140)
  140: [
    [1, 'Harden'],
    [15, 'Scratch'],
    [30, 'Aqua Jet']
  ],

  // Aerodactyl (142)
  142: [
    [1, 'Bite'],
    [1, 'Supersonic'],
    [20, 'Wing Attack'],
    [40, 'Hyper Beam']
  ],

  // Legendary birds
  144: [ [1, 'Gust'], [1, 'Leer'], [25, 'Agility'], [45, 'Sky Attack'] ],
  145: [ [1, 'Drill Peck'], [1, 'Leer'], [25, 'Agility'], [45, 'Thunderbolt'] ],
  146: [ [1, 'Ember'], [1, 'Leer'], [25, 'Agility'], [45, 'Fire Blast'] ],

  // Mewtwo (150)
  150: [
    [1, 'Confusion'],
    [1, 'Psychic'],
    [50, 'Recover'],
    [65, 'Swift']
  ],

  // Voltorb (100) / Electrode (101)
  100: [ [1, 'Tackle'], [5, 'Screech'], [20, 'Spark'] ],
  101: [ [1, 'Tackle'], [1, 'Screech'], [20, 'Thunderbolt'] ],

  // Nidorina/Nidorino (30/33)
  30: [ [1, 'Scratch'], [5, 'Leer'], [16, 'Poison Sting'] ],
  33: [ [1, 'Fury Swipes'], [5, 'Leer'], [16, 'Poison Sting'] ],

  // Abra (63)
  63: [ [1, 'Teleport'] ],

  // Pinsir (127)
  127: [ [1, 'Vice Grip'], [20, 'Seismic Toss'] ],

  // Porygon (137)
  137: [ [1, 'Tackle'], [10, 'Sharpen'], [20, 'Recover'] ],

  // Lickitung (108)
  108: [ [1, 'Lick'], [20, 'Stomp'] ],

  // Jynx (124)
  124: [ [1, 'Powder Snow'], [20, 'Double Slap'] ],

  // Farfetch'd (83)
  83: [ [1, 'Peck'], [18, 'Fury Attack'] ],

  // Tangela (114)
  114: [ [1, 'Vine Whip'], [15, 'Absorb'] ],

  // Seel (86)
  86: [ [1, 'Headbutt'], [15, 'Ice Beam'] ],

  // Machoke (67)
  67: [ [1, 'Low Kick'], [20, 'Seismic Toss'] ],

  // Dugtrio (51)
  51: [ [1, 'Sand Attack'], [16, 'Sucker Punch'] ],

  // Parasect (47)
  47: [ [1, 'Scratch'], [24, 'Spore'] ],

  // Rhydon (112)
  112: [ [1, 'Horn Attack'], [15, 'Stomp'] ],

  // Dewgong (87)
  87: [ [1, 'Headbutt'], [20, 'Ice Beam'] ],

  // Muk (89)
  89: [ [1, 'Pound'], [30, 'Sludge'] ],

  // Poliwag (60)
  60: [ [1, 'Bubble'], [25, 'Hypnosis'] ],

  // Kangaskhan (115)
  115: [ [1, 'Comet Punch'], [28, 'Rage'] ],

  // Tauros (128)
  128: [ [1, 'Tackle'], [25, 'Rage'] ],

  // Haunter (93)
  93: [ [1, 'Lick'], [24, 'Dream Eater'] ],

  // Graveler (75)
  75: [ [1, 'Tackle'], [18, 'Rock Throw'] ],

  // Slowpoke (79)
  79: [ [1, 'Confusion'], [15, 'Disable'] ],

  // Krabby (98)
  98: [ [1, 'Bubble'], [20, 'Guillotine'] ],

  // Mew (151)
  151: [
    [1, 'Pound'],
    [1, 'Transform'],
    [10, 'Psychic'],
    [20, 'Metronome']
  ],
};

/* ---------------------------
   Helper functions: insertion logic similar to Learnset.SetEncounterMoves
   (AddMoveShiftLater + RectifyOrderShift behavior)
   --------------------------- */

/**
 * Given a species and a level, compute up to 4 encounter moves (strings)
 * using the embedded LearnsetsGen1 (level-up moves).
 */
export function getEncounterMovesGen1(species, level) {
  const learn = LearnsetsGen1[species];
  if (!learn || learn.length === 0) {
    // fallback: generic simple moves
    return fallbackMoves(level);
  }

  // moves array of length 4, 0 = empty
  const moves = [null, null, null, null];
  let ctr = 0;

  // sort learnset by level (should already be sorted in table)
  const sorted = learn.slice().sort((a, b) => a[0] - b[0]);

  for (let i = 0; i < sorted.length; i++) {
    const [req, move] = sorted[i];
    if (req < 1) continue;
    if (req > level) break;

    addMoveShiftLater(moves, move);
    ctr++;
  }

  rectifyOrderShift(moves, ctr);
  // compact nulls and return up to 4
  const out = moves.filter(m => m !== null);
  // if out is empty, fallback
  if (out.length === 0) return fallbackMoves(level);
  return out;
}

/** Insert move into moves[] if not present; insertion is at index ctr&3 (push with wrap). */
function addMoveShiftLater(moves, move) {
  // If already present, do nothing.
  if (moves.includes(move)) return;
  // find first empty slot; if none, we will overwrite using push behavior
  const firstEmpty = moves.indexOf(null);
  if (firstEmpty !== -1) {
    moves[firstEmpty] = move;
    return;
  }
  // all filled: emulate pushing and wrapping by shifting left and appending at end
  // (Equivalent effect to rotating insertors; simpler here)
  moves.shift();
  moves.push(move);
}

/**
 * Rectify order shift as in PKHeX.Learnset.RectifyOrderShift:
 */
function rectifyOrderShift(moves, ctr) {
  const len = moves.length;
  if (ctr <= len) return;
  const rotation = ctr & 3;
  if (rotation === 0) return;
  for (let r = 0; r < rotation; r++) {
    const first = moves.shift();
    moves.push(first);
  }
}

/** Generic fallback moves if a species has no learnset embedded */
function fallbackMoves(level) {
  // Very simple fallback: choose canonical moves depending on level brackets
  if (level < 10) return ['Tackle', 'Growl'].slice(0, 4);
  if (level < 30) return ['Tackle', 'Growl', 'Bite', 'Quick Attack'].slice(0, 4);
  return ['Tackle', 'Bite', 'Hyper Beam', 'Quick Attack'].slice(0, 4);
}

export default {
  getEncounterMovesGen1
};
