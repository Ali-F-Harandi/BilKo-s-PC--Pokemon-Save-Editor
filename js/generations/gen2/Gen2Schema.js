/**
 * Gen2Schema.js — UI Schema for Generation II (Stub)
 *
 * Demonstrates how Gen 2 schema extends Gen 1 schema by
 * changing hidden fields to visible ones.
 *
 * This is NOT functional — it's a demonstration of the pattern.
 */

import { Gen1Schema } from '../gen1/Gen1Schema.js';

export const Gen2Schema = {
    pokemonSchema: {
        sections: Gen1Schema.pokemonSchema.sections.map(section => {
            // Make Gen2-specific fields visible
            if (section.id === 'misc') {
                return {
                    ...section,
                    fields: section.fields.map(f => {
                        if (f.key === 'heldItem') return { ...f, type: 'select', source: 'itemList', label: 'Held Item' };
                        if (f.key === 'shiny') return { ...f, type: 'checkbox', label: 'Shiny' };
                        if (f.key === 'gender') return { ...f, type: 'select', options: ['Male', 'Female', 'Genderless'], label: 'Gender' };
                        if (f.key === 'catchRate') return { ...f, type: 'hidden' }; // Gen2 repurposes catch rate byte
                        return f;
                    })
                };
            }
            // Replace Gen1 "Special" with SpAtk/SpDef in stats section
            if (section.id === 'stats') {
                return {
                    ...section,
                    fields: [
                        ...section.fields.filter(f => f.key !== 'special'),
                        { key: 'spAttack', label: 'Sp.Atk', type: 'number', min: 0, max: 999 },
                        { key: 'spDefense', label: 'Sp.Def', type: 'number', min: 0, max: 999 },
                    ]
                };
            }
            // Replace Gen1 "Special EV" with SpAtk/SpDef EVs
            if (section.id === 'evs') {
                return {
                    ...section,
                    fields: [
                        ...section.fields.filter(f => f.key !== 'evSpecial'),
                        { key: 'evSpAttack', label: 'Sp.A EV', type: 'number', min: 0, max: 65535 },
                        { key: 'evSpDefense', label: 'Sp.D EV', type: 'number', min: 0, max: 65535 },
                    ]
                };
            }
            // Replace Gen1 "Special DV" with SpAtk/SpDef DVs
            if (section.id === 'ivs') {
                return {
                    ...section,
                    fields: [
                        ...section.fields.filter(f => f.key !== 'ivSpecial'),
                        { key: 'ivSpAttack', label: 'Sp.A DV', type: 'number', min: 0, max: 15 },
                        { key: 'ivSpDefense', label: 'Sp.D DV', type: 'number', min: 0, max: 15 },
                    ]
                };
            }
            return section;
        })
    }
};
