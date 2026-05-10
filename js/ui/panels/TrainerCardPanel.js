/**
 * TrainerCardPanel.js — Trainer Card Display & Edit Panel
 *
 * Extracted from editorDashboard.js _renderHomeTab trainer card section.
 * Handles trainer display/edit mode, badge toggling, save/cancel logic.
 */

import { Events } from '../../state/eventBus.js';
import { TRAINER_SPRITE, BADGE_SPRITE_BASE, gameHeaderColor } from '../editor/shared/helpers.js';

function _renderTrainerDisplayFields(trainer, isYellow, data) {
    let html = `
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Name</span><span class="font-bold text-gray-900 dark:text-white">${trainer.name || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Rival</span><span class="font-bold text-gray-900 dark:text-white">${trainer.rivalName || '—'}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Money</span><span class="font-bold text-green-600 dark:text-green-400">¥${(trainer.money || 0).toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Casino Coins</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${(trainer.coins || 0).toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Play Time</span><span class="font-mono text-gray-900 dark:text-white">${trainer.playTime || '0:00'}</span></div>`;
    if (isYellow && trainer.pikachuFriendship !== undefined) {
        html += `<div class="flex justify-between"><span class="text-gray-500 dark:text-gray-400">Pikachu Friendship</span><span class="font-bold text-yellow-600 dark:text-yellow-400">${trainer.pikachuFriendship}</span></div>`;
    }
    return html;
}

function _renderTrainerEditFields(form, trainer, isYellow) {
    const inputCls = 'w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500';
    return `
        <div class="space-y-2">
            <div><label class="text-[10px] text-gray-500">Name</label><input id="edit-name" class="${inputCls}" value="${form.name ?? trainer.name ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Rival Name</label><input id="edit-rival" class="${inputCls}" value="${form.rivalName ?? trainer.rivalName ?? ''}"></div>
            <div><label class="text-[10px] text-gray-500">Trainer ID</label><input id="edit-id" type="number" class="${inputCls}" value="${form.id ?? trainer.id ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Money</label><input id="edit-money" type="number" class="${inputCls}" value="${form.money ?? trainer.money ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Casino Coins</label><input id="edit-coins" type="number" class="${inputCls}" value="${form.coins ?? trainer.coins ?? 0}"></div>
            <div><label class="text-[10px] text-gray-500">Play Time</label><input id="edit-playtime" class="${inputCls}" value="${form.playTime ?? trainer.playTime ?? '0:00'}"></div>
            ${isYellow ? `<div><label class="text-[10px] text-gray-500">Pikachu Friendship</label><input id="edit-pikachu" type="number" min="0" max="255" class="${inputCls}" value="${form.pikachuFriendship ?? trainer.pikachuFriendship ?? 0}"></div>` : ''}
        </div>`;
}

export function render(data, appState, theme, eventBus, localState) {
    const trainer = data.trainer || {};
    const isEditing = localState.trainerEditing;
    const form = localState.trainerForm;
    const isYellow = data.gameVersion === 'Yellow';
    const headerColor = gameHeaderColor(theme);

    return `
    <div class="rounded-2xl shadow-lg overflow-hidden border border-yellow-300 dark:border-yellow-700">
        <!-- Card Header -->
        <div class="p-4 text-white" style="background:linear-gradient(135deg, ${headerColor}, ${headerColor}dd)">
            <div class="flex items-center gap-3">
                <img src="${TRAINER_SPRITE}" alt="Trainer" class="w-16 h-16 pixelated" onerror="this.style.display='none'">
                <div>
                    <div class="font-black text-lg">${isEditing ? (form.name || trainer.name) : trainer.name}</div>
                    <div class="text-sm opacity-90 font-mono">ID: ${isEditing ? (form.id || trainer.id) : trainer.id}</div>
                </div>
            </div>
        </div>
        <!-- Card Body -->
        <div class="bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2.5 text-sm">
            ${isEditing ? _renderTrainerEditFields(form, trainer, isYellow) : _renderTrainerDisplayFields(trainer, isYellow, data)}
            <!-- Pokédex Progress -->
            <div class="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Pokédex</div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] text-gray-500 w-12">Owned</span>
                    <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" style="width:${data.pokedexOwned ? (data.pokedexOwned / 151 * 100) : 0}%"></div></div>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexOwned || 0}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-gray-500 w-12">Seen</span>
                    <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${data.pokedexSeen ? (data.pokedexSeen / 151 * 100) : 0}%"></div></div>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400 w-10 text-right">${data.pokedexSeen || 0}</span>
                </div>
            </div>
            <!-- Badges -->
            <div class="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                <div class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Badges</div>
                <div class="grid grid-cols-4 gap-2" id="badge-grid">
                    ${Array.from({ length: 8 }, (_, i) => {
                        const badgesByte = trainer.badges || 0;
                        const earned = isEditing ? (form.badges?.[i] ?? false) : ((badgesByte >> i) & 1) === 1;
                        return `
                        <button data-badge-index="${i}" class="flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all ${earned ? 'bg-yellow-200 dark:bg-yellow-800 opacity-100' : 'bg-gray-100 dark:bg-gray-800 opacity-40'}" title="Badge ${i + 1}">
                            <img src="${BADGE_SPRITE_BASE}/${i + 1}.png" alt="Badge ${i + 1}" class="w-8 h-8 pixelated" onerror="this.style.display='none'">
                            <span class="text-[8px] font-bold ${earned ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400'}">${earned ? '✓' : '—'}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>
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
    // ---- Trainer Card ----
    const editBtn = container.querySelector('#trainer-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const tab = appState.getActiveTab();
            if (!tab) return;
            localState.trainerEditing = true;
            const trainer = tab.data.trainer;
            const badgesByte = trainer.badges || 0;
            const badgesArray = Array.from({ length: 8 }, (_, i) => ((badgesByte >> i) & 1) === 1);
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
                coins: coinsEl?.value ? Number(coinsEl.value) : form.coins,
                playTime: playTime,
                badges: badgesByte,
            };
            if (pikachuEl) updates.pikachuFriendship = Number(pikachuEl.value);

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
                localState.trainerForm.badges = [...(tab?.data?.trainer?.badges || new Array(8).fill(false))];
            }
            localState.trainerForm.badges[idx] = !localState.trainerForm.badges[idx];
            updateFn();
        });
    });
}
