/**
 * pokemonBadges.js — Pokémon Type & Status Badge Components
 * 
 * Ported from components/ui/PokemonBadges.tsx
 * 
 * PHASE 7: Will be fully implemented
 */

import { TYPE_COLORS } from '../../data/gameData.js';

/**
 * Create a type badge HTML string.
 * @param {string} typeName
 * @returns {string} HTML string
 */
export function typeBadgeHTML(typeName) {
    const color = TYPE_COLORS[typeName] || '#999';
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color:${color}">${typeName}</span>`;
}

/**
 * Create a status badge HTML string.
 * @param {string} status
 * @returns {string} HTML string
 */
export function statusBadgeHTML(status) {
    if (status === 'OK') return '';
    const colors = {
        SLP: '#8B7355', PSN: '#A040A0', BRN: '#F08030',
        FRZ: '#98D8D8', PAR: '#F8D030'
    };
    const color = colors[status] || '#999';
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color:${color}">${status}</span>`;
}
