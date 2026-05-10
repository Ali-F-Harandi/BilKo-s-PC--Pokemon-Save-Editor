/**
 * PokemonMovesPanel.js — Move Slots Editing Panel
 *
 * Refactored: Uses adapter for move list and PP data instead of direct imports.
 * The adapter is passed in as a parameter.
 */

export function render(localMon, generation = 1, adapter = null) {
    const moveList = adapter ? adapter.getMoveList() : [];

    let html = `
        <!-- RIGHT: Moves -->
        <div class="lg:col-span-4 space-y-4">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2">Moves</h3>
          ${[0,1,2,3].map(i => {
            const m = localMon.moves?.[i] || { id:0, pp:0, ppUps:0 };
            const basePP = adapter ? adapter.getMovePP(m.id) : 0;
            const maxPP = basePP + Math.floor(basePP * (m.ppUps||0) / 5);
            return `<div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 dark:text-gray-500 font-bold w-5">#${i+1}</span>
                <div class="relative">
                  <input id="pe-move-${i}" type="text" value="${moveList[m.id]||'-'}" placeholder="Move..."
                    class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
                  <div id="pe-move-${i}-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-gray-500 dark:text-gray-400">PP: <span class="text-gray-900 dark:text-white font-bold" id="pe-pp-${i}">${m.pp||0}</span>/${maxPP}</span>
                <label class="text-gray-500 dark:text-gray-400">PP Ups:
                  <input type="number" min="0" max="3" value="${m.ppUps||0}" data-ppups="${i}"
                    class="w-10 px-1 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                </label>
              </div>
            </div>`;
          }).join('')}`;

    // Gen2+ extra fields: held item
    if (adapter && adapter.supportsFeature('heldItems')) {
        const heldItemId = localMon.genExtension?.heldItem ?? localMon.heldItem ?? 0;
        const itemList = adapter.getItemList();
        html += `
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 pt-2">Held Item</h3>
          <select id="pe-held-item" class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
            <option value="0">None</option>
            ${itemList.map((item, i) => i > 0 ? `<option value="${i}" ${i === heldItemId ? 'selected' : ''}>${item}</option>` : '').join('')}
          </select>`;
    }

    // Shiny checkbox for Gen2+
    if (adapter && adapter.supportsFeature('shiny')) {
        const isShiny = localMon.genExtension?.isShiny ?? localMon.isShiny ?? false;
        html += `
          <div class="flex items-center gap-2 pt-2">
            <input id="pe-shiny" type="checkbox" ${isShiny ? 'checked' : ''} class="accent-yellow-400">
            <label for="pe-shiny" class="text-xs text-gray-500 dark:text-gray-400 font-bold">✨ Shiny</label>
          </div>`;
    }

    // Gender for Gen2+
    if (adapter && adapter.supportsFeature('gender')) {
        const gender = localMon.genExtension?.gender ?? localMon.gender ?? 'Genderless';
        html += `
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Gender</label>
            <select id="pe-gender" class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
              ${['Male','Female','Genderless'].map(g => `<option value="${g}" ${g === gender ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>`;
    }

    // Friendship for Gen2+
    if (adapter && adapter.supportsFeature('friendship')) {
        const friendship = localMon.genExtension?.friendship ?? localMon.friendship ?? 0;
        html += `
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Friendship</label>
            <input id="pe-friendship" type="number" min="0" max="255" value="${friendship}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>`;
    }

    html += `
        </div>`;

    return html;
}

export function bindEvents(container, eventBus, appState, localMon, generation = 1, adapter = null) {
    // Held item
    const heldEl = document.getElementById('pe-held-item');
    if (heldEl) {
        heldEl.addEventListener('change', () => {
            if (!localMon.genExtension) localMon.genExtension = {};
            localMon.genExtension.heldItem = Number(heldEl.value);
        });
    }

    // Shiny
    const shinyEl = document.getElementById('pe-shiny');
    if (shinyEl) {
        shinyEl.addEventListener('change', () => {
            if (!localMon.genExtension) localMon.genExtension = {};
            localMon.genExtension.isShiny = shinyEl.checked;
        });
    }

    // Gender
    const genderEl = document.getElementById('pe-gender');
    if (genderEl) {
        genderEl.addEventListener('change', () => {
            if (!localMon.genExtension) localMon.genExtension = {};
            localMon.genExtension.gender = genderEl.value;
        });
    }

    // Friendship
    const friendEl = document.getElementById('pe-friendship');
    if (friendEl) {
        friendEl.addEventListener('change', () => {
            if (!localMon.genExtension) localMon.genExtension = {};
            localMon.genExtension.friendship = Number(friendEl.value);
        });
    }
}
