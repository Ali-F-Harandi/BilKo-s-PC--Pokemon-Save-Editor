/**
 * itemData.js — Generation II Item Data
 *
 * Contains item names and held item data for all items available in
 * Pokemon Gold, Silver, and Crystal.
 *
 * Item IDs follow the internal GSC item table ordering.
 * Item ID 0 = no item. Items 1-127 cover standard items, held items,
 * berries, and special balls. Items 128-190 cover key items.
 * Items 191-240 are TMs (TM01-TM50). Items 241-247 are HMs (HM01-HM07).
 * Items 248-255 are unused/placeholder entries.
 *
 * The Gen 2 item system introduced:
 *   - Held items (berries, type-enhancing items, etc.)
 *   - Apricorn balls (crafted by Kurt)
 *   - Separate bag pockets (Items, Balls, Key Items, TM/HM)
 *   - New berries with in-battle effects
 *   - New recovery items (Moomoo Milk, EnergyPowder, etc.)
 *
 * @module generations/gen2/data/itemData
 */

/**
 * Item names indexed by item ID.
 * Index 0 is empty; indices 1-255 contain item names.
 * "?????" entries are unused/placeholder slots in the internal item table.
 * @type {string[]}
 */
export const GEN2_ITEM_NAMES = [
    '',                   // 0: no item

    // --- Poké Balls ---
    'Master Ball',        // 1
    'Ultra Ball',         // 2
    'Great Ball',         // 3
    'Poké Ball',          // 4

    // --- Key Items (also in Key Items pocket) ---
    'Town Map',           // 5
    'Bicycle',            // 6
    '?????',              // 7: unused

    // --- Evolution Stones ---
    'Moon Stone',         // 8

    // --- Healing Items ---
    'Antidote',           // 9
    'Burn Heal',          // 10
    'Ice Heal',           // 11
    'Awakening',          // 12
    'Parlyz Heal',        // 13
    'Full Restore',       // 14
    'Max Potion',         // 15
    'Hyper Potion',       // 16
    'Super Potion',       // 17
    'Potion',             // 18

    // --- Field/Battle Items ---
    'Escape Rope',        // 19
    'Repel',              // 20
    'Max Repel',          // 21
    'Super Repel',        // 22
    'Dire Hit',           // 23
    'X Attack',           // 24
    'X Defend',           // 25
    'X Speed',            // 26
    'X Special',          // 27
    'Guard Spec.',        // 28
    'X Accuracy',         // 29

    // --- PP Items ---
    'PP Up',              // 30
    'PP Max',             // 31

    // --- Drinks / Recovery ---
    'Fresh Water',        // 32
    'Soda Pop',           // 33
    'Lemonade',           // 34
    'Moomoo Milk',        // 35
    'EnergyPowder',       // 36
    'Energy Root',        // 37
    'Heal Powder',        // 38
    'Revival Herb',       // 39

    // --- Ether Items ---
    'Ether',              // 40
    'Max Ether',          // 41
    'Elixer',             // 42
    'Max Elixer',         // 43

    // --- Stat Boosters ---
    'HP Up',              // 44
    'Protein',            // 45
    'Iron',               // 46
    'Carbos',             // 47
    'Calcium',            // 48
    'Rare Candy',         // 49

    // --- Evolution Stones ---
    'Fire Stone',         // 50
    'Water Stone',        // 51
    'Thunderstone',       // 52
    'Leaf Stone',         // 53
    'Sun Stone',          // 54

    // --- Apricorns ---
    'Red Apricorn',       // 55
    'Blu Apricorn',       // 56
    'Ylw Apricorn',       // 57
    'Grn Apricorn',       // 58
    'Wht Apricorn',       // 59
    'Pnk Apricorn',       // 60
    'Blk Apricorn',       // 61

    // --- Berries (held, auto-consumed in battle) ---
    'Berry',              // 62
    'Gold Berry',         // 63
    'PRZCureBerry',       // 64: cures paralysis
    'Mint Berry',         // 65: cures sleep
    'Ice Berry',          // 66: cures burn
    'Burnt Berry',        // 67: thaws freeze
    'PSNCureBerry',       // 68: cures poison
    'MysteryBerry',       // 69: restores 5 PP
    'MiracleBerry',       // 70: cures any status

    // --- Type-Enhancing / Battle Held Items ---
    'BrightPowder',       // 71: + evasion
    'Scope Lens',         // 72: + critical hit ratio
    '?????',              // 73: unused
    'Quick Claw',         // 74: chance to move first
    'Amulet Coin',        // 75: doubles prize money
    'Cleanse Tag',        // 76: repels wild Pokémon
    'Smoke Ball',         // 77: ensures escape

    // --- Type-Power-Boosting Held Items ---
    'NeverMeltIce',       // 78: + Ice power
    'Magnet',             // 79: + Electric power
    'Miracle Seed',       // 80: + Grass power
    'Sharp Beak',         // 81: + Flying power
    'Poison Barb',        // 82: + Poison power
    'Soft Sand',          // 83: + Ground power
    'Hard Stone',         // 84: + Rock power
    'SilverPowder',       // 85: + Bug power
    'Spell Tag',          // 86: + Ghost power
    'Metal Coat',         // 87: + Steel power (also evolves Onix/Scyther)
    'Charcoal',           // 88: + Fire power
    'Mystic Water',       // 89: + Water power
    'TwistedSpoon',       // 90: + Psychic power
    'Dragon Fang',        // 91: + Dragon power
    'Dragon Scale',       // 92: + Dragon power (also evolves Seadra)

    // --- Special Held Items ---
    'Up-Grade',           // 93: evolves Porygon
    'Leftovers',          // 94: restores HP each turn
    'Pink Bow',           // 95: + Normal power
    'Polkadot Bow',       // 96: + Normal power

    // --- Unused Placeholders ---
    '?????',              // 97
    '?????',              // 98
    '?????',              // 99
    '?????',              // 100
    '?????',              // 101
    '?????',              // 102
    '?????',              // 103
    '?????',              // 104
    '?????',              // 105
    '?????',              // 106

    // --- Special Battle Held Item ---
    'Berserk Gene',       // 107: + Attack, confuses

    // --- Special Recovery Item ---
    'Sacred Ash',         // 108: revives all fainted Pokémon

    // --- Apricorn Balls (crafted by Kurt) ---
    'Heavy Ball',         // 109
    'Level Ball',         // 110
    'Lure Ball',          // 111
    'Fast Ball',          // 112
    'Friend Ball',        // 113
    'Love Ball',          // 114
    'Moon Ball',          // 115
    'Sport Ball',         // 116
    'Park Ball',          // 117

    // --- Unused Placeholders ---
    '?????',              // 118
    '?????',              // 119
    '?????',              // 120
    '?????',              // 121
    '?????',              // 122
    '?????',              // 123
    '?????',              // 124
    '?????',              // 125
    '?????',              // 126
    '?????',              // 127

    // --- Key Items (128-190) ---
    'SquirtBottle',       // 128
    '?????',              // 129
    '?????',              // 130
    'SecretPotion',       // 131
    '?????',              // 132
    'Red Scale',          // 133
    'Card Key',           // 134
    'Basement Key',       // 135
    'S.S. Ticket',        // 136
    'Pass',               // 137: Magnet Train Pass
    'Machine Part',       // 138
    'Lost Item',          // 139
    'Rainbow Wing',       // 140
    'Silver Wing',        // 141
    'Clear Bell',         // 142: Crystal only
    'GS Ball',            // 143: Crystal only
    'Blue Card',          // 144: Crystal only
    'Egg Ticket',         // 145: Crystal only
    '?????',              // 146
    '?????',              // 147
    '?????',              // 148
    '?????',              // 149
    '?????',              // 150
    '?????',              // 151
    '?????',              // 152
    '?????',              // 153
    '?????',              // 154
    '?????',              // 155
    '?????',              // 156
    '?????',              // 157
    '?????',              // 158
    '?????',              // 159
    '?????',              // 160
    '?????',              // 161
    '?????',              // 162
    '?????',              // 163
    '?????',              // 164
    '?????',              // 165
    '?????',              // 166
    '?????',              // 167
    '?????',              // 168
    '?????',              // 169
    '?????',              // 170
    '?????',              // 171
    '?????',              // 172
    '?????',              // 173
    '?????',              // 174
    '?????',              // 175
    '?????',              // 176
    '?????',              // 177
    '?????',              // 178
    '?????',              // 179
    '?????',              // 180
    '?????',              // 181
    '?????',              // 182
    '?????',              // 183
    '?????',              // 184
    '?????',              // 185
    '?????',              // 186
    '?????',              // 187
    '?????',              // 188
    '?????',              // 189
    '?????',              // 190

    // --- TMs (191-240) ---
    'TM01',               // 191: Dynamic Punch
    'TM02',               // 192: Headbutt
    'TM03',               // 193: Curse
    'TM04',               // 194: Rollout
    'TM05',               // 195: Roar
    'TM06',               // 196: Toxic
    'TM07',               // 197: Zap Cannon
    'TM08',               // 198: Rock Smash
    'TM09',               // 199: Psych Up
    'TM10',               // 200: Hidden Power
    'TM11',               // 201: Sunny Day
    'TM12',               // 202: Sweet Scent
    'TM13',               // 203: Snore
    'TM14',               // 204: Blizzard
    'TM15',               // 205: Hyper Beam
    'TM16',               // 206: Icy Wind
    'TM17',               // 207: Protect
    'TM18',               // 208: Rain Dance
    'TM19',               // 209: Giga Drain
    'TM20',               // 210: Endure
    'TM21',               // 211: Frustration
    'TM22',               // 212: Solarbeam
    'TM23',               // 213: Iron Tail
    'TM24',               // 214: Dragonbreath
    'TM25',               // 215: Thunder
    'TM26',               // 216: Earthquake
    'TM27',               // 217: Return
    'TM28',               // 218: Dig
    'TM29',               // 219: Psychic
    'TM30',               // 220: Shadow Ball
    'TM31',               // 221: Mud-Slap
    'TM32',               // 222: Double Team
    'TM33',               // 223: Ice Punch
    'TM34',               // 224: Swagger
    'TM35',               // 225: Sleep Talk
    'TM36',               // 226: Sludge Bomb
    'TM37',               // 227: Sandstorm
    'TM38',               // 228: Fire Blast
    'TM39',               // 229: Swift
    'TM40',               // 230: Defense Curl
    'TM41',               // 231: Thunder Punch
    'TM42',               // 232: Dream Eater
    'TM43',               // 233: Detect
    'TM44',               // 234: Rest
    'TM45',               // 235: Attract
    'TM46',               // 236: Thief
    'TM47',               // 237: Steel Wing
    'TM48',               // 238: Fire Punch
    'TM49',               // 239: Fury Cutter
    'TM50',               // 240: Nightmare

    // --- HMs (241-247) ---
    'HM01',               // 241: Cut
    'HM02',               // 242: Fly
    'HM03',               // 243: Surf
    'HM04',               // 244: Strength
    'HM05',               // 245: Flash
    'HM06',               // 246: Whirlpool
    'HM07',               // 247: Waterfall

    // --- Unused (248-255) ---
    '?????',              // 248
    '?????',              // 249
    '?????',              // 250
    '?????',              // 251
    '?????',              // 252
    '?????',              // 253
    '?????',              // 254
    '?????',              // 255
];

/**
 * Item IDs that can be held by Pokemon in Gen 2.
 *
 * Includes:
 * - Berries (auto-consumed in battle when conditions are met)
 * - Type-enhancing items (boost move power of a given type by 10%)
 * - Stat/battle items (Quick Claw, Scope Lens, BrightPowder, etc.)
 * - Special held items (Leftovers, Berserk Gene, Metal Coat, etc.)
 * - Evolution items that can be held (Stones, Metal Coat, Up-Grade, Dragon Scale)
 * - Poké Balls and Apricorn Balls (can be held and traded)
 *
 * @type {number[]}
 */
export const GEN2_HELD_ITEM_IDS = [
    // --- Evolution Stones (can be held) ---
    8,    // Moon Stone
    50,   // Fire Stone
    51,   // Water Stone
    52,   // Thunderstone
    53,   // Leaf Stone
    54,   // Sun Stone

    // --- Berries (held, auto-consumed in battle) ---
    62,   // Berry (restores 10 HP)
    63,   // Gold Berry (restores 30 HP)
    64,   // PRZCureBerry (cures paralysis)
    65,   // Mint Berry (cures sleep)
    66,   // Ice Berry (cures burn)
    67,   // Burnt Berry (thaws freeze)
    68,   // PSNCureBerry (cures poison)
    69,   // MysteryBerry (restores 5 PP of a random move)
    70,   // MiracleBerry (cures any status condition)

    // --- General Battle Held Items ---
    71,   // BrightPowder (+evasion)
    72,   // Scope Lens (+critical hit ratio)
    74,   // Quick Claw (chance to move first)
    75,   // Amulet Coin (doubles prize money)
    76,   // Cleanse Tag (repels wild Pokémon)
    77,   // Smoke Ball (ensures escape from wild battles)

    // --- Type-Power-Boosting Held Items (+10% to move power) ---
    78,   // NeverMeltIce (Ice)
    79,   // Magnet (Electric)
    80,   // Miracle Seed (Grass)
    81,   // Sharp Beak (Flying)
    82,   // Poison Barb (Poison)
    83,   // Soft Sand (Ground)
    84,   // Hard Stone (Rock)
    85,   // SilverPowder (Bug)
    86,   // Spell Tag (Ghost)
    87,   // Metal Coat (Steel, also evolves Onix/Scyther)
    88,   // Charcoal (Fire)
    89,   // Mystic Water (Water)
    90,   // TwistedSpoon (Psychic)
    91,   // Dragon Fang (Dragon)
    92,   // Dragon Scale (Dragon, also evolves Seadra)

    // --- Special Held Items ---
    93,   // Up-Grade (evolves Porygon)
    94,   // Leftovers (restores 1/16 HP each turn)
    95,   // Pink Bow (+Normal power)
    96,   // Polkadot Bow (+Normal power)
    107,  // Berserk Gene (+Attack, confuses holder)

    // --- Poké Balls (can be held and traded) ---
    1,    // Master Ball
    2,    // Ultra Ball
    3,    // Great Ball
    4,    // Poké Ball
    109,  // Heavy Ball
    110,  // Level Ball
    111,  // Lure Ball
    112,  // Fast Ball
    113,  // Friend Ball
    114,  // Love Ball
    115,  // Moon Ball
    116,  // Sport Ball
    117,  // Park Ball
];
