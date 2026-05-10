# BilKo's PC — Generation 1 Save Editor

A fully client-side, browser-based save file editor for Pokémon Red, Blue, and Yellow (Generation 1). No server required — everything runs locally in your browser.

## Quick Start

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. Drag and drop a `.sav` or `.srm` file onto the drop zone, or click to browse.
3. Edit your save data using the various tabs.
4. Export your modified save file.

That's it — no installation, no server, no build step.

## Project Structure

```
bilkos-pc-gen1-save-editor/
├── index.html                  # Main HTML entry point
├── css/
│   └── styles.css              # All custom CSS styles
├── js/
│   ├── app.js                  # Application entry point & initialization
│   ├── state/
│   │   ├── eventBus.js         # Pub/sub event system for module communication
│   │   ├── appState.js         # Centralized state management (tabs, modals, move mode)
│   │   └── theme.js            # Theme manager (dark mode, game colors)
│   ├── data/
│   │   ├── games.js            # Game cartridge definitions (Red/Blue/Yellow)
│   │   ├── pokemonNames.js     # Pokémon species names (1-151)
│   │   ├── moves.js            # Move data (names, PP, types)
│   │   ├── items.js            # Item name lookups
│   │   ├── baseStats.js        # Base stats & catch rates
│   │   ├── offsets.js          # Gen 1 memory offsets
│   │   ├── pokemonTypes.js     # Type mappings & Pokémon types
│   │   ├── experience.js       # Growth rates & EXP formulas
│   │   ├── events.js           # Event flag definitions
│   │   ├── encounters.js       # Encounter templates
│   │   ├── gen1EncountersFull.js # Move learnsets
│   │   ├── eventDistributions.js # Event Pokémon data
│   │   ├── pokedexEntries.js   # Pokédex flavor text
│   │   ├── pokemonLocations.js # Pokémon location data
│   │   └── gameData.js         # Type colors, badges, version exclusives
│   ├── engine/
│   │   ├── parser.js           # Binary save file parser
│   │   ├── writer.js           # Binary save file writer
│   │   ├── byteHelpers.js      # BCD, big-endian reads, bit operations
│   │   ├── textDecoder.js      # Gen 1 text encoding/decoding
│   │   ├── statCalculator.js   # Gen 1 stat formula calculations
│   │   ├── io.js               # BinaryWriter class
│   │   ├── manipulation.js     # Pokémon moving/transfer logic
│   │   ├── sortManager.js      # PC box sorting
│   │   └── encounterGenerator.js # Generate Pokémon from encounters
│   └── ui/
│       ├── layout/
│       │   ├── header.js       # Header with dark mode toggle & sidebar
│       │   └── footer.js       # Footer component
│       ├── home/
│       │   └── homePage.js     # Home page (Hero, DropZone, Features)
│       ├── editor/
│       │   └── editorDashboard.js # Tab-based editor dashboard
│       ├── modals/
│       │   ├── loadSaveModal.js    # File loading modal
│       │   ├── exportModal.js      # Export format selection modal
│       │   ├── gameVersionSelector.js # Red/Blue disambiguation
│       │   ├── closeConfirmModal.js  # Unsaved changes confirmation
│       │   ├── closeAllModal.js      # Close all tabs confirmation
│       │   ├── errorModal.js         # Error display modal
│       │   └── toast.js              # Toast notifications
│       └── components/
│           ├── autocomplete.js    # Search/select component
│           ├── moveModeFAB.js     # Move mode floating action button
│           ├── pokemonBadges.js   # Type & status badges
│           └── pokemonDetailView.js # Pokémon detail overlay
└── README.md                   # This file
```

## Architecture

This project is a **complete port** of the original TypeScript + React + Vite application to pure vanilla HTML, CSS, and JavaScript. Key architectural decisions:

- **No build step**: Opens directly in a browser
- **ES6 Modules**: All JavaScript uses `import`/`export` for clean module organization
- **Event-driven**: An `EventBus` replaces React's state-driven re-rendering pattern
- **Centralized state**: `AppState` holds all application state (same as the original's `useState` in App.tsx)
- **Tailwind CSS via CDN**: Same styling approach as the original
- **Lucide Icons via CDN**: Replaces `lucide-react` with the UMD bundle
- **Browser APIs**: `File` API for reading saves, `Blob` + `URL.createObjectURL` for exporting, `localStorage` for theme persistence

## Supported Features

- Load `.sav` and `.srm` files for Pokémon Red, Blue, and Yellow
- Edit party Pokémon (species, moves, stats, DVs, EVs, nickname, OT)
- Manage PC Storage (12 boxes, 20 slots each)
- Pokédex tracking (owned/seen flags)
- Inventory management (bag + PC items)
- Event flags editor
- Battle type chart guide
- Hall of Fame viewer
- Encounter database
- Multi-save tab support
- Cross-save Pokémon transfer (Move Mode)
- Dark mode / game-specific color theming
- Export modified save files

## Browser Compatibility

Requires a modern browser supporting:
- ES6 Modules
- File API & Drag-and-Drop
- `crypto.randomUUID()`
- Tailwind CSS CDN
- Lucide Icons CDN

## Credits

Original project: [BilKo's PC on GitHub](https://github.com/BilKoChal/BilKos-PC)
