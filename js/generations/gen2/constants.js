/**
 * constants.js — Generation II Save File Offsets and Constants
 * 
 * Offsets for Pokemon Gold, Silver, and Crystal save file format.
 * Gen 2 uses a different memory layout from Gen 1, with two checksum regions
 * and a Real-Time Clock (RTC) system.
 * 
 * Save file size: 32768 bytes
 * Checksums: Two regions (0x2009-0x2B82 and 0x2B83-0x7FFF or similar)
 */

export const GEN2_OFFSETS = {
    // --- Trainer Info ---
    PLAYER_NAME: 0x200B,
    PLAYER_ID: 0x2009,
    MONEY: 0x200F,         // BCD, 3 bytes
    RIVAL_NAME: 0x2021,
    DAYLIGHT_SAVINGS: 0x202E,
    TIME_PLAYED: 0x2053,   // 5 bytes (hours LSB, hours MSB, minutes, seconds, frames)
    PHONE_LIST: 0x2067,
    BADGES: 0x2425,        // Johto badges byte + Kanto badges byte
    PLAYER_GENDER: 0x2020, // Crystal only: 0x00 = Male, 0x01 = Female
    
    // --- Options ---
    OPTIONS: 0x2079,
    
    // --- RTC ---
    RTC_HOURS: 0x204D,     // 2 bytes little-endian
    RTC_DAYS: 0x2051,      // 2 bytes (day count, used for time-based events)
    
    // --- Pokedex ---
    POKEDEX_OWNED: 0x2427, // 32 bytes (251 bits + padding)
    POKEDEX_SEEN: 0x2447,  // 32 bytes (251 bits + padding)
    
    // --- Items ---
    BAG_ITEMS: 0x247D,     // Bag pocket (20 slots, count byte + pairs of id/count)
    BALL_ITEMS: 0x24A7,    // Ball pocket (12 slots) - GSC only
    KEY_ITEMS: 0x24BF,     // Key items pocket (25 slots) - GSC only
    TM_HM_ITEMS: 0x24F5,   // TM/HM pocket (57 slots) - GSC only
    PC_ITEMS: 0x254D,      // PC items (50 slots)
    
    // --- Party ---
    PARTY_COUNT: 0x2563,
    PARTY_SPECIES: 0x2564, // 6 species bytes + 0xFF terminator
    PARTY_OT_NAMES: 0x256B, // 6 * 11 bytes (name length 10 + term)
    PARTY_NICKNAMES: 0x25AD, // 6 * 11 bytes
    PARTY_STRUCTS: 0x25EF,  // 6 * 48 bytes (party Pokemon struct)
    
    // --- Pokemon Struct Sizes ---
    PARTY_MON_SIZE: 48,
    BOX_MON_SIZE: 32,
    
    // --- PC Boxes ---
    CURRENT_BOX: 0x2707,
    BOX_NAMES: 0x2708,    // 14 * 9 bytes (8 char name + term)
    
    // Box data layout in save:
    // Box 1: 0x2756 (current box)
    // Boxes 2-7: Bank 0x4000-0x5FFF
    // Boxes 8-14: Bank 0x6000-0x7FFF
    CURRENT_BOX_DATA: 0x2756,
    BOX_BANK_1: 0x4000,   // Boxes 2-7 (6 boxes)
    BOX_BANK_2: 0x6000,   // Boxes 8-14 (7 boxes)
    
    BOX_STRUCT_SIZE: 0x20 + (20 * 32) + (20 * 11) + (20 * 11),
    // Each box: species list (21 bytes: 20 species + FF term) + 20 structs (32 bytes each) + 20 OT names (11 bytes each) + 20 nicknames (11 bytes each)
    
    // --- Daycare ---
    DAYCARE_IN_USE: 0x2D4B,
    DAYCARE_MON: 0x2D4C,    // 32 bytes box format
    DAYCARE_OT: 0x2D6C,     // 11 bytes
    DAYCARE_NICK: 0x2D77,   // 11 bytes
    DAYCARE_STEPS: 0x2D82,  // 4 bytes
    
    // --- Checksums ---
    CHECKSUM_1: 0x2D0D,     // Checksum for 0x2009-0x2D0C
    CHECKSUM_2: 0x7F6D,     // Checksum for 0x2D0E-0x7F6C (bank 2)
    
    // Checksum ranges
    CHECKSUM_1_START: 0x2009,
    CHECKSUM_1_END: 0x2D0C,
    CHECKSUM_2_START: 0x2D0E,
    CHECKSUM_2_END: 0x7F6C,
    
    // --- Map Data ---
    MAP_ID: 0x207E,
    
    // --- Hall of Fame ---
    HALL_OF_FAME: 0x0C6D,  // In a different bank
    
    // --- Encryption ---
    SAVE_ENCRYPTION_KEY: 0x0F51, // Used for some Crystal data
    
    // --- Crystal-specific ---
    MOBILE_PHONE: 0x2581,
    
    // --- Game Title Offsets ---
    GAME_TITLE_OFFSET: 0x134,
};

// Gen 2 Pokemon struct offsets (within a party Pokemon struct)
export const GEN2_PARTY_STRUCT = {
    SPECIES: 0x00,       // 1 byte (internal species ID)
    HELD_ITEM: 0x01,     // 1 byte
    MOVES: 0x02,         // 4 bytes
    TRAINER_ID: 0x06,    // 2 bytes big-endian
    EXPERIENCE: 0x08,    // 3 bytes big-endian
    HP_EV: 0x0B,         // 2 bytes big-endian
    ATK_EV: 0x0D,        // 2 bytes big-endian
    DEF_EV: 0x0F,        // 2 bytes big-endian
    SPD_EV: 0x11,        // 2 bytes big-endian
    SPC_EV: 0x13,        // 2 bytes big-endian (shared SpAtk/SpDef EVs)
    DVS: 0x15,           // 2 bytes (packed: Atk/Def/Spd/Spc, 4 bits each)
    POKERUS: 0x17,       // 1 byte
    FRIENDSHIP: 0x18,    // 1 byte (called "Happiness")
    EGG_STEPS: 0x19,     // 2 bytes big-endian (non-egg: pokerus+friendship+etc.)
    
    // Party-only fields (not in box struct):
    LEVEL: 0x1B,          // 1 byte
    STATUS: 0x1C,         // 1 byte
    UNUSED: 0x1D,         // 1 byte
    CURRENT_HP: 0x1E,     // 2 bytes big-endian
    MAX_HP: 0x20,         // 2 bytes big-endian
    ATTACK: 0x22,         // 2 bytes big-endian
    DEFENSE: 0x24,        // 2 bytes big-endian
    SPEED: 0x26,          // 2 bytes big-endian
    SP_ATK: 0x28,         // 2 bytes big-endian
    SP_DEF: 0x2A,         // 2 bytes big-endian
};

// Gen 2 Box Pokemon struct offsets (subset of party struct)
export const GEN2_BOX_STRUCT = {
    SPECIES: 0x00,       // 1 byte
    HELD_ITEM: 0x01,     // 1 byte
    MOVES: 0x02,         // 4 bytes
    TRAINER_ID: 0x06,    // 2 bytes big-endian
    EXPERIENCE: 0x08,    // 3 bytes big-endian
    HP_EV: 0x0B,         // 2 bytes big-endian
    ATK_EV: 0x0D,        // 2 bytes big-endian
    DEF_EV: 0x0F,        // 2 bytes big-endian
    SPD_EV: 0x11,        // 2 bytes big-endian
    SPC_EV: 0x13,        // 2 bytes big-endian
    DVS: 0x15,           // 2 bytes
    POKERUS: 0x17,       // 1 byte
    FRIENDSHIP: 0x18,    // 1 byte
    EGG_STEPS: 0x19,     // 2 bytes big-endian
};

// Gen 2 Internal Species ID to National Dex ID mapping
// In Gen 2, the internal order is very close to the National Dex order (1-251)
// but there are some key differences (e.g., Chikorita starts at internal ID 152)
export const GEN2_INTERNAL_TO_DEX = [
    0,     // 0:空白/Placeholder
    1,     // 1: Bulbasaur
    2,     // 2: Ivysaur
    3,     // 3: Venusaur
    4,     // 4: Charmander
    5,     // 5: Charmeleon
    6,     // 6: Charizard
    7,     // 7: Squirtle
    8,     // 8: Wartortle
    9,     // 9: Blastoise
    10,    // 10: Caterpie
    11,    // 11: Metapod
    12,    // 12: Butterfree
    13,    // 13: Weedle
    14,    // 14: Kakuna
    15,    // 15: Beedrill
    16,    // 16: Pidgey
    17,    // 17: Pidgeotto
    18,    // 18: Pidgeot
    19,    // 19: Rattata
    20,    // 20: Raticate
    21,    // 21: Spearow
    22,    // 22: Fearow
    23,    // 23: Ekans
    24,    // 24: Arbok
    25,    // 25: Pikachu
    26,    // 26: Raichu
    27,    // 27: Sandshrew
    28,    // 28: Sandslash
    29,    // 29: NidoranF
    30,    // 30: Nidorina
    31,    // 31: Nidoqueen
    32,    // 32: NidoranM
    33,    // 33: Nidorino
    34,    // 34: Nidoking
    35,    // 35: Clefairy
    36,    // 36: Clefable
    37,    // 37: Vulpix
    38,    // 38: Ninetales
    39,    // 39: Jigglypuff
    40,    // 40: Wigglytuff
    41,    // 41: Zubat
    42,    // 42: Golbat
    43,    // 43: Oddish
    44,    // 44: Gloom
    45,    // 45: Vileplume
    46,    // 46: Paras
    47,    // 47: Parasect
    48,    // 48: Venonat
    49,    // 49: Venomoth
    50,    // 50: Diglett
    51,    // 51: Dugtrio
    52,    // 52: Meowth
    53,    // 53: Persian
    54,    // 54: Psyduck
    55,    // 55: Golduck
    56,    // 56: Mankey
    57,    // 57: Primeape
    58,    // 58: Growlithe
    59,    // 59: Arcanine
    60,    // 60: Poliwag
    61,    // 61: Poliwhirl
    62,    // 62: Poliwrath
    63,    // 63: Abra
    64,    // 64: Kadabra
    65,    // 65: Alakazam
    66,    // 66: Machop
    67,    // 67: Machoke
    68,    // 68: Machamp
    69,    // 69: Bellsprout
    70,    // 70: Weepinbell
    71,    // 71: Victreebel
    72,    // 72: Tentacool
    73,    // 73: Tentacruel
    74,    // 74: Geodude
    75,    // 75: Graveler
    76,    // 76: Golem
    77,    // 77: Ponyta
    78,    // 78: Rapidash
    79,    // 79: Slowpoke
    80,    // 80: Slowbro
    81,    // 81: Magnemite
    82,    // 82: Magneton
    83,    // 83: Farfetch'd
    84,    // 84: Doduo
    85,    // 85: Dodrio
    86,    // 86: Seel
    87,    // 87: Dewgong
    88,    // 88: Grimer
    89,    // 89: Muk
    90,    // 90: Shellder
    91,    // 91: Cloyster
    92,    // 92: Gastly
    93,    // 93: Haunter
    94,    // 94: Gengar
    95,    // 95: Onix
    96,    // 96: Drowzee
    97,    // 97: Hypno
    98,    // 98: Krabby
    99,    // 99: Kingler
    100,   // 100: Voltorb
    101,   // 101: Electrode
    102,   // 102: Exeggcute
    103,   // 103: Exeggutor
    104,   // 104: Cubone
    105,   // 105: Marowak
    106,   // 106: Hitmonlee
    107,   // 107: Hitmonchan
    108,   // 108: Lickitung
    109,   // 109: Koffing
    110,   // 110: Weezing
    111,   // 111: Rhyhorn
    112,   // 112: Rhydon
    113,   // 113: Chansey
    114,   // 114: Blissey (Gen2!)
    115,   // 115: Tangela
    116,   // 116: Kangaskhan
    117,   // 117: Horsea
    118,   // 118: Seadra
    119,   // 119: Goldeen
    120,   // 120: Seaking
    121,   // 121: Staryu
    122,   // 122: Starmie
    123,   // 123: Mr. Mime
    124,   // 124: Scyther
    125,   // 125: Smoochum (Gen2!)
    126,   // 126: Jynx
    127,   // 127: Electabuzz
    128,   // 128: Magmar
    129,   // 129: Pinsir
    130,   // 130: Tauros
    131,   // 131: Magikarp
    132,   // 132: Gyarados
    133,   // 133: Lapras
    134,   // 134: Ditto
    135,   // 135: Eevee
    136,   // 136: Vaporeon
    137,   // 137: Jolteon
    138,   // 138: Flareon
    139,   // 139: Porygon
    140,   // 140: Omanyte
    141,   // 141: Omastar
    142,   // 142: Kabuto
    143,   // 143: Kabutops
    144,   // 144: Aerodactyl
    145,   // 145: Snorlax
    146,   // 146: Articuno
    147,   // 147: Zapdos
    148,   // 148: Moltres
    149,   // 149: Dratini
    150,   // 150: Dragonair
    151,   // 151: Dragonite
    152,   // 152: Mewtwo
    153,   // 153: Mew
    154,   // 154: Chikorita (Gen2!)
    155,   // 155: Bayleef
    156,   // 156: Meganium
    157,   // 157: Cyndaquil
    158,   // 158: Quilava
    159,   // 159: Typhlosion
    160,   // 160: Totodile
    161,   // 161: Croconaw
    162,   // 162: Feraligatr
    163,   // 163: Sentret
    164,   // 164: Furret
    165,   // 165: Hoothoot
    166,   // 166: Noctowl
    167,   // 167: Ledyba
    168,   // 168: Ledian
    169,   // 169: Spinarak
    170,   // 170: Ariados
    171,   // 171: Crobat
    172,   // 172: Chinchou
    173,   // 173: Lanturn
    174,   // 174: Pichu
    175,   // 175: Cleffa
    176,   // 176: Igglybuff
    177,   // 177: Togepi
    178,   // 178: Togetic
    179,   // 179: Natu
    180,   // 180: Xatu
    181,   // 181: Mareep
    182,   // 182: Flaaffy
    183,   // 183: Ampharos
    184,   // 184: Bellossom
    185,   // 185: Marill
    186,   // 186: Azumarill
    187,   // 187: Sudowoodo
    188,   // 188: Politoed
    189,   // 189: Hoppip
    190,   // 190: Skiploom
    191,   // 191: Jumpluff
    192,   // 192: Aipom
    193,   // 193: Sunkern
    194,   // 194: Sunflora
    195,   // 195: Yanma
    196,   // 196: Wooper
    197,   // 197: Quagsire
    198,   // 198: Espeon
    199,   // 199: Umbreon
    200,   // 200: Murkrow
    201,   // 201: Slowking
    202,   // 202: Misdreavus
    203,   // 203: Unown
    204,   // 204: Wobbuffet
    205,   // 205: Girafarig
    206,   // 206: Pineco
    207,   // 207: Forretress
    208,   // 208: Dunsparce
    209,   // 209: Gligar
    210,   // 210: Steelix
    211,   // 211: Snubbull
    212,   // 212: Granbull
    213,   // 213: Qwilfish
    214,   // 214: Scizor
    215,   // 215: Shuckle
    216,   // 216: Heracross
    217,   // 217: Sneasel
    218,   // 218: Teddiursa
    219,   // 219: Ursaring
    220,   // 220: Slugma
    221,   // 221: Magcargo
    222,   // 222: Swinub
    223,   // 223: Piloswine
    224,   // 224: Corsola
    225,   // 225: Remoraid
    226,   // 226: Octillery
    227,   // 227: Delibird
    228,   // 228: Mantine
    229,   // 229: Skarmory
    230,   // 230: Houndour
    231,   // 231: Houndoom
    232,   // 232: Kingdra
    233,   // 233: Phanpy
    234,   // 234: Donphan
    235,   // 235: Porygon2
    236,   // 236: Stantler
    237,   // 237: Smeargle
    238,   // 238: Tyrogue
    239,   // 239: Hitmontop
    240,   // 240: Smoochum (duplicate at different internal ID - egg)
    241,   // 241: Elekid
    242,   // 242: Magby
    243,   // 243: Miltank
    244,   // 244: Blissey
    245,   // 245: Raikou
    246,   // 246: Entei
    247,   // 247: Suicune
    248,   // 248: Larvitar
    249,   // 249: Pupitar
    250,   // 250: Tyranitar
    251,   // 251: Lugia
    252,   // 252: Ho-Oh
    253,   // 253: Celebi
];

// Type IDs for Gen 2 (added Steel and Dark)
export const GEN2_TYPE_IDS = {
    NORMAL: 0,
    FIGHTING: 1,
    FLYING: 2,
    POISON: 3,
    GROUND: 4,
    ROCK: 5,
    BUG: 6,
    GHOST: 7,
    STEEL: 8,    // NEW in Gen 2
    FIRE: 9,
    WATER: 10,
    GRASS: 11,
    ELECTRIC: 12,
    ICE: 13,
    PSYCHIC: 14,
    DRAGON: 15,
    DARK: 16,    // NEW in Gen 2
};

// Type names indexed by type ID
export const GEN2_TYPE_NAMES = [
    'Normal', 'Fighting', 'Flying', 'Poison', 'Ground',
    'Rock', 'Bug', 'Ghost', 'Steel', 'Fire',
    'Water', 'Grass', 'Electric', 'Ice', 'Psychic',
    'Dragon', 'Dark'
];

// Gender ratio thresholds (from DVs)
// The Attack DV determines gender:
// - If Attack DV >= threshold, Pokemon is Female
// - Threshold depends on the species' gender ratio
export const GEN2_GENDER_THRESHOLDS = {
    GENDERLESS: -1,     // e.g., Magnemite, Mewtwo
    ALL_MALE: 0,         // e.g., Tauros (0% female)
    MALE_87_5: 1,       // e.g., Starters (12.5% female: Atk DV 0)
    MALE_75: 4,         // e.g., Eevee (25% female: Atk DV 0-3)
    MALE_50: 7,         // e.g., Pikachu (50% female: Atk DV 0-6)
    FEMALE_75: 11,      // e.g., Vulpix (75% female: Atk DV 0-11)
    ALL_FEMALE: 15,     // e.g., Miltank (100% female)
};

// Shiny determination from DVs in Gen 2
// A Pokemon is shiny if all of the following are true:
// - Defense DV = 10
// - Special DV = 10
// - Speed DV = 10
// - Attack DV is 2, 3, 6, 7, 10, 11, 14, or 15
export const GEN2_SHINY_ATTACK_DVS = [2, 3, 6, 7, 10, 11, 14, 15];
export const GEN2_SHINY_STAT_DV = 10;

// Capacity limits
export const GEN2_LIMITS = {
    MAX_PARTY: 6,
    BOX_CAPACITY: 20,
    BOX_COUNT: 14,
    MAX_BAG_ITEMS: 20,
    MAX_BALL_ITEMS: 12,
    MAX_KEY_ITEMS: 25,
    MAX_TM_HM_ITEMS: 57,
    MAX_PC_ITEMS: 50,
    MAX_MOVES: 4,
    MAX_LEVEL: 100,
    MAX_EVS: 65535,
    MAX_DVS: 15,
    MAX_FRIENDSHIP: 255,
    MAX_POKERUS: 15,
};

// Egg constant
export const GEN2_EGG_SPECIES_ID = 253; // Internal species ID for eggs
export const GEN2_EGG_DEX_ID = 0;       // Eggs have no dex ID
