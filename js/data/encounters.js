
export const GEN1_ENCOUNTERS = [
    // --- STARTERS ---
    { speciesId: 1, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Red' },
    { speciesId: 1, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Blue' },
    { speciesId: 4, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Red' },
    { speciesId: 4, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Blue' },
    { speciesId: 7, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Red' },
    { speciesId: 7, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Blue' },

    // Yellow Starters (Gifted later)
    { speciesId: 25, level: 5, category: 'Gift', location: 'Pallet Town (Starter)', version: 'Yellow' },
    { speciesId: 1, level: 10, category: 'Gift', location: 'Cerulean City', version: 'Yellow' },
    { speciesId: 4, level: 10, category: 'Gift', location: 'Route 24', version: 'Yellow' },
    { speciesId: 7, level: 10, category: 'Gift', location: 'Vermilion City', version: 'Yellow' },

    // --- LEGENDARIES ---
    { speciesId: 144, level: 50, category: 'Static', location: 'Seafoam Islands', version: 'All' }, // Articuno
    { speciesId: 145, level: 50, category: 'Static', location: 'Power Plant', version: 'All' }, // Zapdos
    { speciesId: 146, level: 50, category: 'Static', location: 'Victory Road', version: 'All' }, // Moltres
    { speciesId: 150, level: 70, category: 'Static', location: 'Cerulean Cave', version: 'All' }, // Mewtwo

    // --- STATIC INTERACTIONS ---
    { speciesId: 143, level: 30, category: 'Static', location: 'Route 12 (Blockage)', version: 'All' }, // Snorlax
    { speciesId: 143, level: 30, category: 'Static', location: 'Route 16 (Blockage)', version: 'All' }, // Snorlax
    { speciesId: 100, level: 40, category: 'Static', location: 'Power Plant (Trap)', version: 'All' }, // Voltorb
    { speciesId: 101, level: 43, category: 'Static', location: 'Power Plant (Trap)', version: 'All' }, // Electrode

    // --- GIFTS ---
    { speciesId: 133, level: 25, category: 'Gift', location: 'Celadon Mansion', version: 'All' }, // Eevee
    { speciesId: 131, level: 15, category: 'Gift', location: 'Silph Co.', version: 'All' }, // Lapras
    { speciesId: 138, level: 30, category: 'Gift', location: 'Cinnabar Lab (Helix Fossil)', version: 'All' }, // Omanyte
    { speciesId: 140, level: 30, category: 'Gift', location: 'Cinnabar Lab (Dome Fossil)', version: 'All' }, // Kabuto
    { speciesId: 142, level: 30, category: 'Gift', location: 'Cinnabar Lab (Old Amber)', version: 'All' }, // Aerodactyl
    { speciesId: 106, level: 30, category: 'Gift', location: 'Fighting Dojo', version: 'All' }, // Hitmonlee
    { speciesId: 107, level: 30, category: 'Gift', location: 'Fighting Dojo', version: 'All' }, // Hitmonchan
    { speciesId: 129, level: 5, category: 'Gift', location: 'Route 4 (Salesman)', version: 'All' }, // Magikarp

    // --- GAME CORNER ---
    // Red
    { speciesId: 63, level: 9, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Abra
    { speciesId: 35, level: 8, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Clefairy
    { speciesId: 30, level: 17, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Nidorina
    { speciesId: 147, level: 18, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Dratini
    { speciesId: 123, level: 25, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Scyther
    { speciesId: 137, level: 26, category: 'Gift', location: 'Game Corner', version: 'Red' }, // Porygon

    // Blue
    { speciesId: 63, level: 6, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Abra
    { speciesId: 35, level: 12, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Clefairy
    { speciesId: 33, level: 17, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Nidorino
    { speciesId: 127, level: 20, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Pinsir
    { speciesId: 147, level: 24, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Dratini
    { speciesId: 137, level: 18, category: 'Gift', location: 'Game Corner', version: 'Blue' }, // Porygon

    // Yellow
    { speciesId: 63, level: 15, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Abra
    { speciesId: 37, level: 18, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Vulpix
    { speciesId: 40, level: 22, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Wigglytuff
    { speciesId: 123, level: 30, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Scyther
    { speciesId: 127, level: 30, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Pinsir
    { speciesId: 137, level: 26, category: 'Gift', location: 'Game Corner', version: 'Yellow' }, // Porygon

    // --- IN-GAME TRADES (Red/Blue) ---
    // Fixed TIDs are estimations based on English releases to avoid "Altered" error in PKHeX.
    // Real TIDs for trades vary, but using a non-random static ID helps consistency.
    { speciesId: 122, level: 6, name: 'MARCEL', category: 'Trade', ot: 'TRAINER', tid: 4305, location: 'Route 2', version: 'Red', fixedDVs: true, ivs: {atk: 9, def: 8, spd: 1, spc: 12} },
    { speciesId: 122, level: 6, name: 'MARCEL', category: 'Trade', ot: 'TRAINER', tid: 4305, location: 'Route 2', version: 'Blue', fixedDVs: true, ivs: {atk: 9, def: 8, spd: 1, spc: 12} },

    { speciesId: 29, level: 2, name: 'SPOT', category: 'Trade', ot: 'TRAINER', tid: 1561, location: 'Route 5', version: 'Red' }, // NidoranF for NidoranM
    { speciesId: 29, level: 2, name: 'SPOT', category: 'Trade', ot: 'TRAINER', tid: 1561, location: 'Route 5', version: 'Blue' },

    { speciesId: 30, level: 16, name: 'TERRY', category: 'Trade', ot: 'TRAINER', tid: 6193, location: 'Route 11', version: 'Red' }, // Nidorina for Nidorino
    { speciesId: 30, level: 16, name: 'TERRY', category: 'Trade', ot: 'TRAINER', tid: 6193, location: 'Route 11', version: 'Blue' },

    { speciesId: 108, level: 15, name: 'MARC', category: 'Trade', ot: 'TRAINER', tid: 1004, location: 'Route 18', version: 'Red' }, // Lickitung
    { speciesId: 108, level: 15, name: 'MARC', category: 'Trade', ot: 'TRAINER', tid: 1004, location: 'Route 18', version: 'Blue' },

    { speciesId: 124, level: 15, name: 'LOLA', category: 'Trade', ot: 'TRAINER', tid: 1515, location: 'Cerulean City', version: 'Red' }, // Jynx
    { speciesId: 124, level: 15, name: 'LOLA', category: 'Trade', ot: 'TRAINER', tid: 1515, location: 'Cerulean City', version: 'Blue' },

    { speciesId: 83, level: 2, name: 'DUX', category: 'Trade', ot: 'TRAINER', tid: 1985, location: 'Vermilion City', version: 'Red' }, // Farfetch'd
    { speciesId: 83, level: 2, name: 'DUX', category: 'Trade', ot: 'TRAINER', tid: 1985, location: 'Vermilion City', version: 'Blue' },

    { speciesId: 101, level: 3, name: 'DORIS', category: 'Trade', ot: 'TRAINER', tid: 5002, location: 'Cinnabar Island', version: 'Red' }, // Electrode
    { speciesId: 101, level: 3, name: 'DORIS', category: 'Trade', ot: 'TRAINER', tid: 5002, location: 'Cinnabar Island', version: 'Blue' },

    { speciesId: 114, level: 13, name: 'CRINKLES', category: 'Trade', ot: 'TRAINER', tid: 2259, location: 'Cinnabar Island', version: 'Red' }, // Tangela
    { speciesId: 114, level: 13, name: 'CRINKLES', category: 'Trade', ot: 'TRAINER', tid: 2259, location: 'Cinnabar Island', version: 'Blue' },

    { speciesId: 86, level: 28, name: 'SAILOR', category: 'Trade', ot: 'TRAINER', tid: 5503, location: 'Cinnabar Island', version: 'Red' }, // Seel
    { speciesId: 86, level: 28, name: 'SAILOR', category: 'Trade', ot: 'TRAINER', tid: 5503, location: 'Cinnabar Island', version: 'Blue' },

    // --- IN-GAME TRADES (Yellow) ---
    { speciesId: 67, level: 16, name: 'RICKY', category: 'Trade', ot: 'TRAINER', tid: 5882, location: 'Route 5', version: 'Yellow' }, // Machoke
    { speciesId: 51, level: 15, name: 'GURIO', category: 'Trade', ot: 'TRAINER', tid: 5581, location: 'Route 11', version: 'Yellow' }, // Dugtrio
    { speciesId: 47, level: 13, name: 'SPIKE', category: 'Trade', ot: 'TRAINER', tid: 1004, location: 'Route 18', version: 'Yellow' }, // Parasect
    { speciesId: 87, level: 15, name: 'CEZANNE', category: 'Trade', ot: 'TRAINER', tid: 4305, location: 'Route 2', version: 'Yellow' }, // Dewgong
    { speciesId: 122, level: 8, name: 'MILES', category: 'Trade', ot: 'TRAINER', tid: 1985, location: 'Route 2', version: 'Yellow' }, // Mr. Mime
    { speciesId: 112, level: 15, name: 'BUFFY', category: 'Trade', ot: 'TRAINER', tid: 1561, location: 'Cinnabar Island', version: 'Yellow' }, // Rhydon
    { speciesId: 89, level: 25, name: 'STICKY', category: 'Trade', ot: 'TRAINER', tid: 6193, location: 'Cinnabar Island', version: 'Yellow' }, // Muk
];
