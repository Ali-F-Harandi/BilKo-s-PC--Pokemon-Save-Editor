/**
 * ShinyFlagSection.js — Gen2 Shiny Indicator Extension
 *
 * Extends PokemonInfoPanel with a shiny indicator that shows whether
 * the Pokemon is shiny based on its DVs. In Gen 2, shininess is
 * determined by specific DV values, not a separate flag.
 *
 * Shiny criteria: Defense=10, Speed=10, Special=10, Attack in {2,3,6,7,10,11,14,15}
 */

import { PanelExtension } from '../../../ui/panels/PanelExtension.js';
import { GEN2_SHINY_ATTACK_DVS, GEN2_SHINY_STAT_DV } from '../constants.js';

export class ShinyFlagSection extends PanelExtension {
    constructor() {
        super('gen2-shiny-flag', 'Shiny Status', 2);
    }

    render(data) {
        const isShiny = data.genExtension?.isShiny ?? false;
        const ivs = data.ivs || {};
        const atkDv = ivs.attack ?? 0;
        const defDv = ivs.defense ?? 0;
        const spdDv = ivs.speed ?? 0;
        const spcDv = ivs.special ?? ivs.spAttack ?? 0;

        // Verify shiny from DVs
        const calculatedShiny = defDv === GEN2_SHINY_STAT_DV &&
                                spdDv === GEN2_SHINY_STAT_DV &&
                                spcDv === GEN2_SHINY_STAT_DV &&
                                GEN2_SHINY_ATTACK_DVS.includes(atkDv);

        const shinyClass = calculatedShiny
            ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600'
            : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10';

        const shinyIcon = calculatedShiny ? '✨' : '☆';
        const shinyText = calculatedShiny ? 'This Pokemon is SHINY!' : 'Not shiny';
        const shinyDesc = calculatedShiny
            ? 'DV combination produces a shiny Pokemon (star sparkle animation in-game).'
            : `Requires Def=${GEN2_SHINY_STAT_DV}, Spd=${GEN2_SHINY_STAT_DV}, Spc=${GEN2_SHINY_STAT_DV}, and Atk in [${GEN2_SHINY_ATTACK_DVS.join(', ')}].`;

        return `
          <div class="rounded-xl p-3 space-y-2 mt-4 border-2 ${shinyClass}">
            <div class="flex items-center gap-2">
              <span class="text-lg">${shinyIcon}</span>
              <label class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Shiny Status</label>
            </div>
            <p class="text-sm font-bold ${calculatedShiny ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}">${shinyText}</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">${shinyDesc}</p>
            <div class="flex items-center gap-2 mt-1">
              <input id="pe-shiny-toggle" type="checkbox" ${calculatedShiny ? 'checked' : ''}
                class="rounded border-gray-300 dark:border-white/10 text-yellow-500 focus:ring-yellow-400">
              <label for="pe-shiny-toggle" class="text-xs text-gray-600 dark:text-gray-400">Make Shiny (adjusts DVs)</label>
            </div>
          </div>`;
    }

    bindEvents(container, eventBus, appState) {
        const checkbox = container.querySelector('#pe-shiny-toggle');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                // Parent modal handles actual data update
                // When toggled ON: sets Def=10, Spd=10, Spc=10, Atk=10 (a valid shiny Atk DV)
                // When toggled OFF: randomizes or resets DVs
            });
        }
    }
}
