/**
 * pokemonBadges.js — Pokémon Type & Status Badge Components
 *
 * Ported from components/ui/PokemonBadges.tsx
 *
 * MODIFIED: Type badges now show icons + color.
 */

import { TYPE_COLORS } from '../../data/gameData.js';
import { getTypeIcon } from '../../data/typeIcons.js';

/**
 * Create a type badge HTML string with icon and color.
 * @param {string} typeName
 * @returns {string} HTML string
 */
export function typeBadgeHTML(typeName) {
    const color = TYPE_COLORS[typeName] || '#999';
    const icon = getTypeIcon(typeName);
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color:${color}">${icon}${typeName}</span>`;
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
