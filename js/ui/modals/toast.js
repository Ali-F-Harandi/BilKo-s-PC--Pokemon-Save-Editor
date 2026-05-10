/**
 * toast.js — Toast Notification Component
 *
 * Ported from the toast in App.tsx.
 *
 * Phase 5 enhancement:
 * - Auto-dismiss after 3 seconds (matching original React behavior)
 * - Exit animation before removal
 * - The auto-dismiss timer is managed in app.js setupToastAutoDismiss()
 *   to avoid race conditions with multiple toasts.
 */

import { EventBus, Events } from '../../state/eventBus.js';

/**
 * Initialize the toast notification system.
 * @param {HTMLElement} container
 * @param {EventBus} eventBus
 */
export function initToast(container, eventBus) {
    eventBus.on(Events.SHOW_TOAST, (msg) => {
        if (msg) {
            container.innerHTML = `
                <div class="toast-notification animate-slide-from-top">
                    <i data-lucide="move" class="w-[18px] h-[18px] text-blue-400"></i>
                    <span class="font-bold text-sm">${msg}</span>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        } else {
            container.innerHTML = '';
        }
    });
}
