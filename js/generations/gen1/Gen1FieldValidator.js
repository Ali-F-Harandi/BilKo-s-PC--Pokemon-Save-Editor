/**
 * Gen1FieldValidator.js — Generation I Field Validation (Red, Blue, Yellow)
 *
 * Provides per-generation validation rules for ALL editable fields:
 * - Trainer Card: name, rival name, ID, money, coins, play time, badges, pikachu friendship
 * - Pokemon: level, species, moves, EVs, IVs/DVs, PP, catch rate
 * - Inventory: item IDs, item quantities, pocket sizes
 *
 * Research sources:
 * - Pokemon Red/Blue RAM Map: https://datacrystal.romhacking.net/wiki/Pokemon_Red/Blue/RAM_map
 * - PKHeX source code (SAV1.cs, PK1.cs)
 * - Gen 1 save format: 32,768 bytes (or 32,784 with header)
 * - Player name: 11 bytes (10 chars + 0x50 terminator), max 7 displayable in Western
 * - Rival name: same format
 * - Trainer ID: 2 bytes big-endian (0-65535)
 * - Money: 3 bytes binary (0-999999)
 * - Casino Coins: 2 bytes binary (0-9999)
 * - Badges: 1 byte (8 bits = 8 Kanto badges)
 * - Pikachu Friendship: 1 byte (0-255, Yellow only)
 * - Party: max 6 Pokemon
 * - PC Boxes: 12 boxes x 20 Pokemon
 * - Level: 1-100
 * - Species: 1-151 (0 = empty slot)
 * - Moves: 0-165
 * - EVs: 0-65535 (2 bytes each)
 * - IVs/DVs: 0-15 (4 bits each, packed into 2 bytes)
 * - PP: base PP * (1 + PP Ups * 3/8), max 61 for Splash
 * - Items: 0-255 (1 byte per item ID)
 * - Item quantity: 0-99 (1 byte per quantity)
 * - Catch Rate: 0-255 (1 byte, Gen1 only)
 */

import { BaseFieldValidator } from '../../core/validation/BaseFieldValidator.js';

const GEN1_LIMITS = {
    trainer: {
        name:           { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        rivalName:      { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        id:             { type: 'number', min: 0, max: 65535 },
        money:          { type: 'number', min: 0, max: 999999 },
        coins:          { type: 'number', min: 0, max: 9999 },
        badges:         { type: 'number', min: 0, max: 255 },
        pikachuFriendship: { type: 'number', min: 0, max: 255 },
        playTime:       { type: 'playtime', maxHours: 999, maxMinutes: 59 },
    },
    pokemon: {
        level:          { type: 'number', min: 1, max: 100 },
        species:        { type: 'number', min: 1, max: 151 },
        hp:             { type: 'number', min: 0, max: 999 },
        maxHp:          { type: 'number', min: 1, max: 999 },
        attack:         { type: 'number', min: 0, max: 999 },
        defense:        { type: 'number', min: 0, max: 999 },
        speed:          { type: 'number', min: 0, max: 999 },
        special:        { type: 'number', min: 0, max: 999 },
        move1:          { type: 'number', min: 0, max: 165 },
        move2:          { type: 'number', min: 0, max: 165 },
        move3:          { type: 'number', min: 0, max: 165 },
        move4:          { type: 'number', min: 0, max: 165 },
        pp1:            { type: 'number', min: 0, max: 61 },
        pp2:            { type: 'number', min: 0, max: 61 },
        pp3:            { type: 'number', min: 0, max: 61 },
        pp4:            { type: 'number', min: 0, max: 61 },
        ppUps1:         { type: 'number', min: 0, max: 3 },
        ppUps2:         { type: 'number', min: 0, max: 3 },
        ppUps3:         { type: 'number', min: 0, max: 3 },
        ppUps4:         { type: 'number', min: 0, max: 3 },
        evHp:           { type: 'number', min: 0, max: 65535 },
        evAttack:       { type: 'number', min: 0, max: 65535 },
        evDefense:      { type: 'number', min: 0, max: 65535 },
        evSpeed:        { type: 'number', min: 0, max: 65535 },
        evSpecial:      { type: 'number', min: 0, max: 65535 },
        ivAttack:       { type: 'number', min: 0, max: 15 },
        ivDefense:      { type: 'number', min: 0, max: 15 },
        ivSpeed:        { type: 'number', min: 0, max: 15 },
        ivSpecial:      { type: 'number', min: 0, max: 15 },
        catchRate:      { type: 'number', min: 0, max: 255 },
        experience:     { type: 'number', min: 0, max: 16777215 },
    },
    inventory: {
        itemId:         { type: 'number', min: 0, max: 255 },
        itemQuantity:   { type: 'number', min: 1, max: 99 },
        bagSlots:       { type: 'number', min: 0, max: 20 },
        pcSlots:        { type: 'number', min: 0, max: 50 },
    },
    capacity: {
        partySize:      { type: 'number', min: 0, max: 6 },
        boxCapacity:    { type: 'number', min: 0, max: 20 },
        boxCount:       { type: 'number', min: 0, max: 12 },
        maxSpecies:     { type: 'number', min: 1, max: 151 },
        maxMoveId:      { type: 'number', min: 0, max: 165 },
        maxItemId:      { type: 'number', min: 0, max: 255 },
    }
};

export class Gen1FieldValidator extends BaseFieldValidator {
    constructor() {
        super(1);
        this._limits = GEN1_LIMITS;
    }
}
