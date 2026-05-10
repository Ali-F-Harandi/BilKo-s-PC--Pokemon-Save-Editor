/**
 * Gen1Schema.js — UI Schema for Generation I
 *
 * Defines the field layout for schema-driven UI rendering.
 * Each section describes which fields to show, their types, labels, and constraints.
 * Fields marked `type: 'hidden'` are not rendered — they become visible in later generations.
 */

export const Gen1Schema = {
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
                    { key: 'special', label: 'Special', type: 'number', min: 0, max: 999 },
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
                    { key: 'evSpecial', label: 'Spc EV', type: 'number', min: 0, max: 65535 },
                ]
            },
            {
                id: 'ivs',
                label: 'IVs (DVs)',
                fields: [
                    { key: 'ivAttack', label: 'Atk DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivDefense', label: 'Def DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivSpeed', label: 'Spd DV', type: 'number', min: 0, max: 15 },
                    { key: 'ivSpecial', label: 'Spc DV', type: 'number', min: 0, max: 15 },
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
                    { key: 'catchRate', label: 'Catch Rate', type: 'number', min: 0, max: 255 },
                    { key: 'status', label: 'Status', type: 'select', options: ['OK', 'SLP', 'PSN', 'BRN', 'FRZ', 'PAR'] },
                    // Gen2+ fields hidden in Gen1
                    { key: 'heldItem', label: 'Held Item', type: 'hidden' },
                    { key: 'shiny', label: 'Shiny', type: 'hidden' },
                    { key: 'gender', label: 'Gender', type: 'hidden' },
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
                    { key: 'coins', label: 'Coins', type: 'number', min: 0, max: 9999 },
                    { key: 'badges', label: 'Badges', type: 'number', min: 0, max: 255 },
                    { key: 'rivalName', label: 'Rival Name', type: 'text', maxLength: 7 },
                    { key: 'pikachuFriendship', label: 'Pikachu Friendship', type: 'number', min: 0, max: 255 },
                ]
            },
            {
                id: 'options',
                label: 'Options',
                fields: [
                    { key: 'textSpeed', label: 'Text Speed', type: 'select', options: ['Slow', 'Normal', 'Fast'] },
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
                    // Gen4+ category (Physical/Special/Status)
                    { key: 'category', label: 'Category', type: 'hidden' },
                ]
            }
        ]
    }
};
