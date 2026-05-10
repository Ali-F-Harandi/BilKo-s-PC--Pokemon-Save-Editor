/**
 * GenderSection.js — Gen2 Gender Display Extension
 *
 * Extends PokemonInfoPanel with a gender indicator that shows the
 * Pokemon's gender based on its Attack DV and species gender ratio.
 * In Gen 2, gender is determined by comparing the Attack DV against
 * a species-specific threshold.
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';
import { GEN2_GENDER_RATIOS } from '../data/pokemonData.js';

export class GenderSection extends PanelExtension {
    constructor() {
        super('gen2-gender', 'Gender', 2);
    }

    render(data) {
        const gender = data.genExtension?.gender ?? 'Genderless';
        const dexId = data.dexId || 0;
        const ratio = GEN2_GENDER_RATIOS[dexId] || 'genderless';

        // Gender symbol
        const genderSymbol = gender === 'Male' ? '♂' : gender === 'Female' ? '♀' : '—';
        const genderColor = gender === 'Male'
            ? 'text-blue-600 dark:text-blue-400'
            : gender === 'Female'
                ? 'text-pink-600 dark:text-pink-400'
                : 'text-gray-500 dark:text-gray-400';

        // Gender ratio description
        const ratioDescriptions = {
            'genderless': 'This species has no gender.',
            'all-male': 'This species is always male (0% female).',
            'male-87.5': '87.5% male / 12.5% female (e.g., starters, Eevee).',
            'male-75': '75% male / 25% female.',
            'male-50': '50% male / 50% female.',
            'female-75': '25% male / 75% female.',
            'all-female': 'This species is always female (0% male).',
        };

        const ratioDesc = ratioDescriptions[ratio] || 'Unknown gender ratio.';

        // Build gender select options
        const genderOptions = ratio === 'genderless'
            ? '<option value="Genderless" selected>Genderless</option>'
            : ratio === 'all-male'
                ? '<option value="Male" selected>Male</option>'
                : ratio === 'all-female'
                    ? '<option value="Female" selected>Female</option>'
                    : `
                    <option value="Male" ${gender === 'Male' ? 'selected' : ''}>Male ♂</option>
                    <option value="Female" ${gender === 'Female' ? 'selected' : ''}>Female ♀</option>
                    <option value="Genderless" ${gender === 'Genderless' ? 'selected' : ''}>Genderless</option>
                `;

        return `
          <div class="bg-gray-100 dark:bg-white/5 rounded-xl p-3 space-y-2 mt-4">
            <div class="flex items-center gap-2">
              <span class="text-lg ${genderColor}">${genderSymbol}</span>
              <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Gender</label>
            </div>
            <select id="pe-gender" class="w-full px-2 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-white/30">
              ${genderOptions}
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-500">${ratioDesc}</p>
            <p class="text-xs text-blue-600 dark:text-blue-400/70">Gen 2: Gender is determined by the Attack DV.</p>
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        const select = container.querySelector('#pe-gender');
        if (select) {
            select.addEventListener('change', (e) => {
                // Parent modal handles the actual data update
                // Changing gender adjusts the Attack DV to match the threshold
            });
        }
    }
}
