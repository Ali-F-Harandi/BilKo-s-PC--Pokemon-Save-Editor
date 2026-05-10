/**
 * sortSettingsModal.js — Sort PC Storage Settings Modal
 *
 * Vanilla JS port of SortSettingsModal.tsx for BilKo's PC Gen 1 Save Editor.
 * Provides UI for configuring sort scope, criteria, direction, and
 * Living Dex options before emitting a SORT_REQUESTED event.
 *
 * Sections:
 *   1. Header (title + close button)
 *   2. Sorting Method (4 radio-style scope buttons)
 *   3. Living Dex Options (conditional checkbox)
 *   4. Criteria & Direction (2-column grid, disabled for living-dex)
 *   5. Living Dex Note (yellow info box, conditional)
 *   6. Footer (Cancel + Apply Sort)
 */

import { Events } from '../../state/eventBus.js';

// ─── Local State ───────────────────────────────────────────────

/** @type {'single'|'all-indiv'|'all-global'|'living-dex'} */
let scope = 'single';

/** @type {'id'|'species'|'nickname'|'level'|'type'} */
let criteria = 'id';

/** @type {'asc'|'desc'} */
let direction = 'asc';

/** @type {boolean} */
let includeAllSaves = false;

// ─── Public Init ───────────────────────────────────────────────

/**
 * Initialize the Sort Settings Modal.
 * Listens for SORT_MODAL_TOGGLED to show/hide.
 *
 * @param {HTMLElement} container - DOM node to render into
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/appState.js').AppState} appState
 */
export function initSortSettingsModal(container, eventBus, appState) {
    // Reset local state to defaults each time the modal is opened
    eventBus.on(Events.SORT_MODAL_TOGGLED, (isOpen) => {
        if (isOpen) {
            _resetState();
            _render(container, eventBus, appState);
        } else {
            container.innerHTML = '';
        }
    });
}

/** Reset all local state to sensible defaults. */
function _resetState() {
    scope = 'single';
    criteria = 'id';
    direction = 'asc';
    includeAllSaves = false;
}

// ─── Render ────────────────────────────────────────────────────

/**
 * Build the full modal and attach all event listeners.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 * @param {import('../../state/appState.js').AppState} appState
 */
function _render(container, eventBus, appState) {
    const isLivingDex = scope === 'living-dex';

    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[260]" id="sort-settings-modal">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">

                <!-- ═══ 1. HEADER ═══ -->
                <div class="bg-gray-800 dark:bg-gray-950 px-5 py-4 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-2.5">
                        <i data-lucide="arrow-down-a-z" class="w-5 h-5 text-white"></i>
                        <h2 class="text-white font-bold text-base tracking-wide">Sort PC Storage</h2>
                    </div>
                    <button id="sort-close-btn" class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10" aria-label="Close">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Scrollable body -->
                <div class="overflow-y-auto p-5 space-y-5 flex-1">

                    <!-- ═══ 2. SORTING METHOD ═══ -->
                    <section>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">Sorting Method</h3>
                        <div class="space-y-2" id="sort-scope-list">
                            ${_buildScopeButton('single', 'Current Box Only', 'box')}
                            ${_buildScopeButton('all-indiv', 'All Boxes (Sort Individually)', 'layers')}
                            ${_buildScopeButton('all-global', 'Global Sort (Merge & Refill)', 'globe')}
                            ${_buildScopeButton('living-dex', 'Living Dex Organization', 'book-open')}
                        </div>
                    </section>

                    <!-- ═══ 3. LIVING DEX OPTIONS ═══ -->
                    <section id="living-dex-options" class="${isLivingDex ? '' : 'hidden'}">
                        <div class="rounded-xl border ${includeAllSaves && isLivingDex ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'} p-3.5 transition-colors">
                            <label class="flex items-center gap-3 cursor-pointer select-none">
                                <input type="checkbox" id="include-all-saves-cb" class="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600" ${includeAllSaves ? 'checked' : ''} />
                                <div>
                                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Search in all open saves</span>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gather Pokemon from ALL open save tabs</p>
                                </div>
                            </label>
                        </div>
                    </section>

                    <!-- ═══ 4. CRITERIA & DIRECTION ═══ -->
                    <section>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 ${isLivingDex ? 'opacity-40' : ''}">Criteria & Direction</h3>
                        <div class="grid grid-cols-2 gap-4 ${isLivingDex ? 'opacity-40 pointer-events-none' : ''}" id="criteria-direction-grid">

                            <!-- Criteria Column -->
                            <div>
                                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Criteria</p>
                                <div class="space-y-1" id="sort-criteria-list">
                                    ${_buildCriteriaButton('id', 'Dex ID')}
                                    ${_buildCriteriaButton('species', 'Species Name')}
                                    ${_buildCriteriaButton('nickname', 'Nickname')}
                                    ${_buildCriteriaButton('level', 'Level')}
                                    ${_buildCriteriaButton('type', 'Type')}
                                </div>
                            </div>

                            <!-- Direction Column -->
                            <div>
                                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Direction</p>
                                <div class="space-y-1" id="sort-direction-list">
                                    ${_buildDirectionButton('asc', 'Ascending', 'arrow-down-a-z')}
                                    ${_buildDirectionButton('desc', 'Descending', 'arrow-up-a-z')}
                                </div>
                            </div>

                        </div>
                    </section>

                    <!-- ═══ 5. LIVING DEX NOTE ═══ -->
                    <section id="living-dex-note" class="${isLivingDex ? '' : 'hidden'}">
                        <div class="rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 p-3.5 flex gap-2.5">
                            <i data-lucide="info" class="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5"></i>
                            <p class="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                <strong>Living Dex</strong> organizes boxes so each Dex ID gets its own slot
                                (Boxes 1-8: IDs 1-151, Boxes 9-12: overflow). Criteria and direction are
                                ignored — sorting is always by Dex ID ascending. Party is cleared except for
                                one Pokemon kept for safety.
                            </p>
                        </div>
                    </section>

                </div>

                <!-- ═══ 6. FOOTER ═══ -->
                <div class="px-5 py-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
                    <button id="sort-cancel-btn" class="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button id="sort-apply-btn" class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-500/20 flex items-center gap-2">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        Apply Sort
                    </button>
                </div>

            </div>
        </div>
    `;

    // ─── Attach listeners ──────────────────────────────

    // Close button
    _on('sort-close-btn', 'click', () => _closeModal(container, eventBus));

    // Scope buttons
    container.querySelectorAll('[data-sort-scope]').forEach(btn => {
        btn.addEventListener('click', () => {
            scope = btn.dataset.sortScope;
            _render(container, eventBus, appState);
        });
    });

    // Criteria buttons
    container.querySelectorAll('[data-sort-criteria]').forEach(btn => {
        btn.addEventListener('click', () => {
            criteria = btn.dataset.sortCriteria;
            _render(container, eventBus, appState);
        });
    });

    // Direction buttons
    container.querySelectorAll('[data-sort-direction]').forEach(btn => {
        btn.addEventListener('click', () => {
            direction = btn.dataset.sortDirection;
            _render(container, eventBus, appState);
        });
    });

    // Include all saves checkbox
    const cb = document.getElementById('include-all-saves-cb');
    if (cb) {
        cb.addEventListener('change', () => {
            includeAllSaves = cb.checked;
            // Re-render just the living-dex options section for style update
            _render(container, eventBus, appState);
        });
    }

    // Cancel
    _on('sort-cancel-btn', 'click', () => _closeModal(container, eventBus));

    // Apply Sort
    _on('sort-apply-btn', 'click', () => {
        eventBus.emit(Events.SORT_REQUESTED, {
            scope,
            criteria,
            direction,
            includeAllSaves
        });
        _closeModal(container, eventBus);
    });

    // Click outside to close
    const overlay = document.getElementById('sort-settings-modal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                _closeModal(container, eventBus);
            }
        });
    }

    // Initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();
}

// ─── Sub-template Builders ─────────────────────────────────────

/**
 * Build a scope radio-style button.
 * @param {string} value - Scope value
 * @param {string} label - Display label
 * @param {string} icon - Lucide icon name
 * @returns {string} HTML string
 */
function _buildScopeButton(value, label, icon) {
    const active = scope === value;
    const base = 'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none group';
    const activeClasses = 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300';
    const inactiveClasses = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50';

    return `
        <button data-sort-scope="${value}" class="${base} ${active ? activeClasses : inactiveClasses}">
            <i data-lucide="${icon}" class="w-4 h-4 shrink-0 ${active ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}"></i>
            <span class="text-sm font-semibold flex-1 text-left">${label}</span>
            ${active ? '<i data-lucide="check" class="w-4 h-4 text-blue-500 shrink-0"></i>' : ''}
        </button>
    `;
}

/**
 * Build a criteria selection button.
 * @param {string} value - Criteria value
 * @param {string} label - Display label
 * @returns {string} HTML string
 */
function _buildCriteriaButton(value, label) {
    const active = criteria === value;
    const base = 'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none';
    const activeClasses = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300';
    const inactiveClasses = 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';

    return `
        <button data-sort-criteria="${value}" class="${base} ${active ? activeClasses : inactiveClasses}">
            ${label}
        </button>
    `;
}

/**
 * Build a direction selection button.
 * @param {string} value - 'asc' or 'desc'
 * @param {string} label - Display label
 * @param {string} icon - Lucide icon name
 * @returns {string} HTML string
 */
function _buildDirectionButton(value, label, icon) {
    const active = direction === value;
    const base = 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer select-none';
    const activeClasses = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
    const inactiveClasses = 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600';

    return `
        <button data-sort-direction="${value}" class="${base} ${active ? activeClasses : inactiveClasses}">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
            ${label}
        </button>
    `;
}

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Shortcut: add a click listener by element ID.
 * @param {string} id
 * @param {string} event
 * @param {Function} handler
 */
function _on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

/**
 * Close the modal: emit toggle event with false, then clear container.
 * @param {HTMLElement} container
 * @param {import('../../state/eventBus.js').EventBus} eventBus
 */
function _closeModal(container, eventBus) {
    eventBus.emit(Events.SORT_MODAL_TOGGLED, false);
    container.innerHTML = '';
}
