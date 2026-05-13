/**
 * CanonicalModel.js — Canonical Data Model for Multi-Generation Pokémon Save Editor
 *
 * Defines the universal data structures that all generation adapters
 * translate to and from. This is the "lingua franca" of the application:
 * all code operates on CanonicalPokemon and CanonicalSaveFile, never on
 * raw binary or generation-specific formats directly.
 *
 * Design Principles:
 * - Universal fields: present in all generations (species, level, moves, etc.)
 * - genExtension: generation-specific fields that don't map to universal concepts
 * - Stats use a structured object with all possible stat names; unused ones are 0
 * - Moves always have 4 slots; unused slots have id=0
 * - The model is a plain data object (no methods) for easy serialization
 */

/**
 * CanonicalPokemon — Universal Pokémon data structure
 *
 * Every generation adapter must translate its binary format to/from this model.
 * Fields that don't exist in a generation are left at their default values.
 *
 * @typedef {Object} CanonicalPokemon
 */
export class CanonicalPokemon {
    /**
     * @param {Object} [data={}] - Initial data to populate
     */
    constructor(data = {}) {
        // ---- Identity ----
        /** @type {number} National Dex ID (e.g., 25 for Pikachu) */
        this.dexId = data.dexId ?? 0;
        /** @type {number} Internal species ID (generation-specific, used for binary mapping) */
        this.speciesId = data.speciesId ?? 0;
        /** @type {string} Display species name */
        this.speciesName = data.speciesName ?? '';
        /** @type {string} Nickname */
        this.nickname = data.nickname ?? '';
        /** @type {boolean} Whether the nickname differs from species name */
        this.isNicknamed = data.isNicknamed ?? false;
        /** @type {number} Form number (0 = default) */
        this.form = data.form ?? 0;

        // ---- Original Trainer ----
        /** @type {string} Original Trainer name */
        this.otName = data.otName ?? data.originalTrainerName ?? '';
        /** @type {number} Original Trainer ID */
        this.otId = data.otId ?? data.originalTrainerId ?? 0;
        /** @type {number} Secret ID (Gen 3+, 0 for Gen 1-2) */
        this.secretId = data.secretId ?? 0;
        /** @type {'Male'|'Female'|'Genderless'} OT gender */
        this.otGender = data.otGender ?? data.originalTrainerGender ?? 'Male';

        // ---- Level & Experience ----
        /** @type {number} Current level (1-100) */
        this.level = data.level ?? 1;
        /** @type {number} Current experience points */
        this.experience = data.experience ?? data.exp ?? 0;

        // ---- Moves (always 4 slots) ----
        /** @type {Array<{id: number, pp: number, ppUps: number}>} */
        this.moves = data.moves ?? [
            { id: 0, pp: 0, ppUps: 0 },
            { id: 0, pp: 0, ppUps: 0 },
            { id: 0, pp: 0, ppUps: 0 },
            { id: 0, pp: 0, ppUps: 0 }
        ];

        // ---- Stats (current values) ----
        /** @type {Object} Current stat values */
        this.stats = data.stats ?? {
            hp: data.hp ?? 0,
            maxHp: data.maxHp ?? 0,
            attack: data.attack ?? 0,
            defense: data.defense ?? 0,
            speed: data.speed ?? 0,
            special: data.special ?? 0,     // Gen 1-2: combined Special
            spAttack: data.spAttack ?? data.spAtk ?? 0,   // Gen 2+: split Special
            spDefense: data.spDefense ?? data.spDef ?? 0    // Gen 2+: split Special
        };

        // ---- EVs (Effort Values / Stat Experience) ----
        /** @type {Object} Effort values */
        this.evs = data.evs ?? data.ev ?? {
            hp: 0, attack: 0, defense: 0, speed: 0,
            special: 0, spAttack: 0, spDefense: 0
        };

        // ---- IVs (Individual Values / Determinant Values) ----
        /** @type {Object} Individual values */
        this.ivs = data.ivs ?? data.iv ?? {
            hp: 0, attack: 0, defense: 0, speed: 0,
            special: 0, spAttack: 0, spDefense: 0
        };

        // ---- Types ----
        /** @type {number[]} Type IDs (1-2 entries) */
        this.types = data.types ?? [0, 0];
        /** @type {string[]} Type names */
        this.typeNames = data.typeNames ?? [data.type1Name ?? '', data.type2Name ?? ''];

        // ---- Status ----
        /** @type {string} Status condition string */
        this.status = data.status ?? 'OK';

        // ---- Location ----
        /** @type {boolean} Whether this Pokemon is in the party (affects binary struct size) */
        this.isParty = data.isParty ?? false;
        /** @type {boolean} Whether this is an egg */
        this.isEgg = data.isEgg ?? false;

        // ---- Raw Data (for lossless round-trip) ----
        /** @type {Uint8Array} Raw binary struct bytes */
        this.raw = data.raw ?? null;
        /** @type {number} Start offset in the save file */
        this.startOffset = data.startOffset ?? 0;
        /** @type {Uint8Array} Raw nickname bytes */
        this.nicknameRaw = data.nicknameRaw ?? null;
        /** @type {Uint8Array} Raw OT name bytes */
        this.otNameRaw = data.otNameRaw ?? null;

        // ---- Generation-Specific Extension ----
        // Gen 1: catchRate
        // Gen 2: heldItem, isShiny, gender, friendship, pokerus, eggSteps
        // Gen 3+: ability, nature, characteristic, pokeball, contestStats, etc.
        // Gen 6+: megaEvolution
        /** @type {Object} Generation-specific fields not in the universal model */
        this.genExtension = data.genExtension ?? {};
    }

    /**
     * Convert to a plain object for serialization.
     * Handles Uint8Array fields by converting to arrays.
     * @returns {Object}
     */
    toJSON() {
        const obj = {};
        for (const [key, value] of Object.entries(this)) {
            if (value instanceof Uint8Array) {
                obj[key] = Array.from(value);
            } else {
                obj[key] = value;
            }
        }
        return obj;
    }

    /**
     * Create a CanonicalPokemon from a legacy ParsedSave Pokemon object.
     * This is a bridge for backward compatibility during Phase 1.
     * @param {Object} legacyMon - The old format Pokemon object
     * @returns {CanonicalPokemon}
     */
    static fromLegacy(legacyMon) {
        if (!legacyMon) return new CanonicalPokemon();

        return new CanonicalPokemon({
            dexId: legacyMon.dexId,
            speciesId: legacyMon.speciesId,
            speciesName: legacyMon.speciesName,
            nickname: legacyMon.nickname,
            isNicknamed: legacyMon.isNicknamed,
            form: legacyMon.form ?? 0,

            otName: legacyMon.originalTrainerName,
            otId: legacyMon.originalTrainerId,
            secretId: legacyMon.secretId ?? 0,
            otGender: legacyMon.originalTrainerGender ?? 'Male',

            level: legacyMon.level,
            experience: legacyMon.exp,

            moves: [
                { id: legacyMon.moveIds?.[0] ?? 0, pp: legacyMon.movePp?.[0] ?? 0, ppUps: legacyMon.movePpUps?.[0] ?? 0 },
                { id: legacyMon.moveIds?.[1] ?? 0, pp: legacyMon.movePp?.[1] ?? 0, ppUps: legacyMon.movePpUps?.[1] ?? 0 },
                { id: legacyMon.moveIds?.[2] ?? 0, pp: legacyMon.movePp?.[2] ?? 0, ppUps: legacyMon.movePpUps?.[2] ?? 0 },
                { id: legacyMon.moveIds?.[3] ?? 0, pp: legacyMon.movePp?.[3] ?? 0, ppUps: legacyMon.movePpUps?.[3] ?? 0 }
            ],

            stats: {
                hp: legacyMon.hp,
                maxHp: legacyMon.maxHp,
                attack: legacyMon.attack,
                defense: legacyMon.defense,
                speed: legacyMon.speed,
                special: legacyMon.special,
                spAttack: legacyMon.spAtk ?? legacyMon.special,
                spDefense: legacyMon.spDef ?? legacyMon.special
            },

            evs: legacyMon.ev ?? { hp: 0, attack: 0, defense: 0, speed: 0, special: 0, spAttack: 0, spDefense: 0 },
            ivs: legacyMon.iv ?? { hp: 0, attack: 0, defense: 0, speed: 0, special: 0, spAttack: 0, spDefense: 0 },

            types: [legacyMon.type1 ?? 0, (legacyMon.type1 !== undefined && legacyMon.type2 !== undefined && legacyMon.type1 === legacyMon.type2) ? 0 : (legacyMon.type2 ?? 0)],
            typeNames: [legacyMon.type1Name ?? '', (legacyMon.type1Name && legacyMon.type2Name && legacyMon.type1Name === legacyMon.type2Name) ? '' : (legacyMon.type2Name ?? '')],

            status: legacyMon.status ?? 'OK',
            isParty: legacyMon.isParty ?? false,
            isEgg: legacyMon.isEgg ?? false,

            raw: legacyMon.raw ?? null,
            startOffset: legacyMon.startOffset ?? 0,
            nicknameRaw: legacyMon.nicknameRaw ?? null,
            otNameRaw: legacyMon.otNameRaw ?? null,

            genExtension: {
                catchRate: legacyMon.catchRate
            }
        });
    }

    /**
     * Convert this CanonicalPokemon back to the legacy format.
     * This is a bridge for backward compatibility during Phase 1.
     * @returns {Object} Legacy PokemonStats object
     */
    toLegacy() {
        return {
            pid: 0,
            speciesId: this.speciesId,
            dexId: this.dexId,
            speciesName: this.speciesName,
            nickname: this.nickname,
            isNicknamed: this.isNicknamed,
            form: this.form,

            originalTrainerName: this.otName,
            originalTrainerId: this.otId,
            secretId: this.secretId,
            originalTrainerGender: this.otGender,

            level: this.level,
            exp: this.experience,
            friendship: this.genExtension?.friendship ?? 0,

            hp: this.stats.hp,
            maxHp: this.stats.maxHp,
            attack: this.stats.attack,
            defense: this.stats.defense,
            speed: this.stats.speed,
            special: this.stats.special,
            spAtk: this.stats.spAttack,
            spDef: this.stats.spDefense,

            type1: this.types[0],
            // For solo-type Pokemon (types[1] === 0), binary format requires type2 = type1
            type2: this.types[1] || this.types[0],
            type1Name: this.typeNames[0],
            // For solo-type Pokemon (typeNames[1] === ''), binary format requires type2Name = type1Name
            type2Name: this.typeNames[1] || this.typeNames[0],

            status: this.status,
            catchRate: this.genExtension?.catchRate ?? 0,

            moves: this.moves.map(m => m.id === 0 ? '-' : undefined),  // move names resolved later
            moveIds: this.moves.map(m => m.id),
            movePp: this.moves.map(m => m.pp),
            movePpUps: this.moves.map(m => m.ppUps),

            isParty: this.isParty,
            isEgg: this.isEgg,
            isShiny: this.genExtension?.isShiny ?? false,
            gender: this.genExtension?.gender ?? 'Genderless',
            pokerus: this.genExtension?.pokerus ?? 0,

            iv: this.ivs,
            ev: this.evs,

            raw: this.raw,
            startOffset: this.startOffset,
            nicknameRaw: this.nicknameRaw,
            otNameRaw: this.otNameRaw
        };
    }
}


/**
 * CanonicalSaveFile — Universal Save File data structure
 *
 * Every generation adapter must translate its binary save to/from this model.
 * Fields that don't exist in a generation are left at their default values.
 */
export class CanonicalSaveFile {
    /**
     * @param {Object} [data={}] - Initial data to populate
     */
    constructor(data = {}) {
        /** @type {number} Data model format version */
        this.formatVersion = 1;
        /** @type {number} Generation ID (1, 2, 3, etc.) */
        this.generationId = data.generationId ?? data.generation ?? 1;
        /** @type {string} Game version string ('Red', 'Blue', 'Yellow', etc.) */
        this.gameVersion = data.gameVersion ?? '';
        /** @type {string} Original filename */
        this.originalFilename = data.originalFilename ?? '';
        /** @type {number} File size in bytes */
        this.fileSize = data.fileSize ?? 0;
        /** @type {boolean} Whether the checksum was valid */
        this.isValid = data.isValid ?? false;

        // ---- Trainer Info ----
        /** @type {Object} Trainer information */
        this.trainer = data.trainer ?? {
            name: '', id: '', money: 0, coins: 0,
            playTime: '', badges: 0, rivalName: '',
            pikachuFriendship: 0, gender: 'Male'
        };

        // ---- Party & Boxes ----
        /** @type {CanonicalPokemon[]} Party Pokemon (max 6) */
        this.party = data.party ?? [];
        /** @type {number} Party count */
        this.partyCount = data.partyCount ?? 0;
        /** @type {CanonicalPokemon[][]} PC Boxes */
        this.pcBoxes = data.pcBoxes ?? [];
        /** @type {number} Currently active PC box ID */
        this.currentBoxId = data.currentBoxId ?? 0;

        // ---- Items ----
        /** @type {Array<{id: number, name: string, count: number}>} Bag items */
        this.items = data.items ?? [];
        /** @type {Array<{id: number, name: string, count: number}>} PC items */
        this.pcItems = data.pcItems ?? [];

        // ---- Pokedex ----
        /** @type {number} Number of owned Pokemon */
        this.pokedexOwned = data.pokedexOwned ?? 0;
        /** @type {number} Number of seen Pokemon */
        this.pokedexSeen = data.pokedexSeen ?? 0;
        /** @type {boolean[]} Pokedex owned flags */
        this.pokedexOwnedFlags = data.pokedexOwnedFlags ?? [];
        /** @type {boolean[]} Pokedex seen flags */
        this.pokedexSeenFlags = data.pokedexSeenFlags ?? [];

        // ---- Event Flags ----
        /** @type {boolean[]} Event flags */
        this.eventFlags = data.eventFlags ?? [];

        // ---- Hall of Fame ----
        /** @type {Object[]} Hall of Fame teams */
        this.hallOfFame = data.hallOfFame ?? [];

        // ---- Daycare ----
        /** @type {CanonicalPokemon[]} Daycare Pokemon */
        this.daycare = data.daycare ?? [];

        // ---- Options ----
        /** @type {Object} Game options */
        this.options = data.options ?? {};

        // ---- Map Data ----
        /** @type {Object} Map/position data */
        this.map = data.map ?? {};

        // ---- Starters ----
        /** @type {number} Player starter Pokemon Dex ID */
        this.playerStarterId = data.playerStarterId ?? 0;
        /** @type {number} Rival starter Pokemon Dex ID */
        this.rivalStarterId = data.rivalStarterId ?? 0;

        // ---- Raw Data ----
        /** @type {Uint8Array} Raw binary save data (for lossless round-trip) */
        this.rawData = data.rawData ?? null;

        // ---- Generation-Specific Extension ----
        // Gen 1: (nothing extra beyond what's above)
        // Gen 2: timeOfDay, RTC, breeding, phone numbers, etc.
        // Gen 3+: contest data, secret base, battle frontier, etc.
        /** @type {Object} Generation-specific save fields */
        this.genExtension = data.genExtension ?? {};
    }

    /**
     * Create a CanonicalSaveFile from a legacy ParsedSave object.
     * Bridge for backward compatibility during Phase 1.
     * @param {Object} legacySave - The old format ParsedSave object
     * @returns {CanonicalSaveFile}
     */
    static fromLegacy(legacySave) {
        if (!legacySave) return new CanonicalSaveFile();

        return new CanonicalSaveFile({
            formatVersion: 1,
            generationId: legacySave.generation ?? 1,
            gameVersion: legacySave.gameVersion ?? '',
            originalFilename: legacySave.originalFilename ?? '',
            fileSize: legacySave.fileSize ?? 0,
            isValid: legacySave.isValid ?? false,

            trainer: legacySave.trainer ?? {
                name: '', id: '', money: 0, coins: 0,
                playTime: '', badges: 0, rivalName: '',
                pikachuFriendship: 0, gender: 'Male'
            },

            party: legacySave.party ?? [],
            partyCount: legacySave.partyCount ?? 0,
            pcBoxes: legacySave.pcBoxes ?? [],
            currentBoxId: legacySave.currentBoxId ?? 0,

            items: legacySave.items ?? [],
            pcItems: legacySave.pcItems ?? [],

            pokedexOwned: legacySave.pokedexOwned ?? 0,
            pokedexSeen: legacySave.pokedexSeen ?? 0,
            pokedexOwnedFlags: legacySave.pokedexOwnedFlags ?? [],
            pokedexSeenFlags: legacySave.pokedexSeenFlags ?? [],

            eventFlags: legacySave.eventFlags ?? [],
            hallOfFame: legacySave.hallOfFame ?? [],
            daycare: legacySave.daycare ?? [],
            options: legacySave.options ?? {},
            map: legacySave.map ?? {},
            playerStarterId: legacySave.playerStarterId ?? 0,
            rivalStarterId: legacySave.rivalStarterId ?? 0,

            rawData: legacySave.rawData ?? null,
            genExtension: {}
        });
    }

    /**
     * Convert this CanonicalSaveFile back to the legacy ParsedSave format.
     * Bridge for backward compatibility during Phase 1.
     * @returns {Object} Legacy ParsedSave object
     */
    toLegacy() {
        return {
            generation: this.generationId,
            gameVersion: this.gameVersion,
            originalFilename: this.originalFilename,
            fileSize: this.fileSize,
            isValid: this.isValid,

            trainer: this.trainer,
            options: this.options,
            map: this.map,
            daycare: this.daycare,
            playerStarterId: this.playerStarterId,
            rivalStarterId: this.rivalStarterId,

            pokedexOwned: this.pokedexOwned,
            pokedexSeen: this.pokedexSeen,
            pokedexOwnedFlags: this.pokedexOwnedFlags,
            pokedexSeenFlags: this.pokedexSeenFlags,
            eventFlags: this.eventFlags,

            partyCount: this.partyCount,
            party: this.party,

            currentBoxId: this.currentBoxId,
            currentBoxCount: this.pcBoxes[this.currentBoxId]?.length ?? 0,
            currentBoxPokemon: this.pcBoxes[this.currentBoxId] ?? [],
            pcBoxes: this.pcBoxes,

            hallOfFame: this.hallOfFame,
            items: this.items,
            pcItems: this.pcItems,
            rawData: this.rawData
        };
    }
}
