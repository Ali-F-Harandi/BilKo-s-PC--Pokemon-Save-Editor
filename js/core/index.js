/**
 * core/index.js — Core Architecture Module Index
 *
 * Re-exports all core modules for convenient importing.
 * This is the main entry point for the new multi-generation architecture.
 *
 * Usage:
 *   import { AdapterFactory, GenerationRegistry, Gen1Adapter, CanonicalPokemon } from './core/index.js';
 */

export { CanonicalPokemon, CanonicalSaveFile } from './CanonicalModel.js';
export { BaseAdapter } from './BaseAdapter.js';
export { GenerationRegistry } from './GenerationRegistry.js';
export { AdapterFactory } from './AdapterFactory.js';
export { SaveManager } from './SaveManager.js';
