/**
 * pokemonData.js — Generation II Pokemon Data
 *
 * Contains names, types, and gender ratios for all 251 Pokemon
 * available in Pokemon Gold, Silver, and Crystal.
 *
 * Type IDs follow GEN2_TYPE_IDS:
 *   Normal(0), Fighting(1), Flying(2), Poison(3), Ground(4), Rock(5),
 *   Bug(6), Ghost(7), Steel(8), Fire(9), Water(10), Grass(11),
 *   Electric(12), Ice(13), Psychic(14), Dragon(15), Dark(16)
 *
 * New types in Gen 2: Steel(8) and Dark(16).
 * Magnemite (#81) and Magneton (#82) gained the Steel type in Gen 2.
 *
 * Bug fix from Gen 1 data: Seel (#86) is correctly typed as Water
 * (was incorrectly Poison in the Gen 1 data).
 *
 * For single-type Pokemon, type2 equals type1.
 */

/**
 * Pokemon names indexed by National Dex ID.
 * Index 0 is empty; indices 1-251 contain Pokemon names.
 * @type {string[]}
 */
export const GEN2_POKEMON_NAMES = [
    '',               // 0: placeholder
    'Bulbasaur',      // 1
    'Ivysaur',        // 2
    'Venusaur',       // 3
    'Charmander',     // 4
    'Charmeleon',     // 5
    'Charizard',      // 6
    'Squirtle',       // 7
    'Wartortle',      // 8
    'Blastoise',      // 9
    'Caterpie',       // 10
    'Metapod',        // 11
    'Butterfree',     // 12
    'Weedle',         // 13
    'Kakuna',         // 14
    'Beedrill',       // 15
    'Pidgey',         // 16
    'Pidgeotto',      // 17
    'Pidgeot',        // 18
    'Rattata',        // 19
    'Raticate',       // 20
    'Spearow',        // 21
    'Fearow',         // 22
    'Ekans',          // 23
    'Arbok',          // 24
    'Pikachu',        // 25
    'Raichu',         // 26
    'Sandshrew',      // 27
    'Sandslash',      // 28
    'Nidoran F',      // 29
    'Nidorina',       // 30
    'Nidoqueen',      // 31
    'Nidoran M',      // 32
    'Nidorino',       // 33
    'Nidoking',       // 34
    'Clefairy',       // 35
    'Clefable',       // 36
    'Vulpix',         // 37
    'Ninetales',      // 38
    'Jigglypuff',     // 39
    'Wigglytuff',     // 40
    'Zubat',          // 41
    'Golbat',         // 42
    'Oddish',         // 43
    'Gloom',          // 44
    'Vileplume',      // 45
    'Paras',          // 46
    'Parasect',       // 47
    'Venonat',        // 48
    'Venomoth',       // 49
    'Diglett',        // 50
    'Dugtrio',        // 51
    'Meowth',         // 52
    'Persian',        // 53
    'Psyduck',        // 54
    'Golduck',        // 55
    'Mankey',         // 56
    'Primeape',       // 57
    'Growlithe',      // 58
    'Arcanine',       // 59
    'Poliwag',        // 60
    'Poliwhirl',      // 61
    'Poliwrath',      // 62
    'Abra',           // 63
    'Kadabra',        // 64
    'Alakazam',       // 65
    'Machop',         // 66
    'Machoke',        // 67
    'Machamp',        // 68
    'Bellsprout',     // 69
    'Weepinbell',     // 70
    'Victreebel',     // 71
    'Tentacool',      // 72
    'Tentacruel',     // 73
    'Geodude',        // 74
    'Graveler',       // 75
    'Golem',          // 76
    'Ponyta',         // 77
    'Rapidash',       // 78
    'Slowpoke',       // 79
    'Slowbro',        // 80
    'Magnemite',      // 81
    'Magneton',       // 82
    'Farfetch\'d',    // 83
    'Doduo',          // 84
    'Dodrio',         // 85
    'Seel',           // 86
    'Dewgong',        // 87
    'Grimer',         // 88
    'Muk',            // 89
    'Shellder',       // 90
    'Cloyster',       // 91
    'Gastly',         // 92
    'Haunter',        // 93
    'Gengar',         // 94
    'Onix',           // 95
    'Drowzee',        // 96
    'Hypno',          // 97
    'Krabby',         // 98
    'Kingler',        // 99
    'Voltorb',        // 100
    'Electrode',      // 101
    'Exeggcute',      // 102
    'Exeggutor',      // 103
    'Cubone',         // 104
    'Marowak',        // 105
    'Hitmonlee',      // 106
    'Hitmonchan',     // 107
    'Lickitung',      // 108
    'Koffing',        // 109
    'Weezing',        // 110
    'Rhyhorn',        // 111
    'Rhydon',         // 112
    'Chansey',        // 113
    'Tangela',        // 114
    'Kangaskhan',     // 115
    'Horsea',         // 116
    'Seadra',         // 117
    'Goldeen',        // 118
    'Seaking',        // 119
    'Staryu',         // 120
    'Starmie',        // 121
    'Mr. Mime',       // 122
    'Scyther',        // 123
    'Jynx',           // 124
    'Electabuzz',     // 125
    'Magmar',         // 126
    'Pinsir',         // 127
    'Tauros',         // 128
    'Magikarp',       // 129
    'Gyarados',       // 130
    'Lapras',         // 131
    'Ditto',          // 132
    'Eevee',          // 133
    'Vaporeon',       // 134
    'Jolteon',        // 135
    'Flareon',        // 136
    'Porygon',        // 137
    'Omanyte',        // 138
    'Omastar',        // 139
    'Kabuto',         // 140
    'Kabutops',       // 141
    'Aerodactyl',     // 142
    'Snorlax',        // 143
    'Articuno',       // 144
    'Zapdos',         // 145
    'Moltres',        // 146
    'Dratini',        // 147
    'Dragonair',      // 148
    'Dragonite',      // 149
    'Mewtwo',         // 150
    'Mew',            // 151
    'Chikorita',      // 152
    'Bayleef',        // 153
    'Meganium',       // 154
    'Cyndaquil',      // 155
    'Quilava',        // 156
    'Typhlosion',     // 157
    'Totodile',       // 158
    'Croconaw',       // 159
    'Feraligatr',     // 160
    'Sentret',        // 161
    'Furret',         // 162
    'Hoothoot',       // 163
    'Noctowl',        // 164
    'Ledyba',         // 165
    'Ledian',         // 166
    'Spinarak',       // 167
    'Ariados',        // 168
    'Crobat',         // 169
    'Chinchou',       // 170
    'Lanturn',        // 171
    'Pichu',          // 172
    'Cleffa',         // 173
    'Igglybuff',      // 174
    'Togepi',         // 175
    'Togetic',        // 176
    'Natu',           // 177
    'Xatu',           // 178
    'Mareep',         // 179
    'Flaaffy',        // 180
    'Ampharos',       // 181
    'Bellossom',      // 182
    'Marill',         // 183
    'Azumarill',      // 184
    'Sudowoodo',      // 185
    'Politoed',       // 186
    'Hoppip',         // 187
    'Skiploom',       // 188
    'Jumpluff',       // 189
    'Aipom',          // 190
    'Sunkern',        // 191
    'Sunflora',       // 192
    'Yanma',          // 193
    'Wooper',         // 194
    'Quagsire',       // 195
    'Espeon',         // 196
    'Umbreon',        // 197
    'Murkrow',        // 198
    'Slowking',       // 199
    'Misdreavus',     // 200
    'Unown',          // 201
    'Wobbuffet',      // 202
    'Girafarig',      // 203
    'Pineco',         // 204
    'Forretress',     // 205
    'Dunsparce',      // 206
    'Gligar',         // 207
    'Steelix',        // 208
    'Snubbull',       // 209
    'Granbull',       // 210
    'Qwilfish',       // 211
    'Scizor',         // 212
    'Shuckle',        // 213
    'Heracross',      // 214
    'Sneasel',        // 215
    'Teddiursa',      // 216
    'Ursaring',       // 217
    'Slugma',         // 218
    'Magcargo',       // 219
    'Swinub',         // 220
    'Piloswine',      // 221
    'Corsola',        // 222
    'Remoraid',       // 223
    'Octillery',      // 224
    'Delibird',       // 225
    'Mantine',        // 226
    'Skarmory',       // 227
    'Houndour',       // 228
    'Houndoom',       // 229
    'Kingdra',        // 230
    'Phanpy',         // 231
    'Donphan',        // 232
    'Porygon2',       // 233
    'Stantler',       // 234
    'Smeargle',       // 235
    'Tyrogue',        // 236
    'Hitmontop',      // 237
    'Smoochum',       // 238
    'Elekid',         // 239
    'Magby',          // 240
    'Miltank',        // 241
    'Blissey',        // 242
    'Raikou',         // 243
    'Entei',          // 244
    'Suicune',        // 245
    'Larvitar',       // 246
    'Pupitar',        // 247
    'Tyranitar',      // 248
    'Lugia',          // 249
    'Ho-Oh',          // 250
    'Celebi',         // 251
];

/**
 * Pokemon types indexed by National Dex ID.
 * Each entry is [type1, type2] using GEN2_TYPE_IDS values.
 * For single-type Pokemon, type2 equals type1.
 *
 * Type IDs: Normal(0), Fighting(1), Flying(2), Poison(3), Ground(4), Rock(5),
 *           Bug(6), Ghost(7), Steel(8), Fire(9), Water(10), Grass(11),
 *           Electric(12), Ice(13), Psychic(14), Dragon(15), Dark(16)
 *
 * @type {Object<number, [number, number]>}
 */
export const GEN2_POKEMON_TYPES = {
    // --- Gen 1 Pokemon (#1-151) ---
    1:   [11, 3],    // Bulbasaur — Grass/Poison
    2:   [11, 3],    // Ivysaur — Grass/Poison
    3:   [11, 3],    // Venusaur — Grass/Poison
    4:   [9, 9],     // Charmander — Fire
    5:   [9, 9],     // Charmeleon — Fire
    6:   [9, 2],     // Charizard — Fire/Flying
    7:   [10, 10],   // Squirtle — Water
    8:   [10, 10],   // Wartortle — Water
    9:   [10, 10],   // Blastoise — Water
    10:  [6, 6],     // Caterpie — Bug
    11:  [6, 6],     // Metapod — Bug
    12:  [6, 2],     // Butterfree — Bug/Flying
    13:  [6, 3],     // Weedle — Bug/Poison
    14:  [6, 3],     // Kakuna — Bug/Poison
    15:  [6, 3],     // Beedrill — Bug/Poison
    16:  [0, 2],     // Pidgey — Normal/Flying
    17:  [0, 2],     // Pidgeotto — Normal/Flying
    18:  [0, 2],     // Pidgeot — Normal/Flying
    19:  [0, 0],     // Rattata — Normal
    20:  [0, 0],     // Raticate — Normal
    21:  [0, 2],     // Spearow — Normal/Flying
    22:  [0, 2],     // Fearow — Normal/Flying
    23:  [3, 3],     // Ekans — Poison
    24:  [3, 3],     // Arbok — Poison
    25:  [12, 12],   // Pikachu — Electric
    26:  [12, 12],   // Raichu — Electric
    27:  [4, 4],     // Sandshrew — Ground
    28:  [4, 4],     // Sandslash — Ground
    29:  [3, 3],     // Nidoran F — Poison
    30:  [3, 3],     // Nidorina — Poison
    31:  [3, 4],     // Nidoqueen — Poison/Ground
    32:  [3, 3],     // Nidoran M — Poison
    33:  [3, 3],     // Nidorino — Poison
    34:  [3, 4],     // Nidoking — Poison/Ground
    35:  [0, 0],     // Clefairy — Normal
    36:  [0, 0],     // Clefable — Normal
    37:  [9, 9],     // Vulpix — Fire
    38:  [9, 9],     // Ninetales — Fire
    39:  [0, 0],     // Jigglypuff — Normal
    40:  [0, 0],     // Wigglytuff — Normal
    41:  [3, 2],     // Zubat — Poison/Flying
    42:  [3, 2],     // Golbat — Poison/Flying
    43:  [11, 3],    // Oddish — Grass/Poison
    44:  [11, 3],    // Gloom — Grass/Poison
    45:  [11, 3],    // Vileplume — Grass/Poison
    46:  [6, 11],    // Paras — Bug/Grass
    47:  [6, 11],    // Parasect — Bug/Grass
    48:  [6, 3],     // Venonat — Bug/Poison
    49:  [6, 3],     // Venomoth — Bug/Poison
    50:  [4, 4],     // Diglett — Ground
    51:  [4, 4],     // Dugtrio — Ground
    52:  [0, 0],     // Meowth — Normal
    53:  [0, 0],     // Persian — Normal
    54:  [10, 10],   // Psyduck — Water
    55:  [10, 10],   // Golduck — Water
    56:  [1, 1],     // Mankey — Fighting
    57:  [1, 1],     // Primeape — Fighting
    58:  [9, 9],     // Growlithe — Fire
    59:  [9, 9],     // Arcanine — Fire
    60:  [10, 10],   // Poliwag — Water
    61:  [10, 10],   // Poliwhirl — Water
    62:  [10, 1],    // Poliwrath — Water/Fighting
    63:  [14, 14],   // Abra — Psychic
    64:  [14, 14],   // Kadabra — Psychic
    65:  [14, 14],   // Alakazam — Psychic
    66:  [1, 1],     // Machop — Fighting
    67:  [1, 1],     // Machoke — Fighting
    68:  [1, 1],     // Machamp — Fighting
    69:  [11, 3],    // Bellsprout — Grass/Poison
    70:  [11, 3],    // Weepinbell — Grass/Poison
    71:  [11, 3],    // Victreebel — Grass/Poison
    72:  [10, 3],    // Tentacool — Water/Poison
    73:  [10, 3],    // Tentacruel — Water/Poison
    74:  [5, 4],     // Geodude — Rock/Ground
    75:  [5, 4],     // Graveler — Rock/Ground
    76:  [5, 4],     // Golem — Rock/Ground
    77:  [9, 9],     // Ponyta — Fire
    78:  [9, 9],     // Rapidash — Fire
    79:  [10, 14],   // Slowpoke — Water/Psychic
    80:  [10, 14],   // Slowbro — Water/Psychic
    81:  [12, 8],    // Magnemite — Electric/Steel (Steel added in Gen 2)
    82:  [12, 8],    // Magneton — Electric/Steel (Steel added in Gen 2)
    83:  [0, 2],     // Farfetch'd — Normal/Flying
    84:  [0, 2],     // Doduo — Normal/Flying
    85:  [0, 2],     // Dodrio — Normal/Flying
    86:  [10, 10],   // Seel — Water (FIX: was incorrectly Poison in Gen 1 data)
    87:  [10, 13],   // Dewgong — Water/Ice
    88:  [3, 3],     // Grimer — Poison
    89:  [3, 3],     // Muk — Poison
    90:  [10, 10],   // Shellder — Water
    91:  [10, 13],   // Cloyster — Water/Ice
    92:  [7, 3],     // Gastly — Ghost/Poison
    93:  [7, 3],     // Haunter — Ghost/Poison
    94:  [7, 3],     // Gengar — Ghost/Poison
    95:  [5, 4],     // Onix — Rock/Ground
    96:  [14, 14],   // Drowzee — Psychic
    97:  [14, 14],   // Hypno — Psychic
    98:  [10, 10],   // Krabby — Water
    99:  [10, 10],   // Kingler — Water
    100: [12, 12],   // Voltorb — Electric
    101: [12, 12],   // Electrode — Electric
    102: [11, 14],   // Exeggcute — Grass/Psychic
    103: [11, 14],   // Exeggutor — Grass/Psychic
    104: [4, 4],     // Cubone — Ground
    105: [4, 4],     // Marowak — Ground
    106: [1, 1],     // Hitmonlee — Fighting
    107: [1, 1],     // Hitmonchan — Fighting
    108: [0, 0],     // Lickitung — Normal
    109: [3, 3],     // Koffing — Poison
    110: [3, 3],     // Weezing — Poison
    111: [4, 5],     // Rhyhorn — Ground/Rock
    112: [4, 5],     // Rhydon — Ground/Rock
    113: [0, 0],     // Chansey — Normal
    114: [11, 11],   // Tangela — Grass
    115: [0, 0],     // Kangaskhan — Normal
    116: [10, 10],   // Horsea — Water
    117: [10, 10],   // Seadra — Water
    118: [10, 10],   // Goldeen — Water
    119: [10, 10],   // Seaking — Water
    120: [10, 10],   // Staryu — Water
    121: [10, 14],   // Starmie — Water/Psychic
    122: [14, 14],   // Mr. Mime — Psychic
    123: [6, 2],     // Scyther — Bug/Flying
    124: [13, 14],   // Jynx — Ice/Psychic
    125: [12, 12],   // Electabuzz — Electric
    126: [9, 9],     // Magmar — Fire
    127: [6, 6],     // Pinsir — Bug
    128: [0, 0],     // Tauros — Normal
    129: [10, 10],   // Magikarp — Water
    130: [10, 2],    // Gyarados — Water/Flying
    131: [10, 13],   // Lapras — Water/Ice
    132: [0, 0],     // Ditto — Normal
    133: [0, 0],     // Eevee — Normal
    134: [10, 10],   // Vaporeon — Water
    135: [12, 12],   // Jolteon — Electric
    136: [9, 9],     // Flareon — Fire
    137: [0, 0],     // Porygon — Normal
    138: [5, 10],    // Omanyte — Rock/Water
    139: [5, 10],    // Omastar — Rock/Water
    140: [5, 10],    // Kabuto — Rock/Water
    141: [5, 10],    // Kabutops — Rock/Water
    142: [5, 2],     // Aerodactyl — Rock/Flying
    143: [0, 0],     // Snorlax — Normal
    144: [13, 2],    // Articuno — Ice/Flying
    145: [12, 2],    // Zapdos — Electric/Flying
    146: [9, 2],     // Moltres — Fire/Flying
    147: [15, 15],   // Dratini — Dragon
    148: [15, 15],   // Dragonair — Dragon
    149: [15, 2],    // Dragonite — Dragon/Flying
    150: [14, 14],   // Mewtwo — Psychic
    151: [14, 14],   // Mew — Psychic

    // --- Gen 2 Pokemon (#152-251) ---
    152: [11, 11],   // Chikorita — Grass
    153: [11, 11],   // Bayleef — Grass
    154: [11, 11],   // Meganium — Grass
    155: [9, 9],     // Cyndaquil — Fire
    156: [9, 9],     // Quilava — Fire
    157: [9, 9],     // Typhlosion — Fire
    158: [10, 10],   // Totodile — Water
    159: [10, 10],   // Croconaw — Water
    160: [10, 10],   // Feraligatr — Water
    161: [0, 0],     // Sentret — Normal
    162: [0, 0],     // Furret — Normal
    163: [0, 2],     // Hoothoot — Normal/Flying
    164: [0, 2],     // Noctowl — Normal/Flying
    165: [6, 2],     // Ledyba — Bug/Flying
    166: [6, 2],     // Ledian — Bug/Flying
    167: [6, 3],     // Spinarak — Bug/Poison
    168: [6, 3],     // Ariados — Bug/Poison
    169: [3, 2],     // Crobat — Poison/Flying
    170: [10, 12],   // Chinchou — Water/Electric
    171: [10, 12],   // Lanturn — Water/Electric
    172: [12, 12],   // Pichu — Electric
    173: [0, 0],     // Cleffa — Normal
    174: [0, 0],     // Igglybuff — Normal
    175: [0, 0],     // Togepi — Normal
    176: [0, 2],     // Togetic — Normal/Flying
    177: [14, 2],    // Natu — Psychic/Flying
    178: [14, 2],    // Xatu — Psychic/Flying
    179: [12, 12],   // Mareep — Electric
    180: [12, 12],   // Flaaffy — Electric
    181: [12, 12],   // Ampharos — Electric
    182: [11, 11],   // Bellossom — Grass
    183: [10, 10],   // Marill — Water
    184: [10, 10],   // Azumarill — Water
    185: [5, 5],     // Sudowoodo — Rock
    186: [10, 10],   // Politoed — Water
    187: [11, 2],    // Hoppip — Grass/Flying
    188: [11, 2],    // Skiploom — Grass/Flying
    189: [11, 2],    // Jumpluff — Grass/Flying
    190: [0, 0],     // Aipom — Normal
    191: [11, 11],   // Sunkern — Grass
    192: [11, 11],   // Sunflora — Grass
    193: [6, 2],     // Yanma — Bug/Flying
    194: [10, 4],    // Wooper — Water/Ground
    195: [10, 4],    // Quagsire — Water/Ground
    196: [14, 14],   // Espeon — Psychic
    197: [16, 16],   // Umbreon — Dark
    198: [16, 2],    // Murkrow — Dark/Flying
    199: [10, 14],   // Slowking — Water/Psychic
    200: [7, 7],     // Misdreavus — Ghost
    201: [14, 14],   // Unown — Psychic
    202: [14, 14],   // Wobbuffet — Psychic
    203: [0, 14],    // Girafarig — Normal/Psychic
    204: [6, 6],     // Pineco — Bug
    205: [6, 8],     // Forretress — Bug/Steel
    206: [0, 0],     // Dunsparce — Normal
    207: [4, 2],     // Gligar — Ground/Flying
    208: [8, 4],     // Steelix — Steel/Ground
    209: [0, 0],     // Snubbull — Normal
    210: [0, 0],     // Granbull — Normal
    211: [10, 3],    // Qwilfish — Water/Poison
    212: [6, 8],     // Scizor — Bug/Steel
    213: [6, 5],     // Shuckle — Bug/Rock
    214: [6, 1],     // Heracross — Bug/Fighting
    215: [16, 13],   // Sneasel — Dark/Ice
    216: [0, 0],     // Teddiursa — Normal
    217: [0, 0],     // Ursaring — Normal
    218: [9, 9],     // Slugma — Fire
    219: [9, 5],     // Magcargo — Fire/Rock
    220: [13, 4],    // Swinub — Ice/Ground
    221: [13, 4],    // Piloswine — Ice/Ground
    222: [10, 5],    // Corsola — Water/Rock
    223: [10, 10],   // Remoraid — Water
    224: [10, 10],   // Octillery — Water
    225: [13, 2],    // Delibird — Ice/Flying
    226: [10, 2],    // Mantine — Water/Flying
    227: [8, 2],     // Skarmory — Steel/Flying
    228: [16, 9],    // Houndour — Dark/Fire
    229: [16, 9],    // Houndoom — Dark/Fire
    230: [10, 15],   // Kingdra — Water/Dragon
    231: [4, 4],     // Phanpy — Ground
    232: [4, 4],     // Donphan — Ground
    233: [0, 0],     // Porygon2 — Normal
    234: [0, 0],     // Stantler — Normal
    235: [0, 0],     // Smeargle — Normal
    236: [1, 1],     // Tyrogue — Fighting
    237: [1, 1],     // Hitmontop — Fighting
    238: [13, 14],   // Smoochum — Ice/Psychic
    239: [12, 12],   // Elekid — Electric
    240: [9, 9],     // Magby — Fire
    241: [0, 0],     // Miltank — Normal
    242: [0, 0],     // Blissey — Normal
    243: [12, 12],   // Raikou — Electric
    244: [9, 9],     // Entei — Fire
    245: [10, 10],   // Suicune — Water
    246: [5, 4],     // Larvitar — Rock/Ground
    247: [5, 4],     // Pupitar — Rock/Ground
    248: [5, 16],    // Tyranitar — Rock/Dark
    249: [14, 2],    // Lugia — Psychic/Flying
    250: [9, 2],     // Ho-Oh — Fire/Flying
    251: [14, 11],   // Celebi — Psychic/Grass
};

/**
 * Pokemon gender ratios indexed by National Dex ID.
 * Each value is one of:
 *   - 'genderless' : No gender (legendaries, Magnemite, Porygon, etc.)
 *   - 'all-male'   : 100% male (Tauros, Hitmonlee, Hitmonchan, etc.)
 *   - 'male-87.5'  : 87.5% male / 12.5% female (starters, fossils, Eevee, etc.)
 *   - 'male-75'    : 75% male / 25% female (Growlithe, Abra, Machop, etc.)
 *   - 'male-50'    : 50% male / 50% female (most Pokemon)
 *   - 'female-75'  : 25% male / 75% female (Vulpix, Clefairy, Jigglypuff, etc.)
 *   - 'all-female' : 100% female (Chansey, Jynx, Miltank, etc.)
 *
 * @type {Object<number, string>}
 */
export const GEN2_GENDER_RATIOS = {
    // --- Gen 1 Pokemon (#1-151) ---
    1:   'male-87.5',   // Bulbasaur (starter)
    2:   'male-87.5',   // Ivysaur
    3:   'male-87.5',   // Venusaur
    4:   'male-87.5',   // Charmander (starter)
    5:   'male-87.5',   // Charmeleon
    6:   'male-87.5',   // Charizard
    7:   'male-87.5',   // Squirtle (starter)
    8:   'male-87.5',   // Wartortle
    9:   'male-87.5',   // Blastoise
    10:  'male-50',     // Caterpie
    11:  'male-50',     // Metapod
    12:  'male-50',     // Butterfree
    13:  'male-50',     // Weedle
    14:  'male-50',     // Kakuna
    15:  'male-50',     // Beedrill
    16:  'male-50',     // Pidgey
    17:  'male-50',     // Pidgeotto
    18:  'male-50',     // Pidgeot
    19:  'male-50',     // Rattata
    20:  'male-50',     // Raticate
    21:  'male-50',     // Spearow
    22:  'male-50',     // Fearow
    23:  'male-50',     // Ekans
    24:  'male-50',     // Arbok
    25:  'male-50',     // Pikachu
    26:  'male-50',     // Raichu
    27:  'male-50',     // Sandshrew
    28:  'male-50',     // Sandslash
    29:  'all-female',  // Nidoran F
    30:  'all-female',  // Nidorina
    31:  'all-female',  // Nidoqueen
    32:  'all-male',    // Nidoran M
    33:  'all-male',    // Nidorino
    34:  'all-male',    // Nidoking
    35:  'female-75',   // Clefairy
    36:  'female-75',   // Clefable
    37:  'female-75',   // Vulpix
    38:  'female-75',   // Ninetales
    39:  'female-75',   // Jigglypuff
    40:  'female-75',   // Wigglytuff
    41:  'male-50',     // Zubat
    42:  'male-50',     // Golbat
    43:  'male-50',     // Oddish
    44:  'male-50',     // Gloom
    45:  'male-50',     // Vileplume
    46:  'male-50',     // Paras
    47:  'male-50',     // Parasect
    48:  'male-50',     // Venonat
    49:  'male-50',     // Venomoth
    50:  'male-50',     // Diglett
    51:  'male-50',     // Dugtrio
    52:  'male-50',     // Meowth
    53:  'male-50',     // Persian
    54:  'male-50',     // Psyduck
    55:  'male-50',     // Golduck
    56:  'male-50',     // Mankey
    57:  'male-50',     // Primeape
    58:  'male-75',     // Growlithe
    59:  'male-75',     // Arcanine
    60:  'male-50',     // Poliwag
    61:  'male-50',     // Poliwhirl
    62:  'male-50',     // Poliwrath
    63:  'male-75',     // Abra
    64:  'male-75',     // Kadabra
    65:  'male-75',     // Alakazam
    66:  'male-75',     // Machop
    67:  'male-75',     // Machoke
    68:  'male-75',     // Machamp
    69:  'male-50',     // Bellsprout
    70:  'male-50',     // Weepinbell
    71:  'male-50',     // Victreebel
    72:  'male-50',     // Tentacool
    73:  'male-50',     // Tentacruel
    74:  'male-50',     // Geodude
    75:  'male-50',     // Graveler
    76:  'male-50',     // Golem
    77:  'male-50',     // Ponyta
    78:  'male-50',     // Rapidash
    79:  'male-50',     // Slowpoke
    80:  'male-50',     // Slowbro
    81:  'genderless',  // Magnemite
    82:  'genderless',  // Magneton
    83:  'male-50',     // Farfetch'd
    84:  'male-50',     // Doduo
    85:  'male-50',     // Dodrio
    86:  'male-50',     // Seel
    87:  'male-50',     // Dewgong
    88:  'male-50',     // Grimer
    89:  'male-50',     // Muk
    90:  'male-50',     // Shellder
    91:  'male-50',     // Cloyster
    92:  'male-50',     // Gastly
    93:  'male-50',     // Haunter
    94:  'male-50',     // Gengar
    95:  'male-50',     // Onix
    96:  'male-50',     // Drowzee
    97:  'male-50',     // Hypno
    98:  'male-50',     // Krabby
    99:  'male-50',     // Kingler
    100: 'genderless',  // Voltorb
    101: 'genderless',  // Electrode
    102: 'male-50',     // Exeggcute
    103: 'male-50',     // Exeggutor
    104: 'male-50',     // Cubone
    105: 'male-50',     // Marowak
    106: 'all-male',    // Hitmonlee
    107: 'all-male',    // Hitmonchan
    108: 'male-50',     // Lickitung
    109: 'male-50',     // Koffing
    110: 'male-50',     // Weezing
    111: 'male-50',     // Rhyhorn
    112: 'male-50',     // Rhydon
    113: 'all-female',  // Chansey
    114: 'male-50',     // Tangela
    115: 'all-female',  // Kangaskhan
    116: 'male-50',     // Horsea
    117: 'male-50',     // Seadra
    118: 'male-50',     // Goldeen
    119: 'male-50',     // Seaking
    120: 'genderless',  // Staryu
    121: 'genderless',  // Starmie
    122: 'male-50',     // Mr. Mime
    123: 'male-50',     // Scyther
    124: 'all-female',  // Jynx
    125: 'male-75',     // Electabuzz
    126: 'male-75',     // Magmar
    127: 'male-50',     // Pinsir
    128: 'all-male',    // Tauros
    129: 'male-50',     // Magikarp
    130: 'male-50',     // Gyarados
    131: 'male-50',     // Lapras
    132: 'genderless',  // Ditto
    133: 'male-87.5',   // Eevee
    134: 'male-87.5',   // Vaporeon
    135: 'male-87.5',   // Jolteon
    136: 'male-87.5',   // Flareon
    137: 'genderless',  // Porygon
    138: 'male-87.5',   // Omanyte (fossil)
    139: 'male-87.5',   // Omastar (fossil)
    140: 'male-87.5',   // Kabuto (fossil)
    141: 'male-87.5',   // Kabutops (fossil)
    142: 'male-87.5',   // Aerodactyl (fossil)
    143: 'male-87.5',   // Snorlax
    144: 'genderless',  // Articuno (legendary)
    145: 'genderless',  // Zapdos (legendary)
    146: 'genderless',  // Moltres (legendary)
    147: 'male-50',     // Dratini
    148: 'male-50',     // Dragonair
    149: 'male-50',     // Dragonite
    150: 'genderless',  // Mewtwo (legendary)
    151: 'genderless',  // Mew (mythical)

    // --- Gen 2 Pokemon (#152-251) ---
    152: 'male-87.5',   // Chikorita (starter)
    153: 'male-87.5',   // Bayleef
    154: 'male-87.5',   // Meganium
    155: 'male-87.5',   // Cyndaquil (starter)
    156: 'male-87.5',   // Quilava
    157: 'male-87.5',   // Typhlosion
    158: 'male-87.5',   // Totodile (starter)
    159: 'male-87.5',   // Croconaw
    160: 'male-87.5',   // Feraligatr
    161: 'male-50',     // Sentret
    162: 'male-50',     // Furret
    163: 'male-50',     // Hoothoot
    164: 'male-50',     // Noctowl
    165: 'male-50',     // Ledyba
    166: 'male-50',     // Ledian
    167: 'male-50',     // Spinarak
    168: 'male-50',     // Ariados
    169: 'male-50',     // Crobat
    170: 'male-50',     // Chinchou
    171: 'male-50',     // Lanturn
    172: 'male-50',     // Pichu
    173: 'female-75',   // Cleffa
    174: 'female-75',   // Igglybuff
    175: 'male-87.5',   // Togepi
    176: 'male-87.5',   // Togetic
    177: 'male-50',     // Natu
    178: 'male-50',     // Xatu
    179: 'male-50',     // Mareep
    180: 'male-50',     // Flaaffy
    181: 'male-50',     // Ampharos
    182: 'male-50',     // Bellossom
    183: 'male-50',     // Marill
    184: 'male-50',     // Azumarill
    185: 'male-50',     // Sudowoodo
    186: 'male-50',     // Politoed
    187: 'male-50',     // Hoppip
    188: 'male-50',     // Skiploom
    189: 'male-50',     // Jumpluff
    190: 'male-50',     // Aipom
    191: 'male-50',     // Sunkern
    192: 'male-50',     // Sunflora
    193: 'male-50',     // Yanma
    194: 'male-50',     // Wooper
    195: 'male-50',     // Quagsire
    196: 'male-87.5',   // Espeon (Eevee evolution)
    197: 'male-87.5',   // Umbreon (Eevee evolution)
    198: 'male-50',     // Murkrow
    199: 'male-50',     // Slowking
    200: 'male-50',     // Misdreavus
    201: 'genderless',  // Unown
    202: 'male-50',     // Wobbuffet
    203: 'male-50',     // Girafarig
    204: 'male-50',     // Pineco
    205: 'male-50',     // Forretress
    206: 'male-50',     // Dunsparce
    207: 'male-50',     // Gligar
    208: 'male-50',     // Steelix
    209: 'female-75',   // Snubbull
    210: 'female-75',   // Granbull
    211: 'male-50',     // Qwilfish
    212: 'male-50',     // Scizor
    213: 'male-50',     // Shuckle
    214: 'male-50',     // Heracross
    215: 'male-50',     // Sneasel
    216: 'male-50',     // Teddiursa
    217: 'male-50',     // Ursaring
    218: 'male-50',     // Slugma
    219: 'male-50',     // Magcargo
    220: 'male-50',     // Swinub
    221: 'male-50',     // Piloswine
    222: 'female-75',   // Corsola
    223: 'male-50',     // Remoraid
    224: 'male-50',     // Octillery
    225: 'male-50',     // Delibird
    226: 'male-50',     // Mantine
    227: 'male-50',     // Skarmory
    228: 'male-50',     // Houndour
    229: 'male-50',     // Houndoom
    230: 'male-50',     // Kingdra
    231: 'male-50',     // Phanpy
    232: 'male-50',     // Donphan
    233: 'genderless',  // Porygon2
    234: 'male-50',     // Stantler
    235: 'male-50',     // Smeargle
    236: 'all-male',    // Tyrogue
    237: 'all-male',    // Hitmontop
    238: 'all-female',  // Smoochum
    239: 'male-75',     // Elekid
    240: 'male-75',     // Magby
    241: 'all-female',  // Miltank
    242: 'all-female',  // Blissey
    243: 'genderless',  // Raikou (legendary beast)
    244: 'genderless',  // Entei (legendary beast)
    245: 'genderless',  // Suicune (legendary beast)
    246: 'male-50',     // Larvitar
    247: 'male-50',     // Pupitar
    248: 'male-50',     // Tyranitar
    249: 'genderless',  // Lugia (legendary)
    250: 'genderless',  // Ho-Oh (legendary)
    251: 'genderless',  // Celebi (mythical)
};
