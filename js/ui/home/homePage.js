/**
 * homePage.js — Home Page Component
 *
 * Vanilla JS port of the combined Hero.tsx + DropZone.tsx + Features.tsx
 * React components for BilKo's PC Gen 1 Save Editor.
 *
 * Sections:
 *   1. Hero — Animated mascot, gradient title, guardian sprites
 *   2. DropZone — Retro CRT monitor with drag/drop file input
 *   3. Features — 3-card grid highlighting editor capabilities
 *
 * Uses:
 *   - EventBus pattern for decoupled communication
 *   - Tailwind CSS classes (CDN)
 *   - Lucide icons via data-lucide attributes
 */

import { Events } from '../../state/eventBus.js';

// ---- Cleanup (event listener memory leak prevention) ----
let _unsubs = [];

export function destroyHomePage() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
}

// ---------------------------------------------------------------------------
// Scoped CSS injected once into the document <head>
// ---------------------------------------------------------------------------

const SCOPED_STYLE_ID = 'homePage-scoped-styles';

function injectScopedStyles() {
    if (document.getElementById(SCOPED_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = SCOPED_STYLE_ID;
    style.textContent = `
        /* ---- Hero background blobs ---- */
        .hero-blob-red {
            position: absolute;
            width: 28rem;
            height: 28rem;
            border-radius: 9999px;
            background: rgba(239, 68, 68, 0.18);
            filter: blur(100px);
            top: -6rem;
            left: -8rem;
            pointer-events: none;
        }
        .dark .hero-blob-red {
            background: rgba(239, 68, 68, 0.1);
        }
        .hero-blob-blue {
            position: absolute;
            width: 28rem;
            height: 28rem;
            border-radius: 9999px;
            background: rgba(59, 130, 246, 0.18);
            filter: blur(100px);
            top: 4rem;
            right: -8rem;
            pointer-events: none;
        }
        .dark .hero-blob-blue {
            background: rgba(59, 130, 246, 0.1);
        }
        .hero-blob-yellow {
            position: absolute;
            width: 24rem;
            height: 24rem;
            border-radius: 9999px;
            background: rgba(234, 179, 8, 0.16);
            filter: blur(90px);
            bottom: -4rem;
            left: 30%;
            pointer-events: none;
        }
        .dark .hero-blob-yellow {
            background: rgba(234, 179, 8, 0.08);
        }

        /* ---- CRT Scanline overlay ---- */
        .crt-screen {
            position: relative;
            overflow: hidden;
        }
        .crt-screen::before {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.12) 2px,
                rgba(0,0,0,0.12) 4px
            );
            pointer-events: none;
            z-index: 2;
        }
        /* CRT Glare overlay */
        .crt-screen::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
                135deg,
                rgba(255,255,255,0.12) 0%,
                transparent 40%,
                transparent 60%,
                rgba(255,255,255,0.04) 100%
            );
            pointer-events: none;
            z-index: 3;
        }

        /* ---- Guardian pulse ---- */
        .guardian-pulse {
            animation: guardianPulse 3s ease-in-out infinite;
        }
        @keyframes guardianPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.04); }
        }

        /* ---- Feature card corner blob ---- */
        .feature-blob {
            position: absolute;
            width: 5rem;
            height: 5rem;
            border-radius: 9999px;
            filter: blur(40px);
            opacity: 0.4;
            pointer-events: none;
        }
        .dark .feature-blob {
            opacity: 0.2;
        }
    `;
    document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// HTML generators
// ---------------------------------------------------------------------------

/**
 * Generate the Hero section HTML.
 * @returns {string}
 */
function renderHero() {
    return `
        <section class="relative w-full overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12">
            <!-- Background ambience blobs -->
            <div class="hero-blob-red" aria-hidden="true"></div>
            <div class="hero-blob-blue" aria-hidden="true"></div>
            <div class="hero-blob-yellow" aria-hidden="true"></div>

            <div class="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-4">

                <!-- Pikachu mascot -->
                <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                    alt="Pikachu mascot"
                    class="animate-bounce w-28 h-28 sm:w-36 sm:h-36 drop-shadow-lg select-none pointer-events-none mb-2 sm:mb-4"
                    draggable="false"
                />

                <!-- Title -->
                <h1 class="text-5xl sm:text-7xl font-black uppercase tracking-wider text-center leading-tight">
                    <span class="text-gray-900 dark:text-white">BilKo's&nbsp;</span><span class="bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 bg-clip-text text-transparent">PC</span>
                </h1>

                <!-- Subtitle -->
                <p class="mt-3 sm:mt-4 text-lg sm:text-xl text-gray-500 dark:text-gray-400 text-center max-w-xl">
                    The ultimate Gen 1 Save Editor.
                </p>

                <!-- File format badges -->
                <div class="mt-3 flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-0.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">.sav</span>
                    <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-0.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">.srm</span>
                </div>

                <!-- Guardians: Charizard (left) + Blastoise (right) -->
                <div class="mt-8 sm:mt-12 w-full flex items-start justify-between px-2 sm:px-8 max-w-3xl">
                    <!-- Charizard -->
                    <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png"
                        alt="Charizard"
                        class="guardian-pulse w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md select-none pointer-events-none rotate-6"
                        draggable="false"
                    />

                    <!-- Blastoise -->
                    <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png"
                        alt="Blastoise"
                        class="guardian-pulse w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md select-none pointer-events-none -rotate-6"
                        draggable="false"
                    />
                </div>
            </div>
        </section>
    `;
}

/**
 * Generate the DropZone (Retro CRT Monitor) section HTML.
 * @returns {string}
 */
function renderDropZone() {
    return `
        <section class="w-full max-w-lg mx-auto px-4 mt-4 sm:mt-8 mb-8 sm:mb-12" aria-label="File drop zone">
            <div
                id="crt-monitor"
                class="relative cursor-pointer transition-all duration-200 ease-in-out select-none"
                role="button"
                tabindex="0"
                aria-label="Drop your save files here or click to browse"
            >
                <!-- Monitor Housing -->
                <div class="bg-stone-200 dark:bg-stone-700 rounded-3xl border-[6px] border-stone-300 dark:border-stone-600 shadow-[0_12px_40px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_2px_rgba(0,0,0,0.3)] p-4 sm:p-6">

                    <!-- Screen Bezel -->
                    <div class="bg-stone-800 dark:bg-stone-900 rounded-xl p-3 sm:p-4 relative">

                        <!-- Screen -->
                        <div
                            id="crt-screen"
                            class="crt-screen bg-[#98D8D8] dark:bg-[#1a2e3a] rounded-lg p-6 sm:p-8 text-center transition-colors duration-200"
                        >
                            <div class="relative z-10 flex flex-col items-center gap-2">
                                <!-- Monitor icon hint -->
                                <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/40 dark:bg-white/10 flex items-center justify-center mb-1">
                                    <i data-lucide="monitor" class="w-6 h-6 sm:w-7 sm:h-7 text-stone-700 dark:text-stone-300"></i>
                                </div>
                                <p class="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-200">
                                    Drop your .sav or .srm file here
                                </p>
                                <p class="text-sm text-stone-600 dark:text-stone-400">
                                    or click to browse
                                </p>
                            </div>
                        </div>

                        <!-- Power LED -->
                        <div class="absolute bottom-2 right-4 sm:bottom-3 sm:right-5 flex items-center gap-1.5">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 select-none">Power</span>
                            <div
                                id="power-led"
                                class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500"
                                style="box-shadow: 0 0 6px #ef4444, 0 0 14px rgba(239,68,68,0.5);"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- Monitor Stand -->
                <div class="mx-auto w-[40%] h-4 bg-gradient-to-b from-stone-300 to-stone-400 dark:from-stone-600 dark:to-stone-700 rounded-b-sm"></div>

                <!-- Monitor Base -->
                <div class="mx-auto w-[60%] h-2 bg-gradient-to-b from-stone-400 to-stone-500 dark:from-stone-700 dark:to-stone-800 rounded-b-lg shadow-md"></div>
            </div>

            <!-- Hidden file input -->
            <input
                type="file"
                id="home-file-input"
                accept=".sav,.srm"
                multiple
                class="hidden"
                aria-hidden="true"
            />
        </section>
    `;
}

/**
 * Generate the Features section HTML.
 * @returns {string}
 */
function renderFeatures() {
    const features = [
        {
            color: 'blue',
            icon: 'users',
            title: 'Team Editor',
            description: 'Edit your party Pokémon — moves, stats, level, IVs, EVs, and more. Full control over every detail.',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconText: 'text-blue-600 dark:text-blue-400',
            blobColor: 'bg-blue-400',
            hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
        },
        {
            color: 'red',
            icon: 'book-open',
            title: 'Pokédex Manager',
            description: 'Track and modify your Pokédex completion. Mark Pokémon as seen or owned with one click.',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconText: 'text-red-600 dark:text-red-400',
            blobColor: 'bg-red-400',
            hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
        },
        {
            color: 'yellow',
            icon: 'briefcase',
            title: 'Inventory Tools',
            description: 'Manage your bag and PC items with ease. Add, remove, or reorder any item in your inventory.',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconText: 'text-yellow-600 dark:text-yellow-400',
            blobColor: 'bg-yellow-400',
            hoverBorder: 'hover:border-yellow-300 dark:hover:border-yellow-700',
        },
    ];

    const cardsHtml = features.map((f) => `
        <div
            class="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${f.hoverBorder} group"
        >
            <!-- Decorative corner blob -->
            <div class="feature-blob ${f.blobColor} -top-4 -right-4" aria-hidden="true"></div>

            <!-- Icon container -->
            <div class="w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110">
                <i data-lucide="${f.icon}" class="w-6 h-6 ${f.iconText}"></i>
            </div>

            <!-- Title -->
            <h3 class="font-bold text-gray-900 dark:text-white text-lg mb-2">${f.title}</h3>

            <!-- Description -->
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${f.description}</p>
        </div>
    `).join('');

    return `
        <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16 sm:pb-24" aria-label="Features">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${cardsHtml}
            </div>
        </section>
    `;
}

// ---------------------------------------------------------------------------
// Main init function
// ---------------------------------------------------------------------------

/**
 * Initialize the home page.
 *
 * @param {HTMLElement} container - The DOM element to render into
 * @param {import('../../state/eventBus.js').EventBus} eventBus - Central event bus
 * @param {import('../../state/theme.js').ThemeManager} theme - Theme manager instance
 * @param {import('../../state/appState.js').AppState} appState - Application state manager
 */
export function initHomePage(container, eventBus, theme, appState) {
    // Inject scoped CSS once
    injectScopedStyles();

    // Render full page
    container.innerHTML = `
        <div class="flex-grow w-full flex flex-col items-center justify-start">
            ${renderHero()}
            ${renderDropZone()}
            ${renderFeatures()}
        </div>
    `;

    // Initialize Lucide icons
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }

    // ---- Drop Zone Interactivity ----
    const monitor = document.getElementById('crt-monitor');
    const screen = document.getElementById('crt-screen');
    const fileInput = document.getElementById('home-file-input');

    if (monitor && screen && fileInput) {
        // Click to browse
        monitor.addEventListener('click', () => {
            fileInput.value = '';  // Reset so same file can be re-selected
            fileInput.click();
        });

        // Keyboard support (Enter / Space)
        monitor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.value = '';
                fileInput.click();
            }
        });

        // File input change handler
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                appState.handleFilesSelected(files);
            }
        });

        // Drag & drop — use counter approach to handle child element dragleave
        let dragCounter = 0;

        monitor.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            monitor.classList.add('ring-4', 'ring-blue-400');
            screen.classList.add('!bg-blue-900/80');
        });

        monitor.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        monitor.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                monitor.classList.remove('ring-4', 'ring-blue-400');
                screen.classList.remove('!bg-blue-900/80');
            }
        });

        monitor.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter = 0;
            monitor.classList.remove('ring-4', 'ring-blue-400');
            screen.classList.remove('!bg-blue-900/80');

            const files = Array.from(e.dataTransfer.files || []);
            if (files.length > 0) {
                appState.handleFilesSelected(files);
            }
        });
    }

    // ---- Theme reactivity ----
    // Re-render Lucide icons when theme changes (they may need color refresh)
    _unsubs.push(eventBus.on(Events.THEME_MODE_CHANGED, () => {
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
    }));

    // ---- Cleanup ----
    // Store cleanup function on the container for external callers (legacy support)
    container._homePageCleanup = () => {
        destroyHomePage();
    };
}
