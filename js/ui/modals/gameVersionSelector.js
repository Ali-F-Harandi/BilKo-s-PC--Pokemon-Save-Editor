/**
 * gameVersionSelector.js — Game Version Disambiguation Modal
 *
 * Ported from components/home/GameVersionSelector.tsx
 *
 * Phase 5 Fix: Changed event from raw string 'pendingSaveDataChanged'
 * to Events.PENDING_SAVE_CHANGED constant for consistency.
 *
 * Phase 6: Full implementation with cartridge UI
 * Now supports both Gen 1 (Red/Blue/Yellow) and Gen 2 (Gold/Silver/Crystal).
 *
 * Scalability: Fully data-driven from adapter.getSupportedVersions().
 * Adding Gen 3+ only requires registering a new adapter — no UI changes needed.
 */

import { EventBus, Events } from '../../state/eventBus.js';
import { GenerationRegistry } from '../../core/GenerationRegistry.js';
import { AdapterFactory } from '../../core/AdapterFactory.js';

let _currentGenerationId = 1;
let _detectedVersion = '';

export function initGameVersionSelector(container, eventBus, appState) {
    // Listen for pending save data changes using proper Events constant
    eventBus.on(Events.PENDING_SAVE_CHANGED, (data) => {
        if (data) {
            _detectedVersion = data.gameVersion || '';
            _render(container, eventBus, appState, data);
        } else {
            container.innerHTML = '';
        }
    });

    // Also listen for close event
    eventBus.on(Events.CLOSE_VERSION_SELECTOR, () => {
        container.innerHTML = '';
    });
}

function _render(container, eventBus, appState, pendingData) {
    const filename = pendingData.originalFilename || 'Unknown File';

    // Detect generation from pending data to show appropriate options
    const generationId = pendingData.generationId || pendingData.generation || 1;
    _currentGenerationId = generationId;

    // Scalability: version definitions come from the adapter
    // Adding Gen 3+ only requires adding getSupportedVersions() to the new adapter
    const registry = new GenerationRegistry();
    const factory = new AdapterFactory(registry);
    const adapter = factory.createForGeneration(generationId);
    const versions = adapter ? adapter.getSupportedVersions() : [
        { id: 'red', label: 'RED', sublabel: 'Red Version', gradient: 'linear-gradient(135deg, #FF3B3B 0%, #cc2200 100%)' },
        { id: 'blue', label: 'BLUE', sublabel: 'Blue Version', gradient: 'linear-gradient(135deg, #3B4CCA 0%, #2233aa 100%)' },
    ];
    const detectedLower = _detectedVersion.toLowerCase();

    // Build version buttons dynamically
    const versionButtonsHtml = versions.map(v => {
        const isDetected = v.id === detectedLower;
        const detectedBadge = isDetected
            ? '<div class="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500 rounded text-[10px] font-bold text-white">DETECTED</div>'
            : '';
        const ring = isDetected ? 'ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-900' : '';
        return `
            <button id="version-${v.id}-btn"
                class="flex-1 max-w-[140px] group relative overflow-hidden rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${ring}"
                style="background: ${v.gradient};">
                ${detectedBadge}
                <div class="p-4 text-center text-white">
                    <div class="text-2xl font-black mb-1">${v.label}</div>
                    <div class="text-xs opacity-70">${v.sublabel}</div>
                </div>
                <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/30"></div>
            </button>`;
    }).join('');

    // Description text: show detected version hint if available
    const detectedHint = _detectedVersion
        ? `<p class="text-sm text-green-600 dark:text-green-400 mb-1 font-bold">Auto-detected: ${_detectedVersion}</p>`
        : '';

    container.innerHTML = `
        <div class="modal-overlay animate-fade-in z-[400]" id="version-selector-overlay">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-zoom-in-95 overflow-hidden">
                <div class="p-6 text-center">
                    <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="help-circle" class="w-7 h-7 text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Game Version</h3>
                    ${detectedHint}
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Please confirm the game version for this save.</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 font-mono truncate mb-6">${escapeHtml(filename)}</p>

                    <div class="flex gap-3 justify-center flex-wrap">
                        ${versionButtonsHtml}
                    </div>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
                    <button id="version-cancel-btn" class="w-full text-gray-500 font-bold text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-1">Skip This File</button>
                </div>
            </div>
        </div>
    `;

    // Clicking overlay backdrop also cancels
    document.getElementById('version-selector-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'version-selector-overlay') {
            appState.handleVersionCancel();
        }
    });

    // Bind all version buttons dynamically
    for (const v of versions) {
        const btnId = `version-${v.id}-btn`;
        const versionName = v.id.charAt(0).toUpperCase() + v.id.slice(1);
        document.getElementById(btnId)?.addEventListener('click', () => {
            container.innerHTML = '';
            appState.handleVersionConfirm(versionName);
        });
    }

    document.getElementById('version-cancel-btn')?.addEventListener('click', () => {
        container.innerHTML = '';
        appState.handleVersionCancel();
    });

    if (window.lucide) window.lucide.createIcons();
}

// Simple HTML escape
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
