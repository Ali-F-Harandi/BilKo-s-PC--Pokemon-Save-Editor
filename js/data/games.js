/**
 * games.js — Pokémon Game Cartridge Data
 * 
 * Ported from data/games.ts
 * Defines the game cartridge objects used for theming.
 */

/**
 * @typedef {Object} GameCartridge
 * @property {string} id - Game identifier ('red', 'blue', 'yellow')
 * @property {string} name - Display name
 * @property {number} generation - Generation number
 * @property {string} color - Primary theme color
 * @property {string} accentColor - Accent/lighter color
 * @property {string} textColor - Text color on theme background
 */

/** @type {GameCartridge[]} */
export const pokemonGames = [
    { id: 'red',    name: 'RED',    generation: 1, color: '#FF3B3B', accentColor: '#FFcccc', textColor: '#000' },
    { id: 'blue',   name: 'BLUE',   generation: 1, color: '#3B4CCA', accentColor: '#ccccFF', textColor: '#000' },
    { id: 'yellow', name: 'YELLOW', generation: 1, color: '#FFD733', accentColor: '#FFFFE0', textColor: '#000' },
];
