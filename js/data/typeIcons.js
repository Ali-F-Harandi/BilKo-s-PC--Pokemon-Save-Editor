/**
 * typeIcons.js — SVG Type Icon Data for Pokémon Types
 *
 * Each type has a small inline SVG icon for visual display alongside
 * the type name and color badge.
 */

export const TYPE_ICONS = {
  Normal: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,

  Fire: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,

  Water: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>`,

  Electric: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`,

  Grass: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`,

  Ice: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M22 11h-4.17l2.08-2.09-1.41-1.41L14 12l4.5 4.5 1.41-1.41L17.83 13H22v-2zm-7.5-7.5L10 8l4.5 4.5 1.41-1.41L13.41 9H20V7h-6.59l2.09-2.09-1.41-1.41zM9 12l-4.5 4.5 1.41 1.41L8.17 15H2v2h6.17l-2.09 2.09 1.41 1.41L12 15 9 12z"/></svg>`,

  Fighting: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M15.6 11.79l1.86-1.86c2.34-2.34 2.34-6.14 0-8.48l-1.41 1.41c1.56 1.56 1.56 4.1 0 5.66l-1.86 1.86-1.86-1.86c-1.56-1.56-1.56-4.1 0-5.66L9.92 1.45c-2.34 2.34-2.34 6.14 0 8.48l1.86 1.86-1.86 1.86c-2.34 2.34-2.34 6.14 0 8.48l1.41-1.41c-1.56-1.56-1.56-4.1 0-5.66l1.86-1.86 1.86 1.86c1.56 1.56 1.56 4.1 0 5.66l1.41-1.41c2.34-2.34 2.34-6.14 0-8.48z"/></svg>`,

  Poison: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm4 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/></svg>`,

  Ground: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2L2 12l3 3 7-7 7 7 3-3L12 2zm0 5.5L6.5 13l5.5 5.5 5.5-5.5L12 7.5z"/></svg>`,

  Flying: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M21 6l-2 2c-1.1-1.1-2.7-2-4.5-2-3.3 0-6 2.7-6 6v1H5l4.5 4.5L14 13h-3.5v-1c0-2.2 1.8-4 4-4 1.1 0 2.1.5 2.8 1.2L12 14.5l4.5 4.5L21 14.5h-3.5c0-3.3-2.7-6-6-6h-.5C11.5 5.5 14.2 3 17.5 3c1.8 0 3.5.9 4.5 2l-1 1z"/></svg>`,

  Psychic: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5zm5-3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>`,

  Bug: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>`,

  Rock: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M17 9l-3-6H10L7 9l-5 4 3 7h16l3-7-7-4zm-5-3.5L14.5 8h-5L12 5.5zM6.5 18L4 13l4-3h8l4 3-2.5 5h-11z"/></svg>`,

  Ghost: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C7.03 2 3 6.03 3 11v8l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2v-8c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7v5.17l-1-1-2 2-2-2-2 2-2-2-2 2-2-2-1 1V11c0-3.87 3.13-7 7-7zm-3 7c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm6 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/></svg>`,

  Dragon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M3 9v6h4l5 5V4L7 9H3zm7-1.5v9l-3-3H5v-3h2l3-3zM14 6v1.5c2.2.8 3.5 3 3.5 5.5s-1.3 4.7-3.5 5.5V20c3-.8 5-3.6 5-7s-2-6.2-5-7zM14 9.5v5c1.1-.6 2-1.5 2-2.5s-.9-1.9-2-2.5z"/></svg>`,

  Dark: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`,

  Steel: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M22 13h-8v-2h8v2zm0-6h-8v2h8V7zm-8 10h8v-2h-8v2zm-2-8v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2zm-1.5 6l-2.25-3-1.75 2.26-1.25-1.51L3.5 15h7z"/></svg>`,

  Fairy: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>`,

  '???': `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>`
};

/**
 * Get the SVG icon HTML for a given type name.
 * @param {string} typeName - The Pokémon type name (e.g., "Fire", "Water")
 * @returns {string} HTML string with the SVG icon
 */
export function getTypeIcon(typeName) {
  return TYPE_ICONS[typeName] || TYPE_ICONS['???'];
}
