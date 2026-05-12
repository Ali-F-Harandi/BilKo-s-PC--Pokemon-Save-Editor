/**
 * TrainerCardPanel.js — Trainer Card Display & Edit Panel (Adapter-Driven)
 *
 * Refactored: Uses adapter for badge definitions and trainer schema.
 * Badge count and region info come from adapter.getBadges().
 * Pokédex progress uses adapter.getPokedexSize().
 */

import { Events } from '../../state/eventBus.js';
import { TRAINER_SPRITE, BADGE_SPRITE_BASE, gameHeaderColor } from '../editor/shared/helpers.js';

function _renderTrainerDisplayFields(trainer, isYellow, data, adapter) {
    let html = `
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Name</span><span class="font-bold text-gray-900 dark:text-white">${trainer.name || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Rival</span><span class="font-bold text-gray-900 dark:text-white">${trainer.rivalName || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Money</span><span class="font-bold text-green-600 dark:text-green-400">¥${(trainer.money || 0).toLocaleString()}</span></div>`;

    if (adapter && adapter.generationId === 1) {
        html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Casino Coins</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${(trainer.coins || 0).toLocaleString()}</span></div>`;
    }

    html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Play Time</span><span class="font-mono text-gray-900 dark:text-white">${trainer.playTime || '0:00'}</span></div>`;

    if (isYellow && trainer.pikachuFriendship !== undefined) {
        html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Pikachu Friendship</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${trainer.pikachuFriendship}</span></div>`;
    }

    // Show gender for Gen2+ games
    if (adapter && adapter.generationId >= 2 && trainer.gender) {
        html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Gender</span><span class="font-bold text-gray-900 dark:text-white">${trainer.gender}</span></div>`;
    }

    return html;
}

function _renderTrainerEditFields(form, trainer, isYellow, adapter) {
    const inputCls = 'w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500';
    let html = `
        <div class="space-y-2">
            <div><label class="text-[10px] text-gray-500">Name</label><input id="edit-name" class="${inputCls}" value="${form.name ?? trainer.name ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Rival Name</label><input id="edit-rival" class="${inputCls}" value="${form.rivalName ?? trainer.rivalName ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Trainer ID</label><input id="edit-id" type="number" class="${inputCls}" value="${form.id ?? trainer.id ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Money</label><input id="edit-money" type="number" class="${inputCls}" value="${form.money ?? trainer.money ?? 0}"></div>`;

    if (adapter && adapter.generationId === 1) {
        html += `<div><label class="text-[10px] text-gray-500">Casino Coins</label><input id="edit-coins" type="number" class="${inputCls}" value="${form.coins ?? trainer.coins ?? 0}"></div>`;
    }

    html += `<div><label class="text-[10px] text-gray-500">Play Time</label><input id="edit-playtime" class="${inputCls}" value="${form.playTime ?? trainer.playTime ?? '0:00'}"></div>`;

    if (isYellow) {
        html += `<div><label class="text-[10px] text-gray-500">Pikachu Friendship</label><input id="edit-pikachu" type="number" min="0" max="255" class="${inputCls}" value="${form.pikachuFriendship ?? trainer.pikachuFriendship ?? 0}"></div>`;
    }

    // Gender for Gen2+
    if (adapter && adapter.generationId >= 2) {
        const gender = form.gender ?? trainer.gender ?? 'Male';
        html += `<div><label class="text-[10px] text-gray-500">Gender</label>
            <select id="edit-gender" class="${inputCls}">
                ${['Male', 'Female'].map(g => `<option value="${g}" ${g === gender ? 'selected' : ''}>${g}</option>`).join('')}
            </select></div>`;
    }

    html += `</div>`;
    return html;
}

export function render(data, appState, theme, eventBus, localState) {
    const trainer = data.trainer || {};
    const isEditing = localState.trainerEditing;
    const form = localState.trainerForm;
    const isYellow = data.gameVersion === 'Yellow';
    const isGen2 = data.generationId === 2 || data.gameVersion === 'Gold' || data.gameVersion === 'Silver' || data.gameVersion === 'Crystal';
    const headerColor = gameHeaderColor(theme);
    const gameTheme = theme?.getGameTheme?.();

    // Use Gen2 trainer sprite for Gen2 games
    const trainerSprite = isGen2
        ? 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png'
        : TRAINER_SPRITE;

    // Determine card border and body colors based on game
    const isLightGame = isYellow || data.gameVersion === 'Gold' || data.gameVersion === 'Crystal';
    const borderColor = isGen2
        ? (data.gameVersion === 'Gold' ? 'border-amber-300 dark:border-amber-700'
         : data.gameVersion === 'Silver' ? 'border-slate-300 dark:border-slate-700'
         : 'border-cyan-300 dark:border-cyan-700')
        : 'border-yellow-300 dark:border-yellow-700';
    const bodyBg = isGen2
        ? (data.gameVersion === 'Gold' ? 'bg-amber-50 dark:bg-amber-950'
         : data.gameVersion === 'Silver' ? 'bg-slate-50 dark:bg-slate-950'
         : 'bg-cyan-50 dark:bg-cyan-950')
        : 'bg-yellow-50 dark:bg-yellow-950';
    const headerTextCls = isLightGame ? 'text-gray-900' : 'text-white';

    // Get adapter for badge and pokedex info
    const adapter = appState?.getActiveAdapter?.() || null;
    const badges = adapter ? adapter.getBadges() : [];
    const pokedexSize = adapter ? adapter.getPokedexSize() : 151;

    return `
    <div class="rounded-2xl shadow-lg overflow-hidden border ${borderColor}">
        <!-- Card Header -->
        <div class="p-4 ${headerTextCls}" style="background:linear-gradient(135deg, ${headerColor}, ${headerColor}dd)">
            <div class="flex items-center gap-3">
                <img src="${trainerSprite}" alt="Trainer" class="w-16 h-16 pixelated" onerror="this.style.display='none'">
                <div>
                    <div class="font-black text-lg">${isEditing ? (form.name || trainer.name) : trainer.name}</div>
                    <div class="text-sm opacity-90 font-mono">ID: ${isEditing ? (form.id || trainer.id) : trainer.id}</div>
                </div>
            </div>
        </div>
        <!-- Card Body -->
        <div class="${bodyBg} p-4 space-y-2.5 text-sm">
            ${isEditing ? _renderTrainerEditFields(form, trainer, isYellow, adapter) : _renderTrainerDisplayFields(trainer, isYellow, data, adapter)}
            <!-- Pokédex Progress -->
            <div class="pt-2 border-t ${isGen2 ? 'border-gray-200 dark:border-gray-700' : 'border-yellow-200 dark:border-yellow-800'}">
                <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Pokédex</div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] text-gray-500 w-12">Owned</span>
                    <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" style="width:${data.pokedexOwned ? (data.pokedexOwned / pokedexSize * 100) : 0}%"></div></div>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexOwned || 0}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-gray-500 w-12">Seen</span>
                    <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${data.pokedexSeen ? (data.pokedexSeen / pokedexSize * 100) : 0}%"></div></div>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexSeen || 0}</span>
                </div>
            </div>
            <!-- Badges -->
            ${badges.length > 0 ? `
            <div class="pt-2 border-t ${isGen2 ? 'border-gray-200 dark:border-gray-700' : 'border-yellow-200 dark:border-yellow-800'}">
                <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Badges</div>
                <div class="grid grid-cols-4 gap-2" id="badge-grid">
                    ${badges.map((badge, i) => {
                        // For Gen1: single badges byte; For Gen2: 2 bytes (Johto + Kanto)
                        const badgesByte = trainer.badges || 0;
                        let earned;
                        if (adapter && adapter.generationId >= 2 && i >= 8) {
                            // Gen2 Kanto badges use a second byte
                            const kantoBadges = (trainer.badges >> 8) & 0xFF;
                            earned = isEditing ? (form.badges?.[i] ?? false) : ((kantoBadges >> (i - 8)) & 1) === 1;
                        } else {
                            earned = isEditing ? (form.badges?.[i] ?? false) : ((badgesByte >> i) & 1) === 1;
                        }
                        return `
                        <button data-badge-index="${i}" class="flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all ${earned ? 'bg-yellow-200 dark:bg-yellow-800 opacity-100' : 'bg-gray-100 dark:bg-gray-800 opacity-40'}" title="${badge.name} (${badge.region})">
                            <img src="${BADGE_SPRITE_BASE}/${i + 1}.png" alt="${badge.name}" class="w-8 h-8 pixelated" onerror="this.style.display='none'">
                            <span class="text-[8px] font-bold ${earned ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400'}">${badge.name}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>` : ''}
            <!-- Edit/Save/Cancel Buttons -->
            <div class="pt-3 flex gap-2">
                ${isEditing
                    ? `<button id="trainer-save-btn" class="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-colors">Save</button>
                       <button id="trainer-cancel-btn" class="flex-1 py-2 rounded-lg font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>`
                    : `<button id="trainer-edit-btn" class="w-full py-2 rounded-lg font-bold text-sm text-white transition-colors hover:brightness-110" style="background-color:${headerColor}">Edit Trainer</button>`
                }
            </div>
        </div>
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
                const isEarned = btn.classList.contains('bg-yellow-200') || btn.classList.contains('dark:bg-yellow-800');
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
