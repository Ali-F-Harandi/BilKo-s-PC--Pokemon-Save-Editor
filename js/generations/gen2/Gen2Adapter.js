/**
 * Gen2Adapter.js — Generation II Adapter Stub
 *
 * Placeholder for the Generation II (Gold/Silver/Crystal) adapter.
 * This stub demonstrates how easy it is to add a new generation:
 * simply create a new adapter class extending BaseAdapter and
 * register it in the GenerationRegistry.
 *
 * Key Gen 2 differences from Gen 1:
 * - Held Items
 * - Shiny Pokemon (determined by DVs)
 * - Gender (determined by DVs)
 * - Special stat splits into SpAtk/SpDef
 * - Friendship/Happiness
 * - Pokerus
 * - Breeding/Daycare improvements
 * - Time of Day / RTC
 * - 100 new Pokemon (#152-251)
 * - New types: Dark, Steel
 * - New moves and items
 *
 * This is NOT functional — it's a skeleton showing the structure.
 */

import { BaseAdapter } from '../../core/BaseAdapter.js';

export class Gen2Adapter extends BaseAdapter {
    constructor() {
        super(2, ['gold', 'silver', 'crystal'], 'Generation II');
    }

    // All methods from BaseAdapter throw "not implemented" by default.
    // When Gen 2 is implemented, each method will be overridden here.

    getAbilityList() {
        return []; // Gen 2 still has no abilities
    }

    getMaxPartySize() { return 6; }
    getBoxCapacity() { return 20; }
    getBoxCount() { return 14; } // Gen 2 has 14 boxes

    getValidFileSizes() {
        return [32768, 32768 + 16]; // Same size as Gen 1
    }
}
