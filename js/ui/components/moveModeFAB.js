/**
 * moveModeFAB.js — Move Mode Floating Action Button
 * 
 * Ported from the Move Mode FAB in App.tsx
 */

import { EventBus, Events } from '../../state/eventBus.js';

// ---- Cleanup (event listener memory leak prevention) ----
let _unsubs = [];

export function destroyMoveModeFAB() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
}

export function initMoveModeFAB(container, eventBus, appState) {
    _unsubs.push(eventBus.on(Events.MOVE_MODE_TOGGLED, (isMoveMode) => {
        _render(container, eventBus, appState, isMoveMode);
    }));

    _unsubs.push(eventBus.on(Events.SELECTION_TOGGLED, () => {
        // Update selection count display
        const countEl = container.querySelector('.fab-count');
        if (countEl) {
            countEl.textContent = appState.getSelectedMoveLocations().length > 0
                ? `${appState.getSelectedMoveLocations().length} Selected`
                : 'Move Mode';
        }
    }));
}

function _render(container, eventBus, appState, isMoveMode) {
    if (isMoveMode) {
        const selectionCount = appState.getSelectedMoveLocations().length;
        container.innerHTML = `
            <div class="fixed bottom-6 right-6 z-[900] animate-zoom-in duration-300 group">
                <button id="move-mode-exit-btn"
                    class="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    title="Exit Move Mode">
                    <i data-lucide="x" class="w-7 h-7" style="stroke-width:3"></i>
                </button>
                <div class="absolute -top-10 right-0 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none fab-count">
                    ${selectionCount > 0 ? `${selectionCount} Selected` : 'Move Mode'}
                </div>
            </div>
        `;

        document.getElementById('move-mode-exit-btn')?.addEventListener('click', () => {
            appState.handleMoveModeToggle(false);
        });

        if (window.lucide) window.lucide.createIcons();
    } else {
        container.innerHTML = '';
    }
}
