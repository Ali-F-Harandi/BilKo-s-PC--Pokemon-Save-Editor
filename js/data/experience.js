
// Experience Groups

// Mapping of Species ID to Growth Rate
// Strictly Gen 1 (1-151)
const SPECIES_GROWTH_RATE = {
    1: 'MediumSlow', 2: 'MediumSlow', 3: 'MediumSlow', // Bulbasaur
    4: 'MediumSlow', 5: 'MediumSlow', 6: 'MediumSlow', // Charmander
    7: 'MediumSlow', 8: 'MediumSlow', 9: 'MediumSlow', // Squirtle
    10: 'MediumFast', 11: 'MediumFast', 12: 'MediumFast', // Caterpie
    13: 'MediumFast', 14: 'MediumFast', 15: 'MediumFast', // Weedle
    16: 'MediumSlow', 17: 'MediumSlow', 18: 'MediumSlow', // Pidgey
    19: 'MediumFast', 20: 'MediumFast', // Rattata
    21: 'MediumFast', 22: 'MediumFast', // Spearow
    23: 'MediumFast', 24: 'MediumFast', // Ekans
    25: 'MediumFast', 26: 'MediumFast', // Pikachu
    27: 'MediumFast', 28: 'MediumFast', // Sandshrew
    29: 'MediumSlow', 30: 'MediumSlow', 31: 'MediumSlow', // Nidoran F
    32: 'MediumSlow', 33: 'MediumSlow', 34: 'MediumSlow', // Nidoran M
    35: 'Fast', 36: 'Fast', // Clefairy
    37: 'MediumFast', 38: 'MediumFast', // Vulpix
    39: 'Fast', 40: 'Fast', // Jigglypuff
    41: 'MediumFast', 42: 'MediumFast', // Zubat
    43: 'MediumSlow', 44: 'MediumSlow', 45: 'MediumSlow', // Oddish
    46: 'MediumFast', 47: 'MediumFast', // Paras
    48: 'MediumFast', 49: 'MediumFast', // Venonat
    50: 'MediumFast', 51: 'MediumFast', // Diglett
    52: 'MediumFast', 53: 'MediumFast', // Meowth
    54: 'MediumFast', 55: 'MediumFast', // Psyduck
    56: 'MediumFast', 57: 'MediumFast', // Mankey
    58: 'Slow', 59: 'Slow', // Growlithe
    60: 'MediumSlow', 61: 'MediumSlow', 62: 'MediumSlow', // Poliwag
    63: 'MediumSlow', 64: 'MediumSlow', 65: 'MediumSlow', // Abra
    66: 'MediumSlow', 67: 'MediumSlow', 68: 'MediumSlow', // Machop
    69: 'MediumSlow', 70: 'MediumSlow', 71: 'MediumSlow', // Bellsprout
    72: 'Slow', 73: 'Slow', // Tentacool
    74: 'MediumSlow', 75: 'MediumSlow', 76: 'MediumSlow', // Geodude
    77: 'MediumFast', 78: 'MediumFast', // Ponyta
    79: 'MediumFast', 80: 'MediumFast', // Slowpoke
    81: 'MediumFast', 82: 'MediumFast', // Magnemite
    83: 'MediumFast', // Farfetch'd
    84: 'MediumFast', 85: 'MediumFast', // Doduo
    86: 'MediumFast', 87: 'MediumFast', // Seel
    88: 'MediumFast', 89: 'MediumFast', // Grimer
    90: 'Slow', 91: 'Slow', // Shellder
    92: 'MediumSlow', 93: 'MediumSlow', 94: 'MediumSlow', // Gastly
    95: 'MediumFast', // Onix
    96: 'MediumFast', 97: 'MediumFast', // Drowzee
    98: 'MediumFast', 99: 'MediumFast', // Krabby
    100: 'MediumFast', 101: 'MediumFast', // Voltorb
    102: 'Slow', 103: 'Slow', // Exeggcute
    104: 'MediumFast', 105: 'MediumFast', // Cubone
    106: 'MediumFast', 107: 'MediumFast', // Hitmons
    108: 'MediumFast', // Lickitung
    109: 'MediumFast', 110: 'MediumFast', // Koffing
    111: 'Slow', 112: 'Slow', // Rhyhorn
    113: 'Fast', // Chansey
    114: 'MediumFast', // Tangela
    115: 'MediumFast', // Kangaskhan
    116: 'MediumFast', 117: 'MediumFast', // Horsea
    118: 'MediumFast', 119: 'MediumFast', // Goldeen
    120: 'Slow', 121: 'Slow', // Staryu
    122: 'MediumFast', // Mr. Mime
    123: 'MediumFast', // Scyther
    124: 'MediumFast', // Jynx
    125: 'MediumFast', // Electabuzz
    126: 'MediumFast', // Magmar
    127: 'Slow', // Pinsir
    128: 'Slow', // Tauros
    129: 'Slow', 130: 'Slow', // Magikarp
    131: 'Slow', // Lapras
    132: 'MediumFast', // Ditto
    133: 'MediumFast', 134: 'MediumFast', 135: 'MediumFast', 136: 'MediumFast', // Eevee
    137: 'MediumFast', // Porygon
    138: 'MediumFast', 139: 'MediumFast', // Omanyte
    140: 'MediumFast', 141: 'MediumFast', // Kabuto
    142: 'Slow', // Aerodactyl
    143: 'Slow', // Snorlax
    144: 'Slow', 145: 'Slow', 146: 'Slow', // Birds
    147: 'Slow', 148: 'Slow', 149: 'Slow', // Dratini
    150: 'Slow', 151: 'MediumSlow', // Mewtwo, Mew
};

export function getGrowthRate(dexId) {
    return SPECIES_GROWTH_RATE[dexId] || 'MediumFast';
}

export function getLevelFromExp(exp, rate) {
    for (let level = 100; level >= 2; level--) {
        if (exp >= getExpAtLevel(level, rate)) {
            return level;
        }
    }
    return 1;
}

export function getExpAtLevel(n, rate) {
    switch (rate) {
        case 'Fast':
            return Math.floor(0.8 * (n ** 3));
        case 'MediumFast':
            return n ** 3;
        case 'MediumSlow':
            return Math.floor(1.2 * (n ** 3) - 15 * (n ** 2) + 100 * n - 140);
        case 'Slow':
            return Math.floor(1.25 * (n ** 3));
        case 'Erratic':
            if (n < 50) return Math.floor((n ** 3) * (100 - n) / 50);
            if (n < 68) return Math.floor((n ** 3) * (150 - n) / 100);
            if (n < 98) return Math.floor((n ** 3) * Math.floor((1911 - 10 * n) / 3) / 500);
            return Math.floor((n ** 3) * (160 - n) / 100);
        case 'Fluctuating':
            if (n < 15) return Math.floor(n ** 3 * (Math.floor((n + 1) / 3) + 24) / 50);
            if (n < 36) return Math.floor(n ** 3 * (n + 14) / 50);
            return Math.floor(n ** 3 * (Math.floor(n / 2) + 32) / 50);
        default:
            return n ** 3;
    }
}
