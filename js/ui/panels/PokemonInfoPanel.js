/**
 * PokemonInfoPanel.js — Pokemon Identity Section Panel
 *
 * Refactored: Uses adapter for all data lookups instead of direct imports.
 * The adapter is passed in as a parameter.
 */

export function render(localMon, appState, generation = 1, adapter = null) {
    const dexId = localMon.dexId || 0;
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;

    // Use adapter for data lookups
    const pokemonList = adapter ? adapter.getPokemonList() : [];
    const speciesName = pokemonList[dexId] || '';

    // Types via adapter
    let typeBadgesHtml = '';
    if (adapter) {
        // First try using typeNames from the Pokemon data (reflects user edits)
        let types = [];
        if (localMon.typeNames && localMon.typeNames.length > 0) {
            // Filter out duplicate types for single-type Pokemon (e.g., ['Normal', 'Normal'] → ['Normal'])
            types = localMon.typeNames.filter(t => t && t !== '');
            if (types.length === 2 && types[0] === types[1]) {
                types = [types[0]];
            }
        } else {
            types = adapter.getPokemonTypes(dexId);
        }
        const colors = adapter.getTypeColors();
        typeBadgesHtml = types.map(t =>
            `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style="background:${colors[t]||'#999'}">${t}</span>`
        ).join(' ');
    }

    // Growth rate and level from EXP via adapter
    let growthInfo = '';
    if (adapter) {
        const rate = adapter.getGrowthRate(dexId);
        const lvFromExp = adapter.getLevelFromExp(localMon.exp || 0, rate);
        growthInfo = `Growth: ${rate} · Lv from EXP: ${lvFromExp}`;
    }

    return `
        <!-- LEFT: Identity -->
        <div class="lg:col-span-4 space-y-4">
          <div class="flex justify-center">
            <img id="pe-sprite" src="${spriteUrl}" alt="${speciesName}"
              class="w-32 h-32 pixelated hover:scale-110 transition-transform cursor-pointer" onerror="this.style.display='none'">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Species</label>
            <div class="relative">
              <input id="pe-species" type="text" value="${speciesName}" placeholder="Search species..."
                class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/40" autocomplete="off">
              <div id="pe-species-dd" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden"></div>
            </div>
          </div>
          <div id="pe-types" class="flex gap-2 flex-wrap">${typeBadgesHtml}</div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">OT Name</label>
            <input id="pe-ot" type="text" value="${localMon.otName||''}" maxlength="7"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">OT Trainer ID</label>
            <input id="pe-otid" type="number" min="0" max="65535" value="${localMon.otId||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Experience</label>
            <input id="pe-exp" type="number" min="0" max="2700000" value="${localMon.exp||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${growthInfo}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Pokérus</label>
            <input id="pe-pokerus" type="number" min="0" max="255" value="${localMon.pokerus||0}"
              class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
          </div>
        </div>`;
}

export function bindEvents(container, eventBus, appState, localMon, generation = 1, adapter = null) {
    // No extra events needed for info panel when using schema-driven modal
}
