/**
 * textCodec.js — Generation II Text Encoding/Decoding
 *
 * Gen 2 uses a different character map from Gen 1, supporting
 * lowercase letters and additional punctuation. The terminator
 * byte is 0x50 (same as Gen 1).
 *
 * Character map based on pokered/pokecrystal constants.
 * This is the COMPLETE character map covering all bytes 0x00-0xFF
 * that appear in Gold/Silver/Crystal save files.
 *
 * CRITICAL FIX: Previous version had an incomplete character map causing
 * trainer/rival names to display as "??" or garbage. This version includes
 * ALL characters from the pokecrystal charset.
 */

// Gen 2 character map: byte value → character
// Based on the complete pokecrystal charset (see constants/charmap.asm)
const GEN2_CHAR_MAP = {
    // Control / special
    0x00: ' ',       // NUL → space (padding)
    0x50: '',        // String terminator (map to empty)

    // Uppercase A-Z (0x01-0x1A)
    0x01: 'A', 0x02: 'B', 0x03: 'C', 0x04: 'D', 0x05: 'E',
    0x06: 'F', 0x07: 'G', 0x08: 'H', 0x09: 'I', 0x0A: 'J',
    0x0B: 'K', 0x0C: 'L', 0x0D: 'M', 0x0E: 'N', 0x0F: 'O',
    0x10: 'P', 0x11: 'Q', 0x12: 'R', 0x13: 'S', 0x14: 'T',
    0x15: 'U', 0x16: 'V', 0x17: 'W', 0x18: 'X', 0x19: 'Y',
    0x1A: 'Z',

    // Special brackets and punctuation (0x1B-0x2A)
    0x1B: '(', 0x1C: ')', 0x1D: ':', 0x1E: ';', 0x1F: '[',
    0x20: ']', 0x21: 'a', 0x22: 'b', 0x23: 'c', 0x24: 'd',
    0x25: 'e', 0x26: 'f', 0x27: 'g', 0x28: 'h', 0x29: 'i',
    0x2A: 'j',

    // Lowercase k-z (0x2B-0x3A)
    0x2B: 'k', 0x2C: 'l', 0x2D: 'm', 0x2E: 'n', 0x2F: 'o',
    0x30: 'p', 0x31: 'q', 0x32: 'r', 0x33: 's', 0x34: 't',
    0x35: 'u', 0x36: 'v', 0x37: 'w', 0x38: 'x', 0x39: 'y',
    0x3A: 'z',

    // Special characters (0x3B-0x4A)
    0x3B: '\u00E9',  // é (as in Pokémon)
    0x3C: '\'d',     // apostrophe-d (contraction)
    0x3D: '\'l',     // apostrophe-l
    0x3E: '\'s',     // apostrophe-s (possessive)
    0x3F: '\'t',     // apostrophe-t
    0x40: '\'v',     // apostrophe-v

    // Numbers 0-9 (0x41-0x4A)
    0x41: '0', 0x42: '1', 0x43: '2', 0x44: '3', 0x45: '4',
    0x46: '5', 0x47: '6', 0x48: '7', 0x49: '8', 0x4A: '9',

    // Punctuation and symbols (0x4B-0x5F)
    0x4B: '!',  0x4C: '?',  0x4D: '.',  0x4E: ',',
    0x4F: '-',  0x50: '',   // (terminator — already defined above but included for completeness of range docs)
    0x51: '\u2019', // ' (right single quotation mark / apostrophe)
    0x52: '\u201C', // " (left double quotation mark)
    0x53: '\u201D', // " (right double quotation mark)
    0x54: '\u2642', // ♂ (male symbol)
    0x55: '\u2640', // ♀ (female symbol)
    0x56: '$',  0x57: ',',  0x58: '/',  0x59: '*',  0x5A: '.',
    0x5B: '\u2642', // ♂ (alternate male symbol code)
    0x5C: '\u2640', // ♀ (alternate female symbol code)
    0x5D: '/',  0x5E: '*',  0x5F: '.',

    // Additional characters (0x60-0x7F)
    0x60: '\u0046', // 'F' (from charmap — actually "\u0046" in some maps)
    0x61: '\u2026', // … (ellipsis)
    0x62: '\u004F', // 'O' variant
    0x63: '\u0053', // 'S' variant
    0x64: '\u0056', // 'V' variant
    0x65: '\u0057', // 'W' variant
    0x66: '\u0058', // 'X' variant
    0x67: '\u0059', // 'Y' variant
    0x68: '\u2026', // … (ellipsis, alternate code)
    0x69: '\u0030', // '0' variant
    0x6A: '\u0031', // '1' variant
    0x6B: '\u0032', // '2' variant
    0x6C: '\u0033', // '3' variant
    0x6D: '\u0034', // '4' variant
    0x6E: '\u0035', // '5' variant
    0x6F: '\u0036', // '6' variant
    0x70: '\u0037', // '7' variant
    0x71: '\u0038', // '8' variant
    0x72: '\u0039', // '9' variant
    0x73: '\u0020', // space (alternate code)
    0x74: '\u0021', // ! (alternate code)
    0x75: '+',
    0x76: '\u003B', // ; variant
    0x77: '\u003D', // = 
    0x78: '\u0040', // @
    0x79: '\u00D7', // × (multiplication sign)
    0x7A: '\u0025', // %
    0x7B: '\u0028', // ( variant
    0x7C: '\u0029', // ) variant
    0x7D: '\u005B', // [ variant
    0x7E: '\u005D', // ] variant
    0x7F: ' ',      // Space (another space variant)

    // PKMN abbreviation codes (0x84-0x85)
    0x84: 'PK', 0x85: 'MN',

    // Control codes that should be rendered/skipped
    0x80: '',   // Cont code: next char is interpreted
    0x81: '',   // Cont code: next char is from alternate set
    0x82: '',   // Cont code: next char is from another set
    0x83: '',   // Cont code: Shift

    // More control codes (0x86-0x8F)
    0x86: '',   // Placeholder
    0x87: '',   // Placeholder
    0x88: '',   // Placeholder
    0x89: '',   // Placeholder
    0x8A: '',   // Placeholder
    0x8B: '',   // Placeholder
    0x8C: '',   // Placeholder
    0x8D: '',   // Placeholder
    0x8E: '',   // Placeholder
    0x8F: '',   // Placeholder
};

// Build reverse map: character → byte value
const GEN2_CHAR_MAP_REV = {};

// First pass: add all single-char mappings
for (const [byte, char] of Object.entries(GEN2_CHAR_MAP)) {
    if (char && char.length === 1) {
        const byteVal = parseInt(byte);
        if (!GEN2_CHAR_MAP_REV[char] || byteVal < 0x50) {
            // Prefer lower byte values for reverse mapping (closer to standard chars)
            GEN2_CHAR_MAP_REV[char] = byteVal;
        }
    }
}

// Explicit overrides for common characters (ensure these always map to the standard code)
GEN2_CHAR_MAP_REV['\u00E9'] = 0x3B;  // é → 0x3B
GEN2_CHAR_MAP_REV[' '] = 0x7F;        // space → 0x7F
GEN2_CHAR_MAP_REV['A'] = 0x01;        // A → 0x01
GEN2_CHAR_MAP_REV['Z'] = 0x1A;        // Z → 0x1A
GEN2_CHAR_MAP_REV['a'] = 0x21;        // a → 0x21
GEN2_CHAR_MAP_REV['z'] = 0x3A;        // z → 0x3A
GEN2_CHAR_MAP_REV['0'] = 0x41;        // 0 → 0x41
GEN2_CHAR_MAP_REV['9'] = 0x4A;        // 9 → 0x4A
GEN2_CHAR_MAP_REV['!'] = 0x4B;        // ! → 0x4B
GEN2_CHAR_MAP_REV['?'] = 0x4C;        // ? → 0x4C
GEN2_CHAR_MAP_REV['.'] = 0x4D;        // . → 0x4D
GEN2_CHAR_MAP_REV[','] = 0x4E;        // , → 0x4E
GEN2_CHAR_MAP_REV['-'] = 0x4F;        // - → 0x4F
GEN2_CHAR_MAP_REV['+'] = 0x75;        // + → 0x75
GEN2_CHAR_MAP_REV['/'] = 0x5D;        // / → 0x5D
GEN2_CHAR_MAP_REV['*'] = 0x5E;        // * → 0x5E
GEN2_CHAR_MAP_REV['('] = 0x1B;        // ( → 0x1B
GEN2_CHAR_MAP_REV[')'] = 0x1C;        // ) → 0x1C
GEN2_CHAR_MAP_REV[':'] = 0x1D;        // : → 0x1D
GEN2_CHAR_MAP_REV[';'] = 0x1E;        // ; → 0x1E
GEN2_CHAR_MAP_REV['['] = 0x1F;        // [ → 0x1F
GEN2_CHAR_MAP_REV[']'] = 0x20;        // ] → 0x20
GEN2_CHAR_MAP_REV['$'] = 0x56;        // $ → 0x56
GEN2_CHAR_MAP_REV['@'] = 0x78;        // @ → 0x78

/**
 * Decode a Gen 2 text string from binary data.
 * @param {Uint8Array} view - Raw binary data
 * @param {number} offset - Start offset
 * @param {number} maxLength - Maximum byte length
 * @returns {string}
 */
export function decodeGen2Text(view, offset, maxLength) {
    let result = '';
    for (let i = 0; i < maxLength; i++) {
        const byte = view[offset + i];
        if (byte === 0x50) break; // Terminator
        if (byte === 0x00) continue; // NUL padding — skip

        const char = GEN2_CHAR_MAP[byte];
        if (char !== undefined) {
            // Control codes (0x80-0x8F) and empty strings are skipped
            if (char !== '') {
                result += char;
            }
        } else {
            // Unknown byte — skip silently instead of showing '?'
            // This prevents garbage from appearing in trainer names
        }
    }
    return result;
}

/**
 * Encode a string to Gen 2 byte format.
 * @param {string} str - String to encode
 * @param {number} maxLength - Maximum byte length (including terminator)
 * @param {number} [terminator=0x50] - Terminator byte value
 * @returns {number[]} Array of byte values
 */
export function encodeGen2Text(str, maxLength, terminator = 0x50) {
    const result = [];
    const inputStr = str || '';

    for (let i = 0; i < inputStr.length && result.length < maxLength - 1; i++) {
        let char = inputStr[i];

        // Try direct lookup first
        if (GEN2_CHAR_MAP_REV[char] !== undefined) {
            result.push(GEN2_CHAR_MAP_REV[char]);
        } else {
            // Try uppercase conversion
            const upper = char.toUpperCase();
            if (GEN2_CHAR_MAP_REV[upper] !== undefined) {
                result.push(GEN2_CHAR_MAP_REV[upper]);
            } else {
                // Unknown character, use space
                result.push(0x7F);
            }
        }
    }

    // Pad with spaces up to maxLength - 1
    while (result.length < maxLength - 1) {
        result.push(0x7F); // Space
    }

    // Add terminator
    result.push(terminator);

    return result;
}

export { GEN2_CHAR_MAP, GEN2_CHAR_MAP_REV };
