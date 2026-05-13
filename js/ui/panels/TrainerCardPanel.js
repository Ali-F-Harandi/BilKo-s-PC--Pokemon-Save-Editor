/**
 * TrainerCardPanel.js — Trainer Card Display & Edit Panel (Adapter-Driven)
 *
 * Redesigned with premium card styling: header area with game-color,
 * avatar frame, stat blocks, pokedex progress bars, badge grid.
 * Edit mode keeps exact same layout — inputs styled identically to text.
 *
 * Uses adapter for badge definitions and trainer schema.
 * Badge count and region info come from adapter.getBadges().
 * Pokédex progress uses adapter.getPokedexSize().
 */

import { Events } from '../../state/eventBus.js';
import { TRAINER_SPRITE, BADGE_SPRITE_BASE, gameHeaderColor } from '../editor/shared/helpers.js';

// ---- Game-specific body/background colors ----
const GAME_BODY_BG = {
    red:     'bg-red-50 dark:bg-gray-900',
    blue:    'bg-blue-50 dark:bg-gray-900',
    yellow:  'bg-[#FEFCE8] dark:bg-gray-900',
    gold:    'bg-amber-50 dark:bg-gray-900',
    silver:  'bg-slate-50 dark:bg-gray-900',
    crystal: 'bg-cyan-50 dark:bg-gray-900',
};

function _getGameBodyBg(gameVersion) {
    const key = (gameVersion || '').toLowerCase();
    return GAME_BODY_BG[key] || 'bg-[#FEFCE8] dark:bg-gray-900';
}

// ---- Stat Block Renderers (View Mode) ----

function _statBlock(iconHtml, label, value, hoverBorder) {
    return `
        <div class="bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors ${hoverBorder}">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner"
                     style="background-color: ${_statIconColor(label)}">
                    ${iconHtml}
                </div>
                <span class="font-black text-gray-400 uppercase tracking-widest text-xs">${label}</span>
            </div>
            <span class="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">${value}</span>
        </div>`;
}

function _statIconColor(label) {
    const colors = {
        'Rival': '#f87171', 'Money': '#facc15', 'Casino Coins': '#6366f1',
        'Play Time': '#a78bfa', 'Pikachu Friendship': '#fbbf24', 'Gender': '#60a5fa',
    };
    return colors[label] || '#9ca3af';
}

function _statIconSVG(label) {
    const icons = {
        'Rival': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" x2="19" y1="19" y2="13"></line><line x1="16" x2="20" y1="16" y2="20"></line><line x1="19" x2="21" y1="21" y2="19"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" x2="9" y1="14" y2="18"></line><line x1="7" x2="4" y1="17" y2="20"></line><line x1="3" x2="5" y1="19" y2="21"></line></svg>',
        'Money': '<span class="font-black text-sm italic">&yen;</span>',
        'Casino Coins': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"></path><path d="M15 6h1v4"></path><path d="m6.134 14.768.866-.5 2 3.464"></path><circle cx="16" cy="8" r="6"></circle></svg>',
        'Play Time': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
        'Pikachu Friendship': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
        'Gender': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    };
    return icons[label] || '';
}

// ---- Edit Mode Stat Block ----
// Inputs styled identically to view mode text — no layout shifts

function _editStatBlock(label, inputHtml, hoverBorder) {
    return `
        <div class="bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors ${hoverBorder}">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner"
                     style="background-color: ${_statIconColor(label)}">
                    ${_statIconSVG(label)}
                </div>
                <span class="font-black text-gray-400 uppercase tracking-widest text-xs">${label}</span>
            </div>
            ${inputHtml}
        </div>`;
}

// Edit input styled to look like view-mode value text
const _editInputCls = 'bg-transparent border-0 border-b-2 border-blue-300 dark:border-blue-600 text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase text-right outline-none focus:border-blue-500 dark:focus:border-blue-400 w-auto max-w-[160px] p-0 m-0';
const _editInputClsNum = _editInputCls + ' [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

// ---- View Mode Fields ----
function _renderTrainerDisplayFields(trainer, isYellow, data, adapter) {
    let html = '';

    html += _statBlock(_statIconSVG('Rival'), 'Rival', trainer.rivalName || '—', 'hover:border-red-300 dark:hover:border-red-700');
    html += _statBlock(_statIconSVG('Money'), 'Money', '¥' + (trainer.money || 0).toLocaleString(), 'hover:border-yellow-300 dark:hover:border-yellow-700');

    if (adapter && adapter.generationId === 1) {
        html += _statBlock(_statIconSVG('Casino Coins'), 'Casino Coins', (trainer.coins || 0).toLocaleString(), 'hover:border-indigo-300 dark:hover:border-indigo-700');
    }

    html += _statBlock(_statIconSVG('Play Time'), 'Play Time', trainer.playTime || '0h 00m', 'hover:border-purple-300 dark:hover:border-purple-700');

    if (isYellow && trainer.pikachuFriendship !== undefined) {
        html += _statBlock(_statIconSVG('Pikachu Friendship'), 'Pikachu Friendship', trainer.pikachuFriendship, 'hover:border-yellow-300 dark:hover:border-yellow-700');
    }

    if (adapter && adapter.generationId >= 2 && trainer.gender) {
        html += _statBlock(_statIconSVG('Gender'), 'Gender', trainer.gender, 'hover:border-blue-300 dark:hover:border-blue-700');
    }

    return html;
}

// ---- Edit Mode Fields ----
function _renderTrainerEditFields(form, trainer, isYellow, adapter) {
    let html = '';

    // Rival Name
    html += _editStatBlock('Rival',
        `<input id="edit-rival" class="${_editInputCls}" value="${form.rivalName ?? trainer.rivalName ?? ''}">`,
        'hover:border-red-300 dark:hover:border-red-700');

    // Money
    html += _editStatBlock('Money',
        `<div class="flex items-center gap-1"><span class="text-xl font-black text-gray-900 dark:text-white tracking-tight">&yen;</span><input id="edit-money" type="number" class="${_editInputClsNum}" value="${form.money ?? trainer.money ?? 0}"></div>`,
        'hover:border-yellow-300 dark:hover:border-yellow-700');

    // Casino Coins (Gen1)
    if (adapter && adapter.generationId === 1) {
        html += _editStatBlock('Casino Coins',
            `<input id="edit-coins" type="number" class="${_editInputClsNum}" value="${form.coins ?? trainer.coins ?? 0}">`,
            'hover:border-indigo-300 dark:hover:border-indigo-700');
    }

    // Play Time
    html += _editStatBlock('Play Time',
        `<input id="edit-playtime" class="${_editInputCls}" value="${form.playTime ?? trainer.playTime ?? '0h 00m'}">`,
        'hover:border-purple-300 dark:hover:border-purple-700');

    // Pikachu Friendship (Yellow)
    if (isYellow) {
        html += _editStatBlock('Pikachu Friendship',
            `<input id="edit-pikachu" type="number" min="0" max="255" class="${_editInputClsNum}" value="${form.pikachuFriendship ?? trainer.pikachuFriendship ?? 0}">`,
            'hover:border-yellow-300 dark:hover:border-yellow-700');
    }

    // Gender (Gen2+)
    if (adapter && adapter.generationId >= 2) {
        const gender = form.gender ?? trainer.gender ?? 'Male';
        html += _editStatBlock('Gender',
            `<select id="edit-gender" class="bg-transparent border-0 border-b-2 border-blue-300 dark:border-blue-600 text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase text-right outline-none focus:border-blue-500 dark:focus:border-blue-400 p-0 m-0 cursor-pointer">
                ${['Male', 'Female'].map(g => `<option value="${g}" ${g === gender ? 'selected' : ''}>${g}</option>`).join('')}
            </select>`,
            'hover:border-blue-300 dark:hover:border-blue-700');
    }

    return html;
}

// ---- Badge Section Renderer ----
const _trophySVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-orange-400"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"></path><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"></path><path d="M18 9h1.5a1 1 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"></path><path d="M6 9H4.5a1 1 0 0 1 0-5H6"></path></svg>';

function _renderBadgeGroup(badgeGroup, badgeStartIndex, trainer, isEditing, form, adapter) {
    return badgeGroup.map((badge, relIdx) => {
        const i = badgeStartIndex + relIdx;
        const badgesByte = trainer.badges || 0;
        let earned;
        if (adapter && adapter.generationId >= 2 && i >= 8) {
            const kantoBadges = (trainer.badges >> 8) & 0xFF;
            earned = isEditing ? (form.badges?.[i] ?? false) : ((kantoBadges >> (i - 8)) & 1) === 1;
        } else {
            earned = isEditing ? (form.badges?.[i] ?? false) : ((badgesByte >> i) & 1) === 1;
        }
        return `
        <div class="flex justify-center">
            <div data-badge-index="${i}" class="w-10 h-10 flex items-center justify-center transition-all duration-300 ${earned ? 'grayscale-0 opacity-100 scale-110 drop-shadow-lg' : 'grayscale opacity-30 scale-90'} cursor-pointer" title="${badge.name} (${badge.region})">
                <img src="${BADGE_SPRITE_BASE}/${i + 1}.png" alt="${badge.name}" class="w-full h-full object-contain pixelated" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'">
            </div>
        </div>`;
    }).join('');
}

function _renderBadgesSection(badges, trainer, isEditing, form, adapter, hasJohtoBadges, hasKantoBadges) {
    let html = '<div class="pt-2">';

    if (hasJohtoBadges) {
        const johtoBadges = badges.filter(b => b.region === 'Johto');
        const johtoStartIdx = badges.indexOf(johtoBadges[0]);
        html += `
            <div class="flex items-center gap-1.5 mb-3">
                ${_trophySVG}
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Johto Badges</h4>
            </div>
            <div class="bg-white/50 dark:bg-gray-800/80 p-4 rounded-[1.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-4 shadow-inner mb-3">
                ${_renderBadgeGroup(johtoBadges, johtoStartIdx, trainer, isEditing, form, adapter)}
            </div>`;
    }

    if (hasKantoBadges) {
        const kantoBadgesList = badges.filter(b => b.region === 'Kanto');
        const kantoStartIdx = badges.indexOf(kantoBadgesList[0]);
        html += `
            <div class="flex items-center gap-1.5 mb-3">
                ${_trophySVG}
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Kanto Badges</h4>
            </div>
            <div class="bg-white/50 dark:bg-gray-800/80 p-4 rounded-[1.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-4 shadow-inner">
                ${_renderBadgeGroup(kantoBadgesList, kantoStartIdx, trainer, isEditing, form, adapter)}
            </div>`;
    }

    // Fallback for games without region info (shouldn't happen but just in case)
    if (!hasJohtoBadges && !hasKantoBadges && badges.length > 0) {
        html += `
            <div class="flex items-center gap-1.5 mb-3">
                ${_trophySVG}
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Badges</h4>
            </div>
            <div class="bg-white/50 dark:bg-gray-800/80 p-4 rounded-[1.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-4 shadow-inner">
                ${_renderBadgeGroup(badges, 0, trainer, isEditing, form, adapter)}
            </div>`;
    }

    html += '</div>';
    return html;
}

export function render(data, appState, theme, eventBus, localState) {
    const trainer = data.trainer || {};
    const isEditing = localState.trainerEditing;
    const form = localState.trainerForm;
    const isYellow = data.gameVersion === 'Yellow';
    const isGen2 = data.generationId === 2 || data.gameVersion === 'Gold' || data.gameVersion === 'Silver' || data.gameVersion === 'Crystal';
    const headerColor = gameHeaderColor(theme);

    // Use Gen2 trainer sprite for Gen2 games
    const trainerSprite = isGen2
        ? 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png'
        : TRAINER_SPRITE;

    // Game-specific body background
    const bodyBg = _getGameBodyBg(data.gameVersion);

    // Get adapter for badge and pokedex info
    const adapter = appState?.getActiveAdapter?.() || null;
    const badges = adapter ? adapter.getBadges() : [];
    const pokedexSize = adapter ? adapter.getPokedexSize() : 151;

    // Determine badge regions for section headers
    // Gen2 has 16 badges: 8 Johto + 8 Kanto; Gen1 has 8 Kanto
    const johtoBadges = badges.filter(b => b.region === 'Johto');
    const kantoBadges = badges.filter(b => b.region === 'Kanto');
    const hasJohtoBadges = johtoBadges.length > 0;
    const hasKantoBadges = kantoBadges.length > 0;

    // Display name and ID (respecting edit mode live preview)
    const displayName = isEditing ? (form.name || trainer.name) : trainer.name;
    const displayId = isEditing ? (form.id || trainer.id) : trainer.id;

    // Play time for header pill
    const displayPlayTime = isEditing ? (form.playTime ?? trainer.playTime ?? '0h 00m') : (trainer.playTime || '0h 00m');

    return `
        <div class="${bodyBg} rounded-[2.5rem] shadow-2xl border-4 border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col transition-all duration-300">

            <!-- Header Area -->
            <div class="h-32 relative p-5 flex flex-col items-start justify-start overflow-hidden transition-colors duration-1000" style="background-color: ${headerColor};">
                <!-- Pokeball Dot Pattern -->
                <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(circle at 10px 10px, white 2px, transparent 0); background-size: 20px 20px;"></div>

                <div class="w-full flex justify-between items-start relative z-10">
                    <h2 class="text-4xl font-black text-white italic tracking-tighter drop-shadow-md uppercase">
                        ${isEditing
                            ? `<input id="edit-name" class="bg-transparent border-0 border-b-2 border-white/40 text-4xl font-black text-white italic tracking-tighter drop-shadow-md uppercase outline-none focus:border-white/70 w-full placeholder-white/30" value="${form.name ?? trainer.name ?? ''}" placeholder="Name">`
                            : displayName}
                    </h2>
                    <div class="text-right">
                        <span class="text-[10px] font-black text-white/70 uppercase tracking-widest block">Trainer ID</span>
                        ${isEditing
                            ? `<input id="edit-id" type="number" class="bg-transparent border-0 border-b-2 border-white/40 text-xl font-black text-white tracking-widest leading-none outline-none focus:border-white/70 w-20 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value="${form.id ?? trainer.id ?? 0}">`
                            : `<div class="text-xl font-black text-white tracking-widest leading-none">${displayId}</div>`}
                    </div>
                </div>
            </div>

            <!-- Avatar Frame -->
            <div class="absolute top-16 left-8 z-20">
                <div class="w-28 h-28 rounded-2xl bg-white dark:bg-gray-800 border-[6px] border-white dark:border-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.2)] overflow-hidden flex items-center justify-center relative transform -rotate-3">
                    <div class="absolute inset-0 bg-gray-100 dark:bg-gray-900 opacity-50"></div>
                    <img src="${trainerSprite}" alt="Trainer" class="w-full h-full object-contain p-2 pixelated scale-125 relative z-10" draggable="false" onerror="this.src='${TRAINER_SPRITE}'">
                </div>
            </div>

            <!-- Main Content Body -->
            <div class="px-5 pt-14 pb-6 space-y-3 flex-grow ${bodyBg}">

                <!-- Mini Stats Grid (Time & Edit Buttons) -->
                <div class="flex justify-end gap-2 mb-2">
                    <div class="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-500 uppercase border border-gray-100 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                        ${displayPlayTime}
                    </div>
                    ${!isEditing ? `
                        <button id="trainer-edit-btn" class="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs font-black text-blue-600 uppercase hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            EDIT CARD
                        </button>
                    ` : ''}
                </div>

                <!-- Primary Stats Blocks -->
                <div class="space-y-2">
                    ${isEditing
                        ? _renderTrainerEditFields(form, trainer, isYellow, adapter)
                        : _renderTrainerDisplayFields(trainer, isYellow, data, adapter)}
                </div>

                <!-- Pokédex Progress -->
                <div class="bg-white/40 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                    <div class="flex items-center gap-2 text-gray-500 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-red-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg>
                        <span class="text-[10px] font-black uppercase tracking-widest">Pokédex Progress</span>
                    </div>

                    <div class="space-y-1">
                        <div class="flex justify-between text-[10px] font-black uppercase tracking-wider">
                            <span class="text-gray-400">Owned</span>
                            <span class="text-gray-900 dark:text-white">${data.pokedexOwned || 0} / ${pokedexSize}</span>
                        </div>
                        <div class="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div class="h-full bg-red-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(239,68,68,0.4)]" style="width:${data.pokedexOwned ? (data.pokedexOwned / pokedexSize * 100) : 0}%"></div>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <div class="flex justify-between text-[10px] font-black uppercase tracking-wider">
                            <span class="text-gray-400">Seen</span>
                            <span class="text-gray-900 dark:text-white">${data.pokedexSeen || 0} / ${pokedexSize}</span>
                        </div>
                        <div class="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div class="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.4)]" style="width:${data.pokedexSeen ? (data.pokedexSeen / pokedexSize * 100) : 0}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Badges Section -->
                ${badges.length > 0 ? _renderBadgesSection(badges, trainer, isEditing, form, adapter, hasJohtoBadges, hasKantoBadges) : ''}

                <!-- Edit/Save/Cancel Buttons -->
                ${isEditing ? `
                <div class="flex gap-2 pt-2">
                    <button id="trainer-save-btn" class="flex-1 py-2.5 rounded-xl font-black text-sm text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg">
                        Save
                    </button>
                    <button id="trainer-cancel-btn" class="flex-1 py-2.5 rounded-xl font-black text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
                        Cancel
                    </button>
                </div>` : ''}
            </div>

            <!-- Bottom Footer Accent -->
            <div class="h-2 w-full" style="background-color: ${headerColor}"></div>
        </div>`;
}

export function bindEvents(container, eventBus, theme, appState, localState, updateFn) {
    const adapter = appState?.getActiveAdapter?.() || null;
    const badges = adapter ? adapter.getBadges() : [];

    // ---- Trainer Card ----
    const editBtn = container.querySelector('#trainer-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const tab = appState.getActiveTab();
            if (!tab) return;
            localState.trainerEditing = true;
            const trainer = tab.data.trainer;
            const badgesArray = Array.from({ length: badges.length || 8 }, (_, i) => {
                if (adapter && adapter.generationId >= 2 && i >= 8) {
                    const kantoBadges = ((trainer.badges || 0) >> 8) & 0xFF;
                    return ((kantoBadges >> (i - 8)) & 1) === 1;
                }
                return ((trainer.badges || 0) >> i) & 1 === 1;
            });
            localState.trainerForm = { ...trainer, badges: badgesArray };
            updateFn();
        });
    }

    const saveBtn = container.querySelector('#trainer-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const form = localState.trainerForm;
            const nameEl = container.querySelector('#edit-name');
            const rivalEl = container.querySelector('#edit-rival');
            const idEl = container.querySelector('#edit-id');
            const moneyEl = container.querySelector('#edit-money');
            const coinsEl = container.querySelector('#edit-coins');
            const playtimeEl = container.querySelector('#edit-playtime');
            const pikachuEl = container.querySelector('#edit-pikachu');
            const genderEl = container.querySelector('#edit-gender');

            let badgesByte = 0;
            container.querySelectorAll('[data-badge-index]').forEach(btn => {
                const idx = Number(btn.dataset.badgeIndex);
                const isEarned = !btn.classList.contains('opacity-30');
                if (isEarned || form.badges?.[idx]) {
                    badgesByte |= (1 << idx);
                }
            });

            const playTimeVal = playtimeEl?.value || form.playTime;
            const ptMatch = playTimeVal?.match(/^(\d+)h\s*(\d+)m$/);
            const playTime = ptMatch ? playTimeVal : form.playTime;

            const updates = {
                name: nameEl?.value || form.name,
                rivalName: rivalEl?.value || form.rivalName,
                id: idEl?.value ? Number(idEl.value) : form.id,
                money: moneyEl?.value ? Number(moneyEl.value) : form.money,
                playTime: playTime,
                badges: badgesByte,
            };
            if (coinsEl) updates.coins = coinsEl.value ? Number(coinsEl.value) : form.coins;
            if (pikachuEl) updates.pikachuFriendship = Number(pikachuEl.value);
            if (genderEl) updates.gender = genderEl.value;

            appState.handleTrainerUpdate(updates);
            localState.trainerEditing = false;
            localState.trainerForm = {};
            eventBus.emit(Events.TRAINER_UPDATED, updates);
        });
    }

    const cancelBtn = container.querySelector('#trainer-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            localState.trainerEditing = false;
            localState.trainerForm = {};
            updateFn();
        });
    }

    // Badge toggles
    container.querySelectorAll('[data-badge-index]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.badgeIndex);
            if (!localState.trainerForm.badges) {
                const tab = appState.getActiveTab();
                localState.trainerForm.badges = [...(new Array(badges.length || 8)).fill(false)];
            }
            localState.trainerForm.badges[idx] = !localState.trainerForm.badges[idx];
            updateFn();
        });
    });
}
