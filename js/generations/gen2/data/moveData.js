/**
 * moveData.js — Generation II Move Data
 *
 * Contains move names and detailed move data for all 251 moves
 * available in Pokemon Gold, Silver, and Crystal.
 *
 * Move IDs 1-165 are carried over from Gen 1 (with some type changes
 * for Gen 2, e.g., Bite became Dark type).
 * Move IDs 166-251 are new moves introduced in Gen 2.
 *
 * Type IDs follow GEN2_TYPE_IDS from constants.js:
 *   Normal(0), Fighting(1), Flying(2), Poison(3), Ground(4), Rock(5),
 *   Bug(6), Ghost(7), Steel(8), Fire(9), Water(10), Grass(11),
 *   Electric(12), Ice(13), Psychic(14), Dragon(15), Dark(16)
 *
 * Note: Move #166 (Curse) uses the special ??? type in Gen 2.
 * It is mapped to type 0 (Normal) here since there is no ??? type ID
 * in the GEN2_TYPE_IDS constant.
 *
 * Power is 0 for status moves. Accuracy is 0 for moves that always hit
 * or have special accuracy rules.
 *
 * @module generations/gen2/data/moveData
 */

/**
 * Move names indexed by move ID.
 * Index 0 is empty; indices 1-251 contain move names.
 * @type {string[]}
 */
export const GEN2_MOVE_NAMES = [
    '',                 // 0: no move
    'Pound',            // 1
    'Karate Chop',      // 2
    'Doubleslap',       // 3
    'Comet Punch',      // 4
    'Mega Punch',       // 5
    'Pay Day',          // 6
    'Fire Punch',       // 7
    'Ice Punch',        // 8
    'Thunder Punch',    // 9
    'Scratch',          // 10
    'Vicegrip',         // 11
    'Guillotine',       // 12
    'Razor Wind',       // 13
    'Swords Dance',     // 14
    'Cut',              // 15
    'Gust',             // 16
    'Wing Attack',      // 17
    'Whirlwind',        // 18
    'Fly',              // 19
    'Bind',             // 20
    'Slam',             // 21
    'Vine Whip',        // 22
    'Stomp',            // 23
    'Double Kick',      // 24
    'Mega Kick',        // 25
    'Jump Kick',        // 26
    'Rolling Kick',     // 27
    'Sand Attack',      // 28
    'Headbutt',         // 29
    'Horn Attack',      // 30
    'Fury Attack',      // 31
    'Horn Drill',       // 32
    'Tackle',           // 33
    'Body Slam',        // 34
    'Wrap',             // 35
    'Take Down',        // 36
    'Thrash',           // 37
    'Double Edge',      // 38
    'Tail Whip',        // 39
    'Poison Sting',     // 40
    'Twineedle',        // 41
    'Pin Missile',      // 42
    'Leer',             // 43
    'Bite',             // 44
    'Growl',            // 45
    'Roar',             // 46
    'Sing',             // 47
    'Supersonic',       // 48
    'Sonicboom',        // 49
    'Disable',          // 50
    'Acid',             // 51
    'Ember',            // 52
    'Flamethrower',     // 53
    'Mist',             // 54
    'Water Gun',        // 55
    'Hydro Pump',       // 56
    'Surf',             // 57
    'Ice Beam',         // 58
    'Blizzard',         // 59
    'Psybeam',          // 60
    'Bubblebeam',       // 61
    'Aurora Beam',      // 62
    'Hyper Beam',       // 63
    'Peck',             // 64
    'Drill Peck',       // 65
    'Submission',       // 66
    'Low Kick',         // 67
    'Counter',          // 68
    'Seismic Toss',     // 69
    'Strength',         // 70
    'Absorb',           // 71
    'Mega Drain',       // 72
    'Leech Seed',       // 73
    'Growth',           // 74
    'Razor Leaf',       // 75
    'Solarbeam',        // 76
    'Poisonpowder',     // 77
    'Stun Spore',       // 78
    'Sleep Powder',     // 79
    'Petal Dance',      // 80
    'String Shot',      // 81
    'Dragon Rage',      // 82
    'Fire Spin',        // 83
    'Thunder Shock',    // 84
    'Thunderbolt',      // 85
    'Thunder Wave',     // 86
    'Thunder',          // 87
    'Rock Throw',       // 88
    'Earthquake',       // 89
    'Fissure',          // 90
    'Dig',              // 91
    'Toxic',            // 92
    'Confusion',        // 93
    'Psychic',          // 94
    'Hypnosis',         // 95
    'Meditate',         // 96
    'Agility',          // 97
    'Quick Attack',     // 98
    'Rage',             // 99
    'Teleport',         // 100
    'Night Shade',      // 101
    'Mimic',            // 102
    'Screech',          // 103
    'Double Team',      // 104
    'Recover',          // 105
    'Harden',           // 106
    'Minimize',         // 107
    'Smokescreen',      // 108
    'Confuse Ray',      // 109
    'Withdraw',         // 110
    'Defense Curl',     // 111
    'Barrier',          // 112
    'Light Screen',     // 113
    'Haze',             // 114
    'Reflect',          // 115
    'Focus Energy',     // 116
    'Bide',             // 117
    'Metronome',        // 118
    'Mirror Move',      // 119
    'Selfdestruct',     // 120
    'Egg Bomb',         // 121
    'Lick',             // 122
    'Smog',             // 123
    'Sludge',           // 124
    'Bone Club',        // 125
    'Fire Blast',       // 126
    'Waterfall',        // 127
    'Clamp',            // 128
    'Swift',            // 129
    'Skull Bash',       // 130
    'Spike Cannon',     // 131
    'Constrict',        // 132
    'Amnesia',          // 133
    'Kinesis',          // 134
    'Softboiled',       // 135
    'High Jump Kick',   // 136
    'Glare',            // 137
    'Dream Eater',      // 138
    'Poison Gas',       // 139
    'Barrage',          // 140
    'Leech Life',       // 141
    'Lovely Kiss',      // 142
    'Sky Attack',       // 143
    'Transform',        // 144
    'Bubble',           // 145
    'Dizzy Punch',      // 146
    'Spore',            // 147
    'Flash',            // 148
    'Psywave',          // 149
    'Splash',           // 150
    'Acid Armor',       // 151
    'Crabhammer',       // 152
    'Explosion',        // 153
    'Fury Swipes',      // 154
    'Bonemerang',       // 155
    'Rest',             // 156
    'Rock Slide',       // 157
    'Hyper Fang',       // 158
    'Sharpen',          // 159
    'Conversion',       // 160
    'Tri Attack',       // 161
    'Super Fang',       // 162
    'Slash',            // 163
    'Substitute',       // 164
    'Struggle',         // 165
    // --- Gen 2 New Moves ---
    'Curse',            // 166
    'Zap Cannon',       // 167
    'Snore',            // 168
    'Sleep Talk',       // 169
    'Destiny Bond',     // 170
    'Spite',            // 171
    'Pursuit',          // 172
    'Rapid Spin',       // 173
    'Sweet Scent',      // 174
    'Iron Tail',        // 175
    'Metal Claw',       // 176
    'Vital Throw',      // 177
    'Morning Sun',      // 178
    'Synthesis',        // 179
    'Moonlight',        // 180
    'Hidden Power',     // 181
    'Cross Chop',       // 182
    'Twister',          // 183
    'Rain Dance',       // 184
    'Sunny Day',        // 185
    'Crunch',           // 186
    'Mirror Coat',      // 187
    'Psych Up',         // 188
    'Extreme Speed',    // 189
    'Ancientpower',     // 190
    'Shadow Ball',      // 191
    'Future Sight',     // 192
    'Rock Smash',       // 193
    'Whirlpool',        // 194
    'Beat Up',          // 195
    'Fake Out',         // 196
    'Uproar',           // 197
    'Stockpile',        // 198
    'Spit Up',          // 199
    'Swallow',          // 200
    'Heat Wave',        // 201
    'Hail',             // 202
    'Torment',          // 203
    'Flatter',          // 204
    'Will-O-Wisp',      // 205
    'Memento',          // 206
    'Facade',           // 207
    'Focus Punch',      // 208
    'SmellingSalt',     // 209
    'Follow Me',        // 210
    'Nature Power',     // 211
    'Charge',           // 212
    'Taunt',            // 213
    'Helping Hand',     // 214
    'Trick',            // 215
    'Role Play',        // 216
    'Wish',             // 217
    'Assist',           // 218
    'Ingrain',          // 219
    'Superpower',       // 220
    'Magic Coat',       // 221
    'Recycle',          // 222
    'Revenge',          // 223
    'Brick Break',      // 224
    'Yawn',             // 225
    'Knock Off',        // 226
    'Endeavor',         // 227
    'Eruption',         // 228
    'Skill Swap',       // 229
    'Imprison',         // 230
    'Refresh',          // 231
    'Grudge',           // 232
    'Snatch',           // 233
    'Secret Power',     // 234
    'Dive',             // 235
    'Arm Thrust',       // 236
    'Camouflage',       // 237
    'Tail Glow',        // 238
    'Luster Purge',     // 239
    'Mist Ball',        // 240
    'FeatherDance',     // 241
    'Teeter Dance',     // 242
    'Blaze Kick',       // 243
    'Mud Sport',        // 244
    'Ice Ball',         // 245
    'Needle Arm',       // 246
    'Slack Off',        // 247
    'Hyper Voice',      // 248
    'Poison Fang',      // 249
    'Crush Claw',       // 250
    'Blast Burn',       // 251
];

/**
 * Detailed move data indexed by move ID.
 * Each entry contains: { name, type, pp, power, accuracy }
 * - name:     Move name string
 * - type:     Type ID (0-16 per GEN2_TYPE_IDS; 0 used for ??? type / Curse)
 * - pp:       Base PP value
 * - power:    Base power (0 for status moves)
 * - accuracy: Accuracy percentage (0 for always-hit or special accuracy)
 *
 * Gen 2 type changes from Gen 1:
 *   - Bite (#44): Normal → Dark (type 16)
 *
 * @type {Object<number, {name:string, type:number, pp:number, power:number, accuracy:number}>}
 */
export const GEN2_MOVE_DATA = {
    // --- Gen 1 Moves (1-165) ---
    1:   { name: 'Pound',          type: 0,  pp: 35, power: 40,  accuracy: 100 },
    2:   { name: 'Karate Chop',    type: 1,  pp: 25, power: 50,  accuracy: 100 },
    3:   { name: 'Doubleslap',     type: 0,  pp: 10, power: 15,  accuracy: 85 },
    4:   { name: 'Comet Punch',    type: 0,  pp: 15, power: 18,  accuracy: 85 },
    5:   { name: 'Mega Punch',     type: 0,  pp: 20, power: 80,  accuracy: 85 },
    6:   { name: 'Pay Day',        type: 0,  pp: 20, power: 40,  accuracy: 100 },
    7:   { name: 'Fire Punch',     type: 9,  pp: 15, power: 75,  accuracy: 100 },
    8:   { name: 'Ice Punch',      type: 13, pp: 15, power: 75,  accuracy: 100 },
    9:   { name: 'Thunder Punch',  type: 12, pp: 15, power: 75,  accuracy: 100 },
    10:  { name: 'Scratch',        type: 0,  pp: 35, power: 40,  accuracy: 100 },
    11:  { name: 'Vicegrip',       type: 0,  pp: 30, power: 55,  accuracy: 100 },
    12:  { name: 'Guillotine',     type: 0,  pp: 5,  power: 0,   accuracy: 30 },   // OHKO
    13:  { name: 'Razor Wind',     type: 0,  pp: 10, power: 80,  accuracy: 100 },  // charge turn
    14:  { name: 'Swords Dance',   type: 0,  pp: 30, power: 0,   accuracy: 0 },    // status
    15:  { name: 'Cut',            type: 0,  pp: 30, power: 50,  accuracy: 95 },
    16:  { name: 'Gust',           type: 0,  pp: 35, power: 40,  accuracy: 100 },
    17:  { name: 'Wing Attack',    type: 2,  pp: 35, power: 60,  accuracy: 100 },
    18:  { name: 'Whirlwind',      type: 0,  pp: 20, power: 0,   accuracy: 100 },
    19:  { name: 'Fly',            type: 2,  pp: 15, power: 70,  accuracy: 95 },
    20:  { name: 'Bind',           type: 0,  pp: 20, power: 15,  accuracy: 75 },
    21:  { name: 'Slam',           type: 0,  pp: 20, power: 80,  accuracy: 75 },
    22:  { name: 'Vine Whip',      type: 11, pp: 10, power: 35,  accuracy: 100 },
    23:  { name: 'Stomp',          type: 0,  pp: 20, power: 65,  accuracy: 100 },
    24:  { name: 'Double Kick',    type: 1,  pp: 30, power: 30,  accuracy: 100 },
    25:  { name: 'Mega Kick',      type: 0,  pp: 5,  power: 120, accuracy: 75 },
    26:  { name: 'Jump Kick',      type: 1,  pp: 25, power: 70,  accuracy: 95 },
    27:  { name: 'Rolling Kick',   type: 1,  pp: 15, power: 60,  accuracy: 85 },
    28:  { name: 'Sand Attack',    type: 4,  pp: 15, power: 0,   accuracy: 100 },
    29:  { name: 'Headbutt',       type: 0,  pp: 15, power: 70,  accuracy: 100 },
    30:  { name: 'Horn Attack',    type: 0,  pp: 25, power: 65,  accuracy: 100 },
    31:  { name: 'Fury Attack',    type: 0,  pp: 20, power: 15,  accuracy: 85 },
    32:  { name: 'Horn Drill',     type: 0,  pp: 5,  power: 0,   accuracy: 30 },   // OHKO
    33:  { name: 'Tackle',         type: 0,  pp: 35, power: 35,  accuracy: 95 },
    34:  { name: 'Body Slam',      type: 0,  pp: 15, power: 85,  accuracy: 100 },
    35:  { name: 'Wrap',           type: 0,  pp: 20, power: 15,  accuracy: 85 },
    36:  { name: 'Take Down',      type: 0,  pp: 20, power: 90,  accuracy: 85 },
    37:  { name: 'Thrash',         type: 0,  pp: 20, power: 90,  accuracy: 100 },
    38:  { name: 'Double Edge',    type: 0,  pp: 15, power: 120, accuracy: 100 },
    39:  { name: 'Tail Whip',      type: 0,  pp: 30, power: 0,   accuracy: 100 },
    40:  { name: 'Poison Sting',   type: 3,  pp: 35, power: 15,  accuracy: 100 },
    41:  { name: 'Twineedle',      type: 6,  pp: 20, power: 25,  accuracy: 100 },
    42:  { name: 'Pin Missile',    type: 6,  pp: 20, power: 14,  accuracy: 85 },
    43:  { name: 'Leer',           type: 0,  pp: 30, power: 0,   accuracy: 100 },
    44:  { name: 'Bite',           type: 16, pp: 25, power: 60,  accuracy: 100 },  // Changed to Dark in Gen 2
    45:  { name: 'Growl',          type: 0,  pp: 40, power: 0,   accuracy: 100 },
    46:  { name: 'Roar',           type: 0,  pp: 20, power: 0,   accuracy: 100 },
    47:  { name: 'Sing',           type: 0,  pp: 15, power: 0,   accuracy: 55 },
    48:  { name: 'Supersonic',     type: 0,  pp: 20, power: 0,   accuracy: 55 },
    49:  { name: 'Sonicboom',      type: 0,  pp: 20, power: 0,   accuracy: 90 },   // Always 20 damage
    50:  { name: 'Disable',        type: 0,  pp: 20, power: 0,   accuracy: 55 },
    51:  { name: 'Acid',           type: 3,  pp: 30, power: 40,  accuracy: 100 },
    52:  { name: 'Ember',          type: 9,  pp: 25, power: 40,  accuracy: 100 },
    53:  { name: 'Flamethrower',   type: 9,  pp: 15, power: 95,  accuracy: 100 },
    54:  { name: 'Mist',           type: 13, pp: 30, power: 0,   accuracy: 0 },
    55:  { name: 'Water Gun',      type: 10, pp: 25, power: 40,  accuracy: 100 },
    56:  { name: 'Hydro Pump',     type: 10, pp: 5,  power: 120, accuracy: 80 },
    57:  { name: 'Surf',           type: 10, pp: 15, power: 95,  accuracy: 100 },
    58:  { name: 'Ice Beam',       type: 13, pp: 10, power: 95,  accuracy: 100 },
    59:  { name: 'Blizzard',       type: 13, pp: 5,  power: 120, accuracy: 70 },
    60:  { name: 'Psybeam',        type: 14, pp: 20, power: 65,  accuracy: 100 },
    61:  { name: 'Bubblebeam',     type: 10, pp: 20, power: 65,  accuracy: 100 },
    62:  { name: 'Aurora Beam',    type: 13, pp: 20, power: 65,  accuracy: 100 },
    63:  { name: 'Hyper Beam',     type: 0,  pp: 5,  power: 150, accuracy: 90 },
    64:  { name: 'Peck',           type: 2,  pp: 35, power: 35,  accuracy: 100 },
    65:  { name: 'Drill Peck',     type: 2,  pp: 20, power: 80,  accuracy: 100 },
    66:  { name: 'Submission',     type: 1,  pp: 25, power: 80,  accuracy: 80 },
    67:  { name: 'Low Kick',       type: 1,  pp: 20, power: 50,  accuracy: 90 },
    68:  { name: 'Counter',        type: 1,  pp: 20, power: 0,   accuracy: 100 },
    69:  { name: 'Seismic Toss',   type: 1,  pp: 20, power: 0,   accuracy: 100 },  // Level-based damage
    70:  { name: 'Strength',       type: 0,  pp: 15, power: 80,  accuracy: 100 },
    71:  { name: 'Absorb',         type: 11, pp: 20, power: 20,  accuracy: 100 },
    72:  { name: 'Mega Drain',     type: 11, pp: 10, power: 40,  accuracy: 100 },
    73:  { name: 'Leech Seed',     type: 11, pp: 10, power: 0,   accuracy: 90 },
    74:  { name: 'Growth',         type: 0,  pp: 40, power: 0,   accuracy: 0 },
    75:  { name: 'Razor Leaf',     type: 11, pp: 25, power: 55,  accuracy: 95 },
    76:  { name: 'Solarbeam',      type: 11, pp: 10, power: 120, accuracy: 100 },  // Charge turn
    77:  { name: 'Poisonpowder',   type: 3,  pp: 35, power: 0,   accuracy: 75 },
    78:  { name: 'Stun Spore',     type: 11, pp: 30, power: 0,   accuracy: 75 },
    79:  { name: 'Sleep Powder',   type: 11, pp: 15, power: 0,   accuracy: 75 },
    80:  { name: 'Petal Dance',    type: 11, pp: 20, power: 70,  accuracy: 100 },
    81:  { name: 'String Shot',    type: 6,  pp: 40, power: 0,   accuracy: 95 },
    82:  { name: 'Dragon Rage',    type: 15, pp: 10, power: 0,   accuracy: 100 },  // Always 40 damage
    83:  { name: 'Fire Spin',      type: 9,  pp: 15, power: 15,  accuracy: 70 },
    84:  { name: 'Thunder Shock',  type: 12, pp: 30, power: 40,  accuracy: 100 },
    85:  { name: 'Thunderbolt',    type: 12, pp: 15, power: 95,  accuracy: 100 },
    86:  { name: 'Thunder Wave',   type: 12, pp: 20, power: 0,   accuracy: 100 },
    87:  { name: 'Thunder',        type: 12, pp: 10, power: 120, accuracy: 70 },
    88:  { name: 'Rock Throw',     type: 5,  pp: 15, power: 50,  accuracy: 90 },
    89:  { name: 'Earthquake',     type: 4,  pp: 10, power: 100, accuracy: 100 },
    90:  { name: 'Fissure',        type: 4,  pp: 5,  power: 0,   accuracy: 30 },   // OHKO
    91:  { name: 'Dig',            type: 4,  pp: 10, power: 60,  accuracy: 100 },
    92:  { name: 'Toxic',          type: 3,  pp: 10, power: 0,   accuracy: 85 },
    93:  { name: 'Confusion',      type: 14, pp: 25, power: 50,  accuracy: 100 },
    94:  { name: 'Psychic',        type: 14, pp: 10, power: 90,  accuracy: 100 },
    95:  { name: 'Hypnosis',       type: 14, pp: 20, power: 0,   accuracy: 60 },
    96:  { name: 'Meditate',       type: 14, pp: 40, power: 0,   accuracy: 0 },
    97:  { name: 'Agility',        type: 14, pp: 30, power: 0,   accuracy: 0 },
    98:  { name: 'Quick Attack',   type: 0,  pp: 30, power: 40,  accuracy: 100 },
    99:  { name: 'Rage',           type: 0,  pp: 20, power: 20,  accuracy: 100 },
    100: { name: 'Teleport',       type: 14, pp: 20, power: 0,   accuracy: 0 },
    101: { name: 'Night Shade',    type: 7,  pp: 15, power: 0,   accuracy: 100 },  // Level-based damage
    102: { name: 'Mimic',          type: 0,  pp: 10, power: 0,   accuracy: 0 },
    103: { name: 'Screech',        type: 0,  pp: 40, power: 0,   accuracy: 85 },
    104: { name: 'Double Team',    type: 0,  pp: 15, power: 0,   accuracy: 0 },
    105: { name: 'Recover',        type: 0,  pp: 20, power: 0,   accuracy: 0 },
    106: { name: 'Harden',         type: 0,  pp: 30, power: 0,   accuracy: 0 },
    107: { name: 'Minimize',       type: 0,  pp: 20, power: 0,   accuracy: 0 },
    108: { name: 'Smokescreen',    type: 0,  pp: 20, power: 0,   accuracy: 100 },
    109: { name: 'Confuse Ray',    type: 7,  pp: 10, power: 0,   accuracy: 100 },
    110: { name: 'Withdraw',       type: 10, pp: 40, power: 0,   accuracy: 0 },
    111: { name: 'Defense Curl',   type: 0,  pp: 40, power: 0,   accuracy: 0 },
    112: { name: 'Barrier',        type: 14, pp: 30, power: 0,   accuracy: 0 },
    113: { name: 'Light Screen',   type: 14, pp: 30, power: 0,   accuracy: 0 },
    114: { name: 'Haze',           type: 13, pp: 30, power: 0,   accuracy: 0 },
    115: { name: 'Reflect',        type: 14, pp: 20, power: 0,   accuracy: 0 },
    116: { name: 'Focus Energy',   type: 0,  pp: 30, power: 0,   accuracy: 0 },
    117: { name: 'Bide',           type: 0,  pp: 10, power: 0,   accuracy: 100 },
    118: { name: 'Metronome',      type: 0,  pp: 10, power: 0,   accuracy: 0 },
    119: { name: 'Mirror Move',    type: 2,  pp: 20, power: 0,   accuracy: 0 },
    120: { name: 'Selfdestruct',   type: 0,  pp: 5,  power: 130, accuracy: 100 },
    121: { name: 'Egg Bomb',       type: 0,  pp: 10, power: 100, accuracy: 75 },
    122: { name: 'Lick',           type: 7,  pp: 30, power: 20,  accuracy: 100 },
    123: { name: 'Smog',           type: 3,  pp: 20, power: 20,  accuracy: 70 },
    124: { name: 'Sludge',         type: 3,  pp: 20, power: 65,  accuracy: 100 },
    125: { name: 'Bone Club',      type: 4,  pp: 20, power: 65,  accuracy: 85 },
    126: { name: 'Fire Blast',     type: 9,  pp: 5,  power: 120, accuracy: 85 },
    127: { name: 'Waterfall',      type: 10, pp: 15, power: 80,  accuracy: 100 },
    128: { name: 'Clamp',          type: 10, pp: 10, power: 35,  accuracy: 75 },
    129: { name: 'Swift',          type: 0,  pp: 20, power: 60,  accuracy: 0 },    // Always hits
    130: { name: 'Skull Bash',     type: 0,  pp: 15, power: 100, accuracy: 100 },  // Charge turn
    131: { name: 'Spike Cannon',   type: 0,  pp: 15, power: 20,  accuracy: 100 },
    132: { name: 'Constrict',      type: 0,  pp: 35, power: 10,  accuracy: 100 },
    133: { name: 'Amnesia',        type: 14, pp: 20, power: 0,   accuracy: 0 },
    134: { name: 'Kinesis',        type: 14, pp: 15, power: 0,   accuracy: 80 },
    135: { name: 'Softboiled',     type: 0,  pp: 10, power: 0,   accuracy: 0 },
    136: { name: 'High Jump Kick', type: 1,  pp: 20, power: 85,  accuracy: 90 },
    137: { name: 'Glare',          type: 0,  pp: 15, power: 0,   accuracy: 75 },
    138: { name: 'Dream Eater',    type: 14, pp: 15, power: 100, accuracy: 100 },
    139: { name: 'Poison Gas',     type: 3,  pp: 40, power: 0,   accuracy: 55 },
    140: { name: 'Barrage',        type: 0,  pp: 20, power: 15,  accuracy: 85 },
    141: { name: 'Leech Life',     type: 6,  pp: 15, power: 20,  accuracy: 100 },
    142: { name: 'Lovely Kiss',    type: 0,  pp: 10, power: 0,   accuracy: 75 },
    143: { name: 'Sky Attack',     type: 2,  pp: 5,  power: 140, accuracy: 90 },   // Charge turn
    144: { name: 'Transform',      type: 0,  pp: 10, power: 0,   accuracy: 0 },
    145: { name: 'Bubble',         type: 10, pp: 30, power: 20,  accuracy: 100 },
    146: { name: 'Dizzy Punch',    type: 0,  pp: 10, power: 70,  accuracy: 100 },
    147: { name: 'Spore',          type: 11, pp: 15, power: 0,   accuracy: 100 },
    148: { name: 'Flash',          type: 0,  pp: 20, power: 0,   accuracy: 70 },
    149: { name: 'Psywave',        type: 14, pp: 15, power: 0,   accuracy: 80 },
    150: { name: 'Splash',         type: 0,  pp: 40, power: 0,   accuracy: 0 },
    151: { name: 'Acid Armor',     type: 3,  pp: 40, power: 0,   accuracy: 0 },
    152: { name: 'Crabhammer',     type: 10, pp: 10, power: 90,  accuracy: 85 },
    153: { name: 'Explosion',      type: 0,  pp: 5,  power: 170, accuracy: 100 },
    154: { name: 'Fury Swipes',    type: 0,  pp: 15, power: 18,  accuracy: 80 },
    155: { name: 'Bonemerang',     type: 4,  pp: 10, power: 50,  accuracy: 90 },
    156: { name: 'Rest',           type: 14, pp: 10, power: 0,   accuracy: 0 },
    157: { name: 'Rock Slide',     type: 5,  pp: 10, power: 75,  accuracy: 90 },
    158: { name: 'Hyper Fang',     type: 0,  pp: 15, power: 80,  accuracy: 90 },
    159: { name: 'Sharpen',        type: 0,  pp: 30, power: 0,   accuracy: 0 },
    160: { name: 'Conversion',     type: 0,  pp: 30, power: 0,   accuracy: 0 },
    161: { name: 'Tri Attack',     type: 0,  pp: 10, power: 80,  accuracy: 100 },
    162: { name: 'Super Fang',     type: 0,  pp: 10, power: 0,   accuracy: 90 },   // Halves HP
    163: { name: 'Slash',          type: 0,  pp: 20, power: 70,  accuracy: 100 },
    164: { name: 'Substitute',     type: 0,  pp: 10, power: 0,   accuracy: 0 },
    165: { name: 'Struggle',       type: 0,  pp: 1,  power: 50,  accuracy: 100 },

    // --- Gen 2 New Moves (166-251) ---
    166: { name: 'Curse',          type: 0,  pp: 10, power: 0,   accuracy: 0 },    // ??? type; Ghost effect for Ghosts, stat boost for others
    167: { name: 'Zap Cannon',     type: 12, pp: 5,  power: 100, accuracy: 50 },
    168: { name: 'Snore',          type: 0,  pp: 15, power: 40,  accuracy: 100 },
    169: { name: 'Sleep Talk',     type: 0,  pp: 10, power: 0,   accuracy: 0 },
    170: { name: 'Destiny Bond',   type: 7,  pp: 5,  power: 0,   accuracy: 0 },
    171: { name: 'Spite',          type: 7,  pp: 10, power: 0,   accuracy: 100 },
    172: { name: 'Pursuit',        type: 16, pp: 20, power: 40,  accuracy: 100 },
    173: { name: 'Rapid Spin',     type: 0,  pp: 40, power: 20,  accuracy: 100 },
    174: { name: 'Sweet Scent',    type: 0,  pp: 20, power: 0,   accuracy: 100 },
    175: { name: 'Iron Tail',      type: 8,  pp: 15, power: 100, accuracy: 75 },
    176: { name: 'Metal Claw',     type: 8,  pp: 35, power: 50,  accuracy: 95 },
    177: { name: 'Vital Throw',    type: 1,  pp: 10, power: 70,  accuracy: 0 },    // Always hits, moves last
    178: { name: 'Morning Sun',    type: 0,  pp: 5,  power: 0,   accuracy: 0 },
    179: { name: 'Synthesis',      type: 11, pp: 5,  power: 0,   accuracy: 0 },
    180: { name: 'Moonlight',      type: 0,  pp: 5,  power: 0,   accuracy: 0 },
    181: { name: 'Hidden Power',   type: 0,  pp: 15, power: 0,   accuracy: 100 },  // Power and type vary with DVs
    182: { name: 'Cross Chop',     type: 1,  pp: 5,  power: 100, accuracy: 80 },
    183: { name: 'Twister',        type: 15, pp: 20, power: 40,  accuracy: 100 },
    184: { name: 'Rain Dance',     type: 10, pp: 5,  power: 0,   accuracy: 0 },
    185: { name: 'Sunny Day',      type: 9,  pp: 5,  power: 0,   accuracy: 0 },
    186: { name: 'Crunch',         type: 16, pp: 15, power: 80,  accuracy: 100 },
    187: { name: 'Mirror Coat',    type: 14, pp: 20, power: 0,   accuracy: 100 },
    188: { name: 'Psych Up',       type: 0,  pp: 10, power: 0,   accuracy: 0 },
    189: { name: 'Extreme Speed',  type: 0,  pp: 5,  power: 80,  accuracy: 100 },
    190: { name: 'Ancientpower',   type: 5,  pp: 5,  power: 60,  accuracy: 100 },
    191: { name: 'Shadow Ball',    type: 7,  pp: 15, power: 80,  accuracy: 100 },
    192: { name: 'Future Sight',   type: 14, pp: 15, power: 80,  accuracy: 90 },
    193: { name: 'Rock Smash',     type: 1,  pp: 15, power: 20,  accuracy: 100 },
    194: { name: 'Whirlpool',      type: 10, pp: 15, power: 15,  accuracy: 70 },
    195: { name: 'Beat Up',        type: 16, pp: 10, power: 10,  accuracy: 100 },
    196: { name: 'Fake Out',       type: 0,  pp: 10, power: 40,  accuracy: 100 },
    197: { name: 'Uproar',         type: 0,  pp: 10, power: 50,  accuracy: 100 },
    198: { name: 'Stockpile',      type: 0,  pp: 10, power: 0,   accuracy: 0 },
    199: { name: 'Spit Up',        type: 0,  pp: 10, power: 100, accuracy: 100 },  // Power varies with stockpile
    200: { name: 'Swallow',        type: 0,  pp: 10, power: 0,   accuracy: 0 },
    201: { name: 'Heat Wave',      type: 9,  pp: 10, power: 100, accuracy: 90 },
    202: { name: 'Hail',           type: 13, pp: 10, power: 0,   accuracy: 0 },
    203: { name: 'Torment',        type: 16, pp: 15, power: 0,   accuracy: 100 },
    204: { name: 'Flatter',        type: 16, pp: 15, power: 0,   accuracy: 100 },
    205: { name: 'Will-O-Wisp',    type: 9,  pp: 15, power: 0,   accuracy: 75 },
    206: { name: 'Memento',        type: 16, pp: 10, power: 0,   accuracy: 0 },
    207: { name: 'Facade',         type: 0,  pp: 20, power: 70,  accuracy: 100 },
    208: { name: 'Focus Punch',    type: 1,  pp: 20, power: 150, accuracy: 100 },
    209: { name: 'SmellingSalt',   type: 0,  pp: 10, power: 60,  accuracy: 100 },
    210: { name: 'Follow Me',      type: 0,  pp: 20, power: 0,   accuracy: 0 },
    211: { name: 'Nature Power',   type: 0,  pp: 20, power: 0,   accuracy: 0 },
    212: { name: 'Charge',         type: 12, pp: 20, power: 0,   accuracy: 0 },
    213: { name: 'Taunt',          type: 16, pp: 20, power: 0,   accuracy: 100 },
    214: { name: 'Helping Hand',   type: 0,  pp: 20, power: 0,   accuracy: 0 },
    215: { name: 'Trick',          type: 14, pp: 10, power: 0,   accuracy: 100 },
    216: { name: 'Role Play',      type: 14, pp: 10, power: 0,   accuracy: 0 },
    217: { name: 'Wish',           type: 0,  pp: 10, power: 0,   accuracy: 0 },
    218: { name: 'Assist',         type: 0,  pp: 20, power: 0,   accuracy: 0 },
    219: { name: 'Ingrain',        type: 11, pp: 20, power: 0,   accuracy: 0 },
    220: { name: 'Superpower',     type: 1,  pp: 5,  power: 120, accuracy: 100 },
    221: { name: 'Magic Coat',     type: 14, pp: 15, power: 0,   accuracy: 0 },
    222: { name: 'Recycle',        type: 0,  pp: 10, power: 0,   accuracy: 0 },
    223: { name: 'Revenge',        type: 1,  pp: 10, power: 60,  accuracy: 100 },
    224: { name: 'Brick Break',    type: 1,  pp: 15, power: 75,  accuracy: 100 },
    225: { name: 'Yawn',           type: 0,  pp: 10, power: 0,   accuracy: 0 },
    226: { name: 'Knock Off',      type: 16, pp: 20, power: 20,  accuracy: 100 },
    227: { name: 'Endeavor',       type: 0,  pp: 5,  power: 0,   accuracy: 100 },  // Reduces target HP to user's HP
    228: { name: 'Eruption',       type: 9,  pp: 5,  power: 150, accuracy: 100 },  // Power decreases with user's HP
    229: { name: 'Skill Swap',     type: 14, pp: 10, power: 0,   accuracy: 0 },
    230: { name: 'Imprison',       type: 14, pp: 10, power: 0,   accuracy: 100 },
    231: { name: 'Refresh',        type: 0,  pp: 20, power: 0,   accuracy: 0 },
    232: { name: 'Grudge',         type: 7,  pp: 5,  power: 0,   accuracy: 0 },
    233: { name: 'Snatch',         type: 16, pp: 10, power: 0,   accuracy: 100 },
    234: { name: 'Secret Power',   type: 0,  pp: 20, power: 70,  accuracy: 100 },
    235: { name: 'Dive',           type: 10, pp: 10, power: 60,  accuracy: 100 },
    236: { name: 'Arm Thrust',     type: 1,  pp: 20, power: 15,  accuracy: 100 },
    237: { name: 'Camouflage',     type: 0,  pp: 20, power: 0,   accuracy: 0 },
    238: { name: 'Tail Glow',      type: 6,  pp: 20, power: 0,   accuracy: 0 },
    239: { name: 'Luster Purge',   type: 14, pp: 5,  power: 70,  accuracy: 100 },
    240: { name: 'Mist Ball',      type: 14, pp: 5,  power: 70,  accuracy: 100 },
    241: { name: 'FeatherDance',   type: 2,  pp: 15, power: 0,   accuracy: 100 },
    242: { name: 'Teeter Dance',   type: 0,  pp: 20, power: 0,   accuracy: 100 },
    243: { name: 'Blaze Kick',     type: 9,  pp: 10, power: 85,  accuracy: 90 },
    244: { name: 'Mud Sport',      type: 4,  pp: 15, power: 0,   accuracy: 0 },
    245: { name: 'Ice Ball',       type: 13, pp: 20, power: 30,  accuracy: 90 },
    246: { name: 'Needle Arm',     type: 11, pp: 15, power: 60,  accuracy: 100 },
    247: { name: 'Slack Off',      type: 0,  pp: 10, power: 0,   accuracy: 0 },
    248: { name: 'Hyper Voice',    type: 0,  pp: 15, power: 90,  accuracy: 100 },
    249: { name: 'Poison Fang',    type: 3,  pp: 15, power: 50,  accuracy: 100 },
    250: { name: 'Crush Claw',     type: 0,  pp: 10, power: 75,  accuracy: 95 },
    251: { name: 'Blast Burn',     type: 9,  pp: 5,  power: 150, accuracy: 90 },
};
