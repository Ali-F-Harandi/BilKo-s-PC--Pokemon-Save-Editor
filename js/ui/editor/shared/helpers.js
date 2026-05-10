/**
 * helpers.js — Shared Helper Functions & Constants for Editor Dashboard
 *
 * Extracted from editorDashboard.js as part of Phase 2 refactoring.
 * Provides sprite URLs, type badges, HP bars, section headers, and search filtering.
 */

import { TYPE_COLORS } from '../../../data/gameData.js';
import { getTypeIcon } from '../../../data/typeIcons.js';
import { getSearchFilter } from '../editorTools.js';

// ================================================================
// ---- CONSTANTS ----
// ================================================================

export const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
export const TRAINER_SPRITE = 'https://play.pokemonshowdown.com/sprites/trainers/red-gen1.png';
export const BADGE_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges';

export const DASHBOARD_TABS = [
    { id: 'home',       label: 'Dashboard',   icon: 'home' },
    { id: 'encounters', label: 'Encounters',   icon: 'database' },
    { id: 'pokedex',    label: 'Pokédex',      icon: 'book' },
    { id: 'battle',     label: 'Battle Guide', icon: 'swords' },
    { id: 'events',     label: 'Events',       icon: 'map' },
    { id: 'hof',        label: 'Hall of Fame', icon: 'trophy' },
];

// ================================================================
// ---- HELPER FUNCTIONS ----
// ================================================================

export function spriteUrl(dexId) {
    return `${SPRITE_BASE}/${dexId}.png`;
}

export function typeBadgeHTML(typeName) {
    const color = TYPE_COLORS[typeName] || '#999';
    return `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style="background-color:${color}">${typeName}</span>`;
}

/**
 * Type badge with icon and color — used for both party and PC box views.
 * Shows a small SVG icon + type name on a colored background.
 */
export function typeBadgeWithIconHTML(typeName) {
    const color = TYPE_COLORS[typeName] || '#999';
    const icon = getTypeIcon(typeName);
    return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style="background-color:${color}">${icon}${typeName}</span>`;
}

export function typeDotsHTML(types) {
    if (!types || !types.length) return '';
    return types.map(t => {
        const c = TYPE_COLORS[t] || '#999';
        return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color:${c}" title="${t}"></span>`;
    }).join('');
}

export function hpBarHTML(current, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
    return `
        <div class="flex items-center gap-1.5 text-[10px] mt-1">
            <span class="text-gray-400 dark:text-gray-500">HP</span>
            <div class="stat-bar-bg flex-grow"><div class="stat-bar-fill ${color}" style="width:${pct}%"></div></div>
            <span class="text-gray-500 dark:text-gray-400 font-mono">${current}/${max}</span>
        </div>`;
}

export function gameHeaderColor(theme) {
    const gt = theme?.getGameTheme?.();
    return gt ? gt.color : '#3B82F6';
}

/**
 * Check if a Pokémon matches the current search filter.
 * Filters by nickname, species name, or level.
 * @param {Object} mon - PokemonStats object (or null/undefined for empty slots)
 * @returns {boolean} True if the Pokémon matches or there's no filter
 */
export function matchesSearchFilter(mon) {
    const filter = getSearchFilter().toLowerCase();
    if (!filter || !mon) return true;
    const nickname = (mon.nickname || '').toLowerCase();
    const speciesName = (mon.speciesName || '').toLowerCase();
    const level = String(mon.level || '');
    return nickname.includes(filter) || speciesName.includes(filter) || level.includes(filter);
}

export function sectionHeaderHTML(icon, title, theme, extra = '') {
    const color = gameHeaderColor(theme);
    return `
        <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-black text-sm uppercase tracking-wider" style="background-color:${color}">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                ${title}
            </div>
            ${extra}
        </div>`;
}

export function _renderEmptySlot(type, index) {
    const extraClasses = type === 'party' ? 'min-h-[140px]' : 'aspect-square';
    return `
        <div class="rounded-xl p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center ${extraClasses} text-gray-300 dark:text-gray-600 text-xs"
             data-${type}-index="${index}">
            Empty
        </div>`;
}
