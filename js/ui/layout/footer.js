/**
 * footer.js — Application Footer Component
 *
 * Faithfully ported from components/layout/Footer.tsx
 * Displays copyright, credits, and GitHub link.
 */

/**
 * Initialize the footer component.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/theme.js').ThemeManager} theme
 */
export function initFooter(container, eventBus, theme) {
    container.innerHTML = `
        <footer class="w-full mt-auto relative z-10 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <!-- Info Bar Section -->
            <div class="w-full bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div class="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">

                        <!-- Left: Copyright -->
                        <div class="text-gray-500 dark:text-gray-400 font-medium tracking-wide order-2 md:order-1">
                            BilKo's PC &copy; 2026
                        </div>

                        <!-- Center: Credits -->
                        <div class="text-gray-600 dark:text-gray-300 text-center order-3 md:order-2">
                            Created by <span class="font-bold text-gray-900 dark:text-white">BilKo(Ch)al</span> with the help of AI
                        </div>

                        <!-- Right: Github Link -->
                        <div class="order-1 md:order-3">
                            <a href="https://bilkochal.github.io/BilKos-PC/"
                               target="_blank"
                               rel="noopener noreferrer"
                               class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all duration-200 group bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600">
                                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                                <span class="font-semibold">BilKo(Ch)al</span>
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </footer>
    `;

    if (window.lucide) window.lucide.createIcons();
}
