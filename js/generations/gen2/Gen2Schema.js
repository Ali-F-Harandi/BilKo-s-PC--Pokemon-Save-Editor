/**
 * Gen2Schema.js — UI Schema for Generation II
 *
 * Defines the field layout for schema-driven UI rendering in Gen 2.
 * Extends Gen 1 schema by:
 * - Making held item, shiny, and gender fields visible
 * - Hiding catch rate (repurposed in Gen 2 as held item byte for eggs)
 * - Replacing unified Special stat with split SpAtk/SpDef
 * - Replacing Special EV with SpAtk/SpDef EVs (shared in Gen 2 but displayed separately)
 * - Replacing Special DV with SpAtk/SpDef DVs (shared in Gen 2 but displayed separately)
 * - Adding friendship, pokerus, and egg steps fields
 */

import { Gen1Schema } from '../gen1/Gen1Schema.js';

export const Gen2Schema = {
    pokemonSchema: {
        sections: [
            {
                id: 'identity',
                label: 'Pokémon Identity',
                fields: [
                    { key: 'species', label: 'Species', type: 'select', source: 'pokemonList', required: true },
                    { key: 'nickname', label: 'Nickname', type: 'text', maxLength: 10 },
                    { key: 'otName', label: 'OT Name', type: 'text', maxLength: 7 },
                    { key: 'otId', label: 'OT ID', type: 'number', min: 0, max: 65535 },
                    { key: 'level', label: 'Level', type: 'number', min: 1, max: 100 },
                    { key: 'experience', label: 'Experience', type: 'number', min: 0 },
                ]
            },
            {
                id: 'types',
                label: 'Types',
                fields: [
                    { key: 'type1', label: 'Type 1', type: 'select', source: 'typeList' },
                    { key: 'type2', label: 'Type 2', type: 'select', source: 'typeList' },
                ]
            },
            {
                id: 'stats',
                label: 'Stats',
                fields: [
                    { key: 'hp', label: 'HP', type: 'number', min: 0, max: 999, readOnly: true },
                    { key: 'maxHp', label: 'Max HP', type: 'number', min: 0, max: 999 },
                    { key: 'attack', label: 'Attack', type: 'number', min: 0, max: 999 },
                    { key: 'defense', label: 'Defense', type: 'number', min: 0, max: 999 },
                    { key: 'speed', label: 'Speed', type: 'number', min: 0, max: 999 },
                    { key: 'spAttack', label: 'Sp.Atk', type: 'number', min: 0, max: 999 },
                    { key: 'spDefense', label: 'Sp.Def', type: 'number', min: 0, max: 999 },
                ]
            },
            {
                id: 'evs',
                label: 'EVs (Stat Experience)',
                fields: [
                    { key: 'evHp', label: 'HP EV', type: 'number', min: 0, max: 65535 },
                    { key: 'evAttack', label: 'Atk EV', type: 'number', min: 0, max: 65535 },
                    { key: 'evDefense', label: 'Def EV', type: 'number', min: 0, max: 65535 },
                    { key: 'evSpeed', label: 'Spd EV', type: 'number', min: 0, max: 65535 },
                    { key: 'evSpAttack', label: 'Sp.A EV', type: 'number', min: 0, max: 65535 },
                    { key: 'evSpDefense', label: 'Sp.D EV', type: 'number', min: 0, max: 65535 },
                ]
            },
            {
                id: 'ivs',
                label: 'IVs (DVs)',
                fields: [
                    { key: 'ivAttack', label: 'Atk DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivDefense', label: 'Def DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivSpeed', label: 'Spd DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivSpAttack', label: 'Sp.A DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivSpDefense', label: 'Sp.D DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivHp', label: 'HP DV', type: 'number', min: 0, max: 15, readOnly: true, computed: true },
                ]
            },
            {
                id: 'moves',
                label: 'Moves',
                fields: [
                    { key: 'move1', label: 'Move 1', type: 'move-select', index: 0 },
                    { key: 'move1PP', label: 'PP', type: 'number', min: 0, max: 63, index: 0 },
                    { key: 'move1PPUp', label: 'PP Up', type: 'number', min: 0, max: 3, index: 0 },
                    { key: 'move2', label: 'Move 2', type: 'move-select', index: 1 },
                    { key: 'move2PP', label: 'PP', type: 'number', min: 0, max: 63, index: 1 },
                    { key: 'move2PPUp', label: 'PP Up', type: 'number', min: 0, max: 3, index: 1 },
                    { key: 'move3', label: 'Move 3', type: 'move-select', index: 2 },
                    { key: 'move3PP', label: 'PP', type: 'number', min: 0, max: 63, index: 2 },
                    { key: 'move3PPUp', label: 'PP Up', type: 'number', min: 0, max: 3, index: 2 },
                    { key: 'move4', label: 'Move 4', type: 'move-select', index: 3 },
                    { key: 'move4PP', label: 'PP', type: 'number', min: 0, max: 63, index: 3 },
                    { key: 'move4PPUp', label: 'PP Up', type: 'number', min: 0, max: 3, index: 3 },
                ]
            },
            {
                id: 'misc',
                label: 'Misc',
                fields: [
                    { key: 'heldItem', label: 'Held Item', type: 'select', source: 'itemList' },
                    { key: 'shiny', label: 'Shiny', type: 'checkbox' },
                    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Genderless'] },
                    { key: 'status', label: 'Status', type: 'select', options: ['OK', 'SLP', 'PSN', 'BRN', 'FRZ', 'PAR'] },
                    { key: 'friendship', label: 'Friendship', type: 'number', min: 0, max: 255 },
                    { key: 'pokerus', label: 'Pokérus', type: 'number', min: 0, max: 15 },
                    { key: 'eggSteps', label: 'Egg Steps', type: 'number', min: 0, max: 65535 },
                    // catchRate hidden in Gen 2 (byte repurposed)
                    { key: 'catchRate', label: 'Catch Rate', type: 'hidden' },
                    // Gen3+ fields still hidden
                    { key: 'ability', label: 'Ability', type: 'hidden' },
                    { key: 'nature', label: 'Nature', type: 'hidden' },
                ]
            }
        ]
    },

    saveSchema: {
        sections: [
            {
                id: 'trainer',
                label: 'Trainer Info',
                fields: [
                    { key: 'name', label: 'Name', type: 'text', maxLength: 7 },
                    { key: 'id', label: 'Trainer ID', type: 'text', maxLength: 5 },
                    { key: 'money', label: 'Money', type: 'number', min: 0, max: 999999 },
                    { key: 'badges', label: 'Badges', type: 'number', min: 0, max: 16 },
                    { key: 'rivalName', label: 'Rival Name', type: 'text', maxLength: 7 },
                    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
                ]
            },
            {
                id: 'options',
                label: 'Options',
                fields: [
                    { key: 'textSpeed', label: 'Text Speed', type: 'select', options: ['Slow', 'Medium', 'Fast'] },
                    { key: 'battleAnimation', label: 'Battle Animation', type: 'select', options: ['On', 'Off'] },
                    { key: 'battleStyle', label: 'Battle Style', type: 'select', options: ['Shift', 'Set'] },
                ]
            }
        ]
    },

    moveSchema: {
        sections: [
            {
                id: 'moveDetails',
                label: 'Move Details',
                fields: [
                    { key: 'name', label: 'Name', type: 'text' },
                    { key: 'type', label: 'Type', type: 'select', source: 'typeList' },
                    { key: 'pp', label: 'Base PP', type: 'number', min: 0, max: 63 },
                    { key: 'power', label: 'Power', type: 'number' },
                    { key: 'accuracy', label: 'Accuracy', type: 'number' },
                    { key: 'category', label: 'Category', type: 'hidden' },
                ]
            }
        ]
    }
};
