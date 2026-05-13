/**
 * helpers.js — Shared Helper Functions & Constants for Editor Dashboard
 *
 * Extracted from editorDashboard.js as part of Phase 2 refactoring.
 * Provides sprite URLs, type badges, HP bars, section headers, and search filtering.
 */

import { TYPE_COLORS } from '../../../data/gameData.js';
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
    return `<span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white shadow-sm min-w-[40px] text-center select-none" style="background-color:${color}; box-shadow: 0 1px 2px rgba(0,0,0,0.15); text-shadow: 0 1px 2px rgba(0,0,0,0.3);"><span class="leading-none tracking-wider pt-[1px] inline-block">${typeName}</span></span>`;
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
        <div class="flex items-center gap-2 mt-1">
            <span class="text-[9px] font-black tracking-widest text-gray-400 uppercase">HP</span>
            <div class="flex-grow bg-gray-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div class="h-full rounded-full transition-all duration-500 ${color}" style="width:${pct}%"></div>
            </div>
            <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 tracking-wider">${current}/${max}</span>
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
    return `
        <div class="rounded-3xl p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[130px] text-gray-300 dark:text-gray-600 text-xs font-bold uppercase tracking-wider"
             data-${type}-index="${index}">
            Empty Slot
        </div>`;
}
