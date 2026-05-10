/**
 * header.js — Application Header Component
 *
 * Faithfully ported from components/layout/Header.tsx
 * Includes logo, dark mode toggle, hamburger menu with sidebar drawer,
 * and game-specific dynamic theming (header color changes per game version).
 *
 * The header adapts its background color based on the active game:
 * - Red: bg-red-600 / dark:bg-red-900
 * - Blue: bg-blue-600 / dark:bg-blue-900
 * - Yellow: bg-yellow-400 (with dark text)
 * - No game: default bg-red-600
 *
 * Phase 5 enhancements:
 * - Active dashboard tab highlighted in sidebar navigation
 * - Sidebar also listens for DASHBOARD_TAB_CHANGED to update active nav
 */

import { Events } from '../../state/eventBus.js';

// ---- Cleanup (event listener memory leak prevention) ----
let _unsubs = [];

export function destroyHeader() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
}

/**
 * Initialize the header component.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/theme.js').ThemeManager} theme
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initHeader(container, eventBus, theme, appState) {
    _render(container, eventBus, theme, appState);

    // Re-render when game theme changes (tab switch)
    _unsubs.push(eventBus.on(Events.GAME_THEME_CHANGED, () => {
        _render(container, eventBus, theme, appState);
    }));

    // Re-render when theme mode changes (light/dark)
    _unsubs.push(eventBus.on(Events.THEME_MODE_CHANGED, () => {
        _render(container, eventBus, theme, appState);
    }));

    // Re-render when active tab changes (to update hasActiveSave)
    _unsubs.push(eventBus.on(Events.ACTIVE_TAB_CHANGED, () => {
        _render(container, eventBus, theme, appState);
    }));

    // Update active nav button in sidebar when dashboard tab changes
    _unsubs.push(eventBus.on(Events.DASHBOARD_TAB_CHANGED, () => {
        _updateSidebarActiveNav(appState);
    }));
}

/**
 * Render the header DOM.
 * @private
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/theme.js').ThemeManager} theme
 * @param {import('../../state/appState.js').AppState} appState
 */
function _render(container, eventBus, theme, appState) {
    const gameTheme = theme.getGameTheme();
    const isYellow = gameTheme?.id === 'yellow';
    const hasActiveSave = !!appState.getActiveTabId();

    // Dynamic style classes based on game version
    const headerBgClass = gameTheme
        ? '' // Use inline style when game theme is active
        : 'bg-red-600 dark:bg-red-900 text-white';

    const headerInlineStyle = gameTheme
        ? `background-color: ${gameTheme.color};`
        : '';

    const textColor = isYellow ? 'text-gray-900' : 'text-white';
    const iconColor = isYellow ? 'text-yellow-500' : 'text-red-600';
    const borderColor = isYellow ? 'border-gray-900' : 'border-gray-800';
    const hoverBg = isYellow ? 'hover:bg-black/10' : 'hover:bg-white/10';
    const badgeBg = isYellow ? 'bg-black/10' : 'bg-black/20';

    container.innerHTML = `
        <header class="sticky top-0 z-50 w-full shadow-md transition-colors duration-500 ${headerBgClass} ${textColor}"
                style="${headerInlineStyle}">
            <div class="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <!-- Logo Area -->
                <div class="flex items-center space-x-3 select-none">
                    <div class="bg-white rounded-full p-1 border-4 ${borderColor}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${iconColor}">
                            <circle cx="12" cy="12" r="10" fill="#F0F0F0" stroke="black" stroke-width="2"/>
                            <path d="M2 12H22" stroke="black" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" fill="white" stroke="black" stroke-width="2"/>
                        </svg>
                    </div>
                    <span class="font-bold text-xl tracking-wider uppercase hidden sm:block">BilKo's PC</span>
                    <span class="font-bold text-xl tracking-wider uppercase sm:hidden">PC</span>
                </div>

                <!-- Actions Area -->
                <div class="flex items-center space-x-2 sm:space-x-4">
                    <div class="hidden sm:flex items-center px-3 py-1 rounded text-xs font-mono opacity-80 ${badgeBg}">
                        v1.1.0-alpha
                    </div>

                    <!-- Dark Mode Toggle -->
                    <button id="theme-toggle-btn" class="p-2 rounded-full ${hoverBg} transition-colors" aria-label="Toggle Theme">
                        <i data-lucide="${theme.mode === 'light' ? 'moon' : 'sun'}" class="w-6 h-6"></i>
                    </button>

                    <!-- Menu Button -->
                    <button id="menu-open-btn" class="p-2 rounded-full ${hoverBg} transition-colors" aria-label="Open Menu">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </header>
    `;

    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        theme.toggleMode();
    });

    // Menu button
    document.getElementById('menu-open-btn')?.addEventListener('click', () => {
        _openSidebar(container, eventBus, theme, appState, hasActiveSave, hoverBg);
    });

    // Initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Open the sidebar drawer (hamburger menu).
 * Faithfully ported from Header.tsx sidebar overlay.
 * @private
 */
function _openSidebar(container, eventBus, theme, appState, hasActiveSave, hoverBg) {
    // Don't open multiple sidebars
    if (document.getElementById('sidebar-overlay')) return;

    // Get current dashboard view for active highlighting
    const activeTab = appState.getActiveTab();
    const currentView = activeTab?.currentView || 'home';

    // Navigation items with their icon configs
    const navItems = [
        { id: 'home',       icon: 'home',        color: 'text-orange-500',  label: 'Dashboard' },
        { id: 'storage',    icon: 'layout-grid',  color: 'text-blue-500',    label: 'PC Storage' },
        { id: 'encounters', icon: 'database',      color: 'text-purple-500',  label: 'Encounter DB' },
        { id: 'pokedex',    icon: 'book',          color: 'text-red-500',     label: 'Pokédex' },
        { id: 'battle',     icon: 'swords',        color: 'text-green-500',   label: 'Battle Guide' },
        { id: 'events',     icon: 'map',           color: 'text-purple-500',  label: 'World Events' },
        { id: 'hof',        icon: 'trophy',        color: 'text-yellow-500',  label: 'Hall of Fame' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'fixed inset-0 z-[1000] flex justify-end';
    overlay.innerHTML = `
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" id="sidebar-backdrop"></div>

        <!-- Sidebar Drawer -->
        <div class="sidebar-drawer relative h-full bg-white dark:bg-gray-950 shadow-2xl flex flex-col animate-slide-from-right border-l border-gray-200 dark:border-gray-800">

            <!-- Drawer Header -->
            <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <span class="font-black text-lg text-gray-800 dark:text-white uppercase tracking-wide">Menu</span>
                <button id="sidebar-close-btn" class="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Drawer Content -->
            <div class="flex-1 overflow-y-auto p-4 space-y-6">

                <!-- Navigation Section (Only if Active Save) -->
                ${hasActiveSave ? `
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Navigation</h4>
                        <div class="space-y-1">
                            ${navItems.map(item => {
                                const isActive = currentView === item.id;
                                return `
                                    <button data-nav-tab="${item.id}"
                                        class="sidebar-nav-btn w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-sm text-left
                                            ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200'
                                            }">
                                        <i data-lucide="${item.icon}" class="w-[18px] h-[18px] ${item.color}"></i>
                                        ${item.label}
                                        ${isActive ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>' : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Links Section -->
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Links</h4>
                    <div class="space-y-1">
                        <a href="https://github.com/BilKoChal/BilKos-PC" target="_blank" rel="noreferrer"
                           class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> GitHub Repository
                        </a>
                        <a href="https://github.com/BilKoChal/BilKos-PC/issues" target="_blank" rel="noreferrer"
                           class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                            <i data-lucide="bug" class="w-[18px] h-[18px]"></i> Report a Bug
                        </a>
                        <a href="https://bulbapedia.bulbagarden.net/wiki/Main_Page" target="_blank" rel="noreferrer"
                           class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                            <i data-lucide="book-open" class="w-[18px] h-[18px]"></i> Bulbapedia Wiki
                        </a>
                    </div>
                </div>

                <!-- Keyboard Shortcuts Section (always visible) -->
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Shortcuts</h4>
                    <div class="space-y-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex justify-between items-center">
                            <span>Open File</span>
                            <div class="flex gap-1"><span class="kbd-hint">Ctrl</span><span class="kbd-hint">O</span></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Save / Export</span>
                            <div class="flex gap-1"><span class="kbd-hint">Ctrl</span><span class="kbd-hint">S</span></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Close Overlay</span>
                            <div class="flex gap-1"><span class="kbd-hint">Esc</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Drawer Footer -->
            <div class="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
                        <i data-lucide="monitor" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h5 class="font-bold text-gray-900 dark:text-white text-sm">BilKo's PC</h5>
                        <p class="text-xs text-gray-500">Gen 1 Save Editor</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(overlay);

    // Close handlers
    const closeSidebar = () => overlay.remove();
    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-close-btn')?.addEventListener('click', closeSidebar);

    // Navigation buttons
    overlay.querySelectorAll('[data-nav-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.navTab;
            appState.handleDashboardTabChange(tab);
            closeSidebar();
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Update the active navigation button in an open sidebar.
 * Called when DASHBOARD_TAB_CHANGED fires while sidebar is open.
 * @private
 * @param {import('../../state/appState.js').AppState} appState
 */
function _updateSidebarActiveNav(appState) {
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (!sidebarOverlay) return;

    const activeTab = appState.getActiveTab();
    const currentView = activeTab?.currentView || 'home';

    // Remove active state from all nav buttons
    sidebarOverlay.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
        const tabId = btn.dataset.navTab;
        const isActive = tabId === currentView;
        const dot = btn.querySelector('.rounded-full.bg-blue-500');

        if (isActive) {
            btn.classList.remove('hover:bg-gray-50', 'dark:hover:bg-gray-900', 'text-gray-700', 'dark:text-gray-200');
            btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-700', 'dark:text-blue-300');
            if (!dot) {
                const dotEl = document.createElement('span');
                dotEl.className = 'ml-auto w-1.5 h-1.5 rounded-full bg-blue-500';
                btn.appendChild(dotEl);
            }
        } else {
            btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-700', 'dark:text-blue-300');
            btn.classList.add('hover:bg-gray-50', 'dark:hover:bg-gray-900', 'text-gray-700', 'dark:text-gray-200');
            if (dot) dot.remove();
        }
    });
}
