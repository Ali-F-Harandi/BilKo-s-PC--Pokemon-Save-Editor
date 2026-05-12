/**
 * games.js — Pokémon Game Cartridge Data
 * 
 * Ported from data/games.ts
 * Defines the game cartridge objects used for theming.
 * 
 * Supports Gen 1 (Red/Blue/Yellow) and Gen 2 (Gold/Silver/Crystal).
 * Each game has a unique primary color, accent color, and text color
 * used for header, trainer card, section headers, and tab stripe theming.
 */

/**
 * @typedef {Object} GameCartridge
 * @property {string} id - Game identifier ('red', 'blue', 'yellow', 'gold', 'silver', 'crystal')
 * @property {string} name - Display name
 * @property {number} generation - Generation number
 * @property {string} color - Primary theme color
 * @property {string} accentColor - Accent/lighter color
 * @property {string} textColor - Text color on theme background
 */

/** @type {GameCartridge[]} */
export const pokemonGames = [
    // Gen 1
    { id: 'red',     name: 'RED',     generation: 1, color: '#FF3B3B', accentColor: '#FFcccc', textColor: '#000' },
    { id: 'blue',    name: 'BLUE',    generation: 1, color: '#3B4CCA', accentColor: '#ccccFF', textColor: '#000' },
    { id: 'yellow',  name: 'YELLOW',  generation: 1, color: '#FFD733', accentColor: '#FFFFE0', textColor: '#000' },
    // Gen 2
    { id: 'gold',    name: 'GOLD',    generation: 2, color: '#DAA520', accentColor: '#FFF8DC', textColor: '#000' },
    { id: 'silver',  name: 'SILVER',  generation: 2, color: '#71797E', accentColor: '#E8E8E8', textColor: '#000' },
    { id: 'crystal', name: 'CRYSTAL', generation: 2, color: '#4FD0E7', accentColor: '#E0FFFF', textColor: '#000' },
];
