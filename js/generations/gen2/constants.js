/**
 * constants.js — Generation II Save File Offsets and Constants
 * 
 * VERIFIED against PKHeX source code (SAV2Offsets.cs, SAV2.cs, PK2.cs, PokeList2.cs)
 * and pokecrystal/pokegold disassembly.
 * 
 * All offsets are ABSOLUTE file offsets (not section-relative).
 * International save files are 32768 bytes (0x8000).
 * Japanese save files are 65536 bytes (0x10000).
 * 
 * CRITICAL: Gold/Silver and Crystal have DIFFERENT offsets for many fields!
 * The game variant must be detected first, then the correct offset set used.
 * 
 * Checksums: Plain 16-bit additive sum, stored little-endian (NOT 1's complement!)
 */

// ============================================================
// Gold/Silver International Offsets (VERIFIED from PKHeX)
// ============================================================
export const GS_INT_OFFSETS = {
    // --- Trainer Info ---
    OPTIONS: 0x2000,           // 1 byte
    PLAYER_ID: 0x2009,         // 2 bytes big-endian
    PLAYER_NAME: 0x200B,       // 11 bytes (10 chars + 0x50 terminator)
    RIVAL_NAME: 0x2021,        // 11 bytes
    DAYLIGHT_SAVINGS: 0x2042,  // 1 byte
    
    // --- Time ---
    TIME_PLAYED: 0x2053,       // 4 bytes (hours BE u16, minutes, seconds)
    
    // --- Money & Coins ---
    MONEY: 0x23DB,             // 3 bytes big-endian binary integer (NOT BCD!)
    CASINO_COINS: 0x23E2,      // 2 bytes big-endian
    
    // --- Badges ---
    JOHTO_BADGES: 0x23E4,      // 1 byte (8 bits = 8 Johto badges)
    KANTO_BADGES: 0x23E5,      // 1 byte (8 bits = 8 Kanto badges)
    
    // --- Items ---
    TM_HM_ITEMS: 0x23E6,       // 57 bytes (1 byte per TM/HM slot)
    BAG_ITEMS: 0x241F,          // Bag pocket (20 slots)
    KEY_ITEMS: 0x2449,          // Key items pocket (25 slots)
    BALL_ITEMS: 0x2464,         // Ball pocket (12 slots)
    PC_ITEMS: 0x247E,           // PC items (50 slots)
    
    // --- PC Box Metadata ---
    CURRENT_BOX: 0x2724,       // 1 byte (bit7=initialized, bits0-6=box number)
    BOX_NAMES: 0x2727,         // 14 * 9 bytes (8 char name + term)
    
    // --- Party (PokeList2 format) ---
    PARTY_COUNT: 0x288A,       // 1 byte
    PARTY_SPECIES: 0x288B,     // 6 species bytes + 0xFF terminator (7 bytes)
    PARTY_STRUCTS: 0x2892,     // 6 * 48 bytes = 288 bytes
    PARTY_OT_NAMES: 0x29BA,    // 6 * 11 bytes = 66 bytes
    PARTY_NICKNAMES: 0x29FC,   // 6 * 11 bytes = 66 bytes
    // Total party list: 1 + 7 + 288 + 66 + 66 = 428 bytes
    
    // --- Pokedex ---
    POKEDEX_OWNED: 0x2A4C,    // 32 bytes (251 bits + padding)
    POKEDEX_SEEN: 0x2A6C,     // 32 bytes (251 bits + padding) — 0x2A4C + 32
    
    // --- Current Box Data (within checksum region) ---
    CURRENT_BOX_DATA: 0x2D6C,  // 1102 bytes + 2 (FF00 terminator)
    
    // --- Checksums ---
    CHECKSUM_1_START: 0x2009,
    CHECKSUM_1_END: 0x2D68,
    CHECKSUM_1_STORE: 0x2D69,  // 2 bytes little-endian
    
    // Checksum 2 is over scattered backup regions (sum all backup bytes)
    CHECKSUM_2_STORE: 0x7E6D,  // 2 bytes little-endian
};

// ============================================================
// Crystal International Offsets (VERIFIED from PKHeX)
// ============================================================
export const C_INT_OFFSETS = {
    // --- Trainer Info ---
    OPTIONS: 0x2000,
    PLAYER_ID: 0x2009,
    PLAYER_NAME: 0x200B,
    RIVAL_NAME: 0x2021,
    DAYLIGHT_SAVINGS: 0x2042,
    
    // --- Time ---
    TIME_PLAYED: 0x2052,       // NOTE: Different from GS! (0x2053 vs 0x2052)
    
    // --- Money & Coins ---
    MONEY: 0x23DC,             // NOTE: Different from GS! (0x23DB vs 0x23DC)
    CASINO_COINS: 0x23E3,
    
    // --- Badges ---
    JOHTO_BADGES: 0x23E5,      // NOTE: Different from GS!
    KANTO_BADGES: 0x23E6,
    
    // --- Items ---
    TM_HM_ITEMS: 0x23E7,
    BAG_ITEMS: 0x2420,
    KEY_ITEMS: 0x244A,
    BALL_ITEMS: 0x2465,
    PC_ITEMS: 0x247F,
    
    // --- PC Box Metadata ---
    CURRENT_BOX: 0x2700,       // NOTE: Different from GS!
    BOX_NAMES: 0x2703,
    
    // --- Party (PokeList2 format) ---
    PARTY_COUNT: 0x2865,       // NOTE: Different from GS!
    PARTY_SPECIES: 0x2866,
    PARTY_STRUCTS: 0x286D,
    PARTY_OT_NAMES: 0x2995,
    PARTY_NICKNAMES: 0x29DB,
    
    // --- Pokedex ---
    POKEDEX_OWNED: 0x2A27,
    POKEDEX_SEEN: 0x2A47,
    
    // --- Current Box Data (within checksum region) ---
    CURRENT_BOX_DATA: 0x2D10,  // NOTE: Different from GS!
    
    // --- Crystal-specific ---
    PLAYER_GENDER: 0x3E3D,     // 0x00 = Male, 0x01 = Female
    
    // --- Checksums ---
    CHECKSUM_1_START: 0x2009,
    CHECKSUM_1_END: 0x2B82,
    CHECKSUM_1_STORE: 0x2D0D,
    
    // Crystal backup: byte-for-byte copy of 0x2009-0x2B82 to 0x1209-0x1D82
    CHECKSUM_2_START: 0x1209,
    CHECKSUM_2_END: 0x1D82,
    CHECKSUM_2_STORE: 0x1F0D,
};

// ============================================================
// Gold/Silver Backup Regions for Checksum 2
// These scattered regions in banks 0/2/3 are backup copies
// of the primary save data. Checksum 2 covers ALL these bytes.
// ============================================================
export const GS_BACKUP_REGIONS = [
    { dst: 0x15C7, src: 0x2009, len: 0x222F - 0x2009 + 1 },   // 0x2009-0x222E → 0x15C7
    { dst: 0x3D96, src: 0x222F, len: 0x23DA - 0x222F + 1 },   // 0x222F-0x23DA → 0x3D96
    { dst: 0x0C6B, src: 0x23DB, len: 0x2855 - 0x23DB + 1 },   // 0x23DB-0x2855 → 0x0C6B
    { dst: 0x7E39, src: 0x2856, len: 0x2889 - 0x2856 + 1 },   // 0x2856-0x2889 → 0x7E39
    { dst: 0x10E8, src: 0x288A, len: 0x2D68 - 0x288A + 1 },   // 0x288A-0x2D68 → 0x10E8
];

// ============================================================
// Legacy GEN2_OFFSETS object for backward compatibility
// Defaults to Gold/Silver International.
// Code should use getOffsetsForVersion() to get the correct set.
// ============================================================
export const GEN2_OFFSETS = {
    ...GS_INT_OFFSETS,
    
    // Compat aliases
    BADGES: GS_INT_OFFSETS.JOHTO_BADGES,
    BAG_ITEMS: GS_INT_OFFSETS.BAG_ITEMS,
    PC_ITEMS: GS_INT_OFFSETS.PC_ITEMS,
    PLAYER_GENDER: 0x3E3D,  // Crystal only, but include for compat
    
    // Box data layout
    BOX_BANK_1: 0x4000,
    BOX_BANK_2: 0x6000,
    
    // Box struct size
    BOX_STRUCT_SIZE: 1 + 21 + (20 * 32) + (20 * 11) + (20 * 11), // = 1102
    
    // Party struct size
    PARTY_MON_SIZE: 48,
    BOX_MON_SIZE: 32,
    
    // RTC (approximate, same for both)
    RTC_HOURS: 0x204D,
    RTC_DAYS: 0x2051,
    
    // Daycare (approximate)
    DAYCARE_IN_USE: 0x2D4B,
    DAYCARE_MON: 0x2D4C,
    DAYCARE_OT: 0x2D6C,
    DAYCARE_NICK: 0x2D77,
    DAYCARE_STEPS: 0x2D82,
    
    // Event flags
    EVENT_FLAGS_START: 0x23E0,
    EVENT_FLAGS_NUM_BYTES: 32,
    
    // Hall of Fame
    HALL_OF_FAME: 0x0C6D,
    
    // Game title (ROM header - NOT reliable for .sav files!)
    GAME_TITLE_OFFSET: 0x134,
};

/**
 * Get the correct offset set for a game version.
 * @param {string} gameVersion - 'Gold', 'Silver', or 'Crystal'
 * @returns {Object} The correct offsets object
 */
export function getOffsetsForVersion(gameVersion) {
    if (gameVersion === 'Crystal') return C_INT_OFFSETS;
    return GS_INT_OFFSETS; // Gold/Silver share the same offsets
}

// ============================================================
// Per-game-variant checksum offsets
// Gen 2 uses PLAIN 16-bit additive sum stored as u16 little-endian.
// ============================================================
export const GEN2_CHECKSUM_VARIANTS = {
    'gs-int': {
        name: 'Gold/Silver (International)',
        checksum1: { start: 0x2009, end: 0x2D68, store: 0x2D69 },
        checksum2: null, // GS checksum 2 is over scattered regions, handled separately
        checksum2Store: 0x7E6D,
    },
    'c-int': {
        name: 'Crystal (International)',
        checksum1: { start: 0x2009, end: 0x2B82, store: 0x2D0D },
        checksum2: { start: 0x1209, end: 0x1D82, store: 0x1F0D },
    },
    'gs-jpn': {
        name: 'Gold/Silver (Japanese)',
        checksum1: { start: 0x2009, end: 0x2C8B, store: 0x2D0D },
        checksum2: null,
    },
};

// ============================================================
// Box data layout constants
// ============================================================

// International box list size: 1(count) + 21(species+FF) + 640(structs) + 220(OT) + 220(nick) = 1102
export const BOX_LIST_SIZE_INT = 1 + 21 + (20 * 32) + (20 * 11) + (20 * 11); // = 1102
// Each box in the save file is followed by 2 bytes (0xFF 0x00), so stride = 1104
export const BOX_STRIDE_INT = BOX_LIST_SIZE_INT + 2; // = 1104 = 0x450

// Japanese box list size: 1 + 31 + (30*32) + (30*6) + (30*6) = 1352
export const BOX_LIST_SIZE_JPN = 1 + 31 + (30 * 32) + (30 * 6) + (30 * 6);
export const BOX_STRIDE_JPN = BOX_LIST_SIZE_JPN + 2;

// Box offsets in SRAM banks (International)
// Boxes 0-6 in Bank 2 (0x4000), Boxes 7-13 in Bank 3 (0x6000)
// The "current box" in the checksum region is a COPY of the active box.
// When reading, we read the permanent box positions and overlay the current box.
export const GS_INT_BOX_OFFSETS = [
    0x4000, 0x4450, 0x48A0, 0x4CF0, 0x5140, 0x5590, 0x59E0,  // Bank 2 (7 boxes)
    0x6000, 0x6450, 0x68A0, 0x6CF0, 0x7140, 0x7590, 0x79E0   // Bank 3 (7 boxes)
];

// Crystal uses the SAME box layout as GS for International
export const C_INT_BOX_OFFSETS = GS_INT_BOX_OFFSETS;

// ============================================================
// Gen 2 PK2 Pokemon Structure Offsets (VERIFIED from PKHeX PK2.cs)
// ============================================================

/**
 * Gen 2 Party Pokemon struct offsets (48 bytes total).
 * IMPORTANT: Species in Gen2 IS the National Dex number (1-251).
 * PP/PPUps are at offsets 0x17-0x1A (4 bytes).
 */
export const GEN2_PARTY_STRUCT = {
    SPECIES: 0x00,       // 1 byte (National Dex ID in Gen2)
    HELD_ITEM: 0x01,     // 1 byte
    MOVES: 0x02,         // 4 bytes (move 1-4, 1 byte each)
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
    CAUGHT_DATA: 0x1D,   // 2 bytes big-endian (Crystal only)
    
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
 * Same as party struct bytes 0x00-0x1F (up to and including Level).
 * Stats are NOT stored for box Pokemon — they're recalculated on withdrawal.
 */
export const GEN2_BOX_STRUCT = {
    SPECIES: 0x00,
    HELD_ITEM: 0x01,
    MOVES: 0x02,
    TRAINER_ID: 0x06,
    EXPERIENCE: 0x08,
    HP_EV: 0x0B,
    ATK_EV: 0x0D,
    DEF_EV: 0x0F,
    SPD_EV: 0x11,
    SPC_EV: 0x13,
    DVS: 0x15,
    PP_UPS: 0x17,
    FRIENDSHIP: 0x1B,
    POKERUS: 0x1C,
    CAUGHT_DATA: 0x1D,
};

// ============================================================
// Gen 2 Internal Species ID to National Dex ID mapping
// VERIFIED: In Gen2, species IDs match National Dex numbers (1-251)
// Eggs use internal ID 0xFD (253).
// ============================================================
export const GEN2_INTERNAL_TO_DEX = new Array(256).fill(0);
for (let i = 1; i <= 251; i++) {
    GEN2_INTERNAL_TO_DEX[i] = i;
}

// Reverse map
export const GEN2_DEX_TO_INTERNAL = new Array(252).fill(0);
for (let i = 1; i <= 251; i++) {
    GEN2_DEX_TO_INTERNAL[i] = i;
}

// Type IDs for Gen 2
export const GEN2_TYPE_IDS = {
    NORMAL: 0, FIGHTING: 1, FLYING: 2, POISON: 3, GROUND: 4,
    ROCK: 5, BUG: 6, GHOST: 7, STEEL: 8, FIRE: 9,
    WATER: 10, GRASS: 11, ELECTRIC: 12, ICE: 13, PSYCHIC: 14,
    DRAGON: 15, DARK: 16,
};

// Type names indexed by type ID
export const GEN2_TYPE_NAMES = [
    'Normal', 'Fighting', 'Flying', 'Poison', 'Ground',
    'Rock', 'Bug', 'Ghost', 'Steel', 'Fire',
    'Water', 'Grass', 'Electric', 'Ice', 'Psychic',
    'Dragon', 'Dark'
];

// Gender ratio thresholds
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
export const GEN2_EGG_SPECIES_ID = 0xFD;  // 253 — species ID for eggs in PokeList
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

// Backup region data (for writer)
export const GEN2_BACKUP_REGIONS = {
    'gs-int': GS_BACKUP_REGIONS,
    'c-int': [
        { src: 0x2009, dst: 0x1209, len: 0x2B83 - 0x2009 },
    ],
};
