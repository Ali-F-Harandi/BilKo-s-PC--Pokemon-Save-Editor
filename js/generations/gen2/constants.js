/**
 * constants.js — Generation II Save File Offsets and Constants
 * 
 * Offsets for Pokemon Gold, Silver, and Crystal save file format.
 * Gen 2 uses a different memory layout from Gen 1, with two checksum regions
 * and a Real-Time Clock (RTC) system.
 * 
 * VERIFIED against PKHeX reverse engineering analysis.
 * 
 * Save file sizes:
 *   International (Gold/Silver/Crystal): 32768 bytes (0x8000)
 *   Japanese (Gold/Silver): 65536 bytes (0x10000)
 * Checksums: Plain 16-bit additive sum, stored little-endian (NOT 1's complement!)
 */

export const GEN2_OFFSETS = {
    // --- Trainer Info ---
    PLAYER_NAME: 0x200B,
    PLAYER_ID: 0x2009,
    MONEY: 0x200F,         // 3 bytes big-endian integer (NOT BCD!)
    RIVAL_NAME: 0x2021,
    DAYLIGHT_SAVINGS: 0x202E,
    TIME_PLAYED: 0x2053,   // 5 bytes (hours LSB, hours MSB, minutes, seconds, frames)
    PHONE_LIST: 0x2067,
    BADGES: 0x2425,        // Johto badges byte + Kanto badges byte
    PLAYER_GENDER: 0x3E3D, // Crystal only: 0x00 = Male, 0x01 = Female
    
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
    
    // --- Checksums (Game Variant Specific) ---
    // Default: Crystal International. See GEN2_CHECKSUM_VARIANTS for per-game offsets.
    CHECKSUM_1: 0x2D0D,     // Default: Crystal
    CHECKSUM_2: 0x7F6D,     // Default: Crystal bank 2
    
    // Checksum ranges (default: Crystal International)
    CHECKSUM_1_START: 0x2009,
    CHECKSUM_1_END: 0x2B82,
    CHECKSUM_2_START: 0x1209,
    CHECKSUM_2_END: 0x1D82,
    
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
    
    // --- Event Flags ---
    EVENT_FLAGS_START: 0x2400,
    EVENT_FLAGS_NUM_BYTES: 32,
};

/**
 * Per-game-variant checksum offsets.
 * Gen 2 uses PLAIN 16-bit additive sum stored as u16 little-endian.
 * This is NOT 1's complement!
 */
export const GEN2_CHECKSUM_VARIANTS = {
    'gs-int': {
        name: 'Gold/Silver (International)',
        checksum1: { start: 0x2009, end: 0x2D68, store: 0x2D69 },
        checksum2: { start: 0x2D6E, end: 0x7E6C, store: 0x7E6D },
    },
    'gs-jpn': {
        name: 'Gold/Silver (Japanese)',
        checksum1: { start: 0x2009, end: 0x2C8B, store: 0x2D0D },
        checksum2: null, // Japanese GS has different bank layout
    },
    'c-int': {
        name: 'Crystal (International)',
        checksum1: { start: 0x2009, end: 0x2B82, store: 0x2D0D },
        checksum2: { start: 0x1209, end: 0x1D82, store: 0x1F0D },
    },
    'c-jpn': {
        name: 'Crystal (Japanese)',
        checksum1: { start: 0x2009, end: 0x2B82, store: 0x2D0D },
        checksum2: { start: 0x1209, end: 0x1D82, store: 0x1F0D },
    },
};

/**
 * Backup region data for each game variant.
 * After writing, critical data must be duplicated to backup regions.
 */
export const GEN2_BACKUP_REGIONS = {
    'gs-int': [
        { src: 0x2009, dst: 0x15C7, len: 0x222F - 0x2009 + 1 },
        { src: 0x2230, dst: 0x3B2C, len: 0x2407 - 0x2230 + 1 },
        { src: 0x2408, dst: 0x492C, len: 0x2457 - 0x2408 + 1 },
        { src: 0x2458, dst: 0x5B2C, len: 0x2487 - 0x2458 + 1 },
        { src: 0x2488, dst: 0x632C, len: 0x2B82 - 0x2488 + 1 },
    ],
    'c-int': [
        { src: 0x2009, dst: 0x1209, len: 0x2B83 - 0x2009 },
    ],
};

// ============================================================
// Gen 2 PK2 Pokemon Structure Offsets (VERIFIED from PKHeX)
// ============================================================

/**
 * Gen 2 Party Pokemon struct offsets (48 bytes total).
 * IMPORTANT: PP/PPUps are at offsets 0x17-0x1A (4 bytes).
 * Previous versions had these wrong — Pokerus is at 0x1C, not 0x17.
 */
export const GEN2_PARTY_STRUCT = {
    SPECIES: 0x00,       // 1 byte (National Dex in Gen2, unlike Gen1 internal IDs)
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
    PP_UPS: 0x17,        // 4 bytes (bits5-0=PP, bits7-6=PPUps per move)
    FRIENDSHIP: 0x1B,    // 1 byte (also called "Happiness")
    POKERUS: 0x1C,       // 1 byte (high nibble=strain, low nibble=days)
    CAUGHT_DATA: 0x1D,   // 2 bytes (Crystal only: met location + time + OT gender)
    
    // Party-only fields (not in box struct):
    LEVEL: 0x1F,          // 1 byte
    STATUS: 0x20,         // 1 byte
    UNUSED: 0x21,         // 1 byte
    CURRENT_HP: 0x22,     // 2 bytes big-endian
    MAX_HP: 0x24,         // 2 bytes big-endian
    ATTACK: 0x26,         // 2 bytes big-endian
    DEFENSE: 0x28,        // 2 bytes big-endian
    SPEED: 0x2A,          // 2 bytes big-endian
    SP_ATK: 0x2C,         // 2 bytes big-endian
    SP_DEF: 0x2E,         // 2 bytes big-endian
};

/**
 * Gen 2 Box Pokemon struct offsets (32 bytes total).
 * Same as party struct but without party-only fields.
 */
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
    PP_UPS: 0x17,        // 4 bytes (PP + PP Ups per move)
    FRIENDSHIP: 0x1B,    // 1 byte
    POKERUS: 0x1C,       // 1 byte
    CAUGHT_DATA: 0x1D,   // 2 bytes (Crystal only)
};

// ============================================================
// Gen 2 Internal Species ID to National Dex ID mapping
// VERIFIED: In Gen2, species IDs match National Dex numbers (1-251)
// Eggs use internal ID 0xFD (253). The old mapping had errors.
// ============================================================
export const GEN2_INTERNAL_TO_DEX = new Array(256).fill(0);
// In Gen 2, the internal species ID IS the National Dex ID (1-251)
// This is different from Gen1 which used a non-standard ordering
for (let i = 1; i <= 251; i++) {
    GEN2_INTERNAL_TO_DEX[i] = i;
}

// Reverse map: National Dex ID to internal species ID
export const GEN2_DEX_TO_INTERNAL = new Array(252).fill(0);
for (let i = 1; i <= 251; i++) {
    GEN2_DEX_TO_INTERNAL[i] = i;
}

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
export const GEN2_GENDER_THRESHOLDS = {
    GENDERLESS: -1,
    ALL_MALE: 0,
    MALE_87_5: 1,
    MALE_75: 4,
    MALE_50: 7,
    FEMALE_75: 11,
    ALL_FEMALE: 15,
};

// Shiny determination from DVs in Gen 2
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
    MAX_MONEY: 999999,
};

// Egg constants
export const GEN2_EGG_SPECIES_ID = 0xFD;  // 253 — internal species ID for eggs in PokeList
export const GEN2_EGG_DEX_ID = 0;          // Eggs have no dex ID

// Hidden Power type calculation from DVs
export function calculateHiddenPowerType(atkDv, defDv, spdDv, spcDv) {
    const typeIndex = ((atkDv & 3) << 2) | (defDv & 3);
    const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug',
                   'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric',
                   'Psychic', 'Ice', 'Dragon', 'Dark'];
    return types[typeIndex] || 'Normal';
}

export function calculateHiddenPowerPower(atkDv, defDv, spdDv, spcDv) {
    const v = ((spcDv & 3) << 3) | ((spdDv & 3) << 2) | ((defDv & 3) << 1) | (atkDv & 3);
    return Math.floor((v * 40 / 63) + 30);
}
