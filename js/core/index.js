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

// Binary I/O (Phase 4)
export { BinaryReader } from './binary/BinaryReader.js';
export { BinaryWriter } from './binary/BinaryWriter.js';

// Text Codec (Phase 4)
export { BaseTextCodec } from './textCodec/BaseTextCodec.js';
export { Gen1TextCodec } from './textCodec/Gen1TextCodec.js';
export { Gen2TextCodec } from './textCodec/Gen2TextCodec.js';

// Validation (Phase 4)
export { ChecksumAlgorithms } from './validation/ChecksumAlgorithms.js';
export { BaseFieldValidator, getFieldValidator, validateField, clampValue, registerFieldValidator } from './validation/FieldValidator.js';

// Legality (Phase 6)
export { LegalityChecker, LegalityResult } from './legality/LegalityChecker.js';
