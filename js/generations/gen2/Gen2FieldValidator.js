/**
 * Gen2FieldValidator.js — Generation II Field Validation (Gold, Silver, Crystal)
 *
 * Provides per-generation validation rules for ALL editable fields:
 * - Trainer Card: name, rival name, ID, money, coins, play time, badges (Johto+Kanto), gender, friendship
 * - Pokemon: level, species, moves, EVs, IVs/DVs, PP, held items, friendship, pokerus, egg, caught data
 * - Inventory: item IDs, item quantities, pocket sizes (bag, ball, key item, TM/HM, PC)
 *
 * Research sources:
 * - PKHeX source code (SAV2.cs, PK2.cs, PokeList2.cs)
 * - pokecrystal/pokegold disassembly
 * - Gen 2 save format: 32,768 bytes (International)
 * - Player name: 11 bytes (10 chars + 0x50 terminator), max 7 displayable Western
 * - Rival name: 11 bytes, max 7 displayable
 * - Trainer ID: 2 bytes big-endian (0-65535)
 * - Money: 3 bytes binary (0-999999)
 * - Casino Coins: 2 bytes (0-9999)
 * - Johto Badges: 1 byte (8 bits)
 * - Kanto Badges: 1 byte (8 bits) — Gen2 has 16 badges total
 * - Gender: 1 byte (0x00=Male, 0x01=Female) — Crystal only
 * - Friendship: 1 byte (0-255)
 * - Pokerus: 1 byte (high nibble=strain 0-15, low nibble=days 0-15)
 * - Party: max 6 Pokemon
 * - PC Boxes: 14 boxes x 20 Pokemon
 * - Level: 1-100
 * - Species: 1-251 (0 = empty, 0xFD = egg)
 * - Moves: 0-251
 * - DVs: 0-15 (4 bits each, packed into 2 bytes: Atk/Def/Spd/Spc)
 * - EVs: 0-65535 (2 bytes each)
 * - PP: base PP * (1 + PP Ups * 3/8)
 * - Held Items: 0-255 (1 byte)
 * - Item quantity: 0-99
 * - Caught Data: 2 bytes (Crystal only)
 * - Experience: 3 bytes (max 16777215)
 */

import { BaseFieldValidator } from '../../core/validation/BaseFieldValidator.js';

const GEN2_LIMITS = {
    trainer: {
        name:           { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        rivalName:      { type: 'text', maxLength: 7,  minLength: 1, pattern: /^[A-Za-z0-9\-_?!.*,\s]*$/ },
        id:             { type: 'number', min: 0, max: 65535 },
        money:          { type: 'number', min: 0, max: 999999 },
        coins:          { type: 'number', min: 0, max: 9999 },
        johtoBadges:    { type: 'number', min: 0, max: 255 },
        kantoBadges:    { type: 'number', min: 0, max: 255 },
        gender:         { type: 'select', options: ['Male', 'Female'] },
        friendship:     { type: 'number', min: 0, max: 255 },
        playTime:       { type: 'playtime', maxHours: 999, maxMinutes: 59 },
    },
    pokemon: {
        level:          { type: 'number', min: 1, max: 100 },
        species:        { type: 'number', min: 1, max: 251 },
        hp:             { type: 'number', min: 0, max: 999 },
        maxHp:          { type: 'number', min: 1, max: 999 },
        attack:         { type: 'number', min: 0, max: 999 },
        defense:        { type: 'number', min: 0, max: 999 },
        speed:          { type: 'number', min: 0, max: 999 },
        spAttack:       { type: 'number', min: 0, max: 999 },
        spDefense:      { type: 'number', min: 0, max: 999 },
        move1:          { type: 'number', min: 0, max: 251 },
        move2:          { type: 'number', min: 0, max: 251 },
        move3:          { type: 'number', min: 0, max: 251 },
        move4:          { type: 'number', min: 0, max: 251 },
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
        evSpAttack:     { type: 'number', min: 0, max: 65535 },
        evSpDefense:    { type: 'number', min: 0, max: 65535 },
        ivAttack:       { type: 'number', min: 0, max: 15 },
        ivDefense:      { type: 'number', min: 0, max: 15 },
        ivSpeed:        { type: 'number', min: 0, max: 15 },
        ivSpecial:      { type: 'number', min: 0, max: 15 },
        heldItem:       { type: 'number', min: 0, max: 255 },
        friendship:     { type: 'number', min: 0, max: 255 },
        pokerus:        { type: 'number', min: 0, max: 255 },
        experience:     { type: 'number', min: 0, max: 16777215 },
        isEgg:          { type: 'boolean' },
        caughtData:     { type: 'number', min: 0, max: 65535 },
    },
    inventory: {
        itemId:         { type: 'number', min: 0, max: 255 },
        itemQuantity:   { type: 'number', min: 1, max: 99 },
        bagSlots:       { type: 'number', min: 0, max: 20 },
        ballSlots:      { type: 'number', min: 0, max: 12 },
        keyItemSlots:   { type: 'number', min: 0, max: 25 },
        tmHmSlots:      { type: 'number', min: 0, max: 57 },
        pcSlots:        { type: 'number', min: 0, max: 50 },
    },
    capacity: {
        partySize:      { type: 'number', min: 0, max: 6 },
        boxCapacity:    { type: 'number', min: 0, max: 20 },
        boxCount:       { type: 'number', min: 0, max: 14 },
        maxSpecies:     { type: 'number', min: 1, max: 251 },
        maxMoveId:      { type: 'number', min: 0, max: 251 },
        maxItemId:      { type: 'number', min: 0, max: 255 },
    }
};

export class Gen2FieldValidator extends BaseFieldValidator {
    constructor() {
        super(2);
        this._limits = GEN2_LIMITS;
    }
}
