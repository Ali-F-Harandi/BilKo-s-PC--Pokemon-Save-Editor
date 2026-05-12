/**
 * textCodec.js — Generation II Text Encoding/Decoding
 *
 * Gen 2 uses a COMPLETELY DIFFERENT character map from Gen 1.
 * The primary printable characters (A-Z, a-z, 0-9) are in the 0x80-0xFF range,
 * NOT the 0x01-0x4A range. This was a critical bug in the previous version.
 *
 * Character map based on PKHeX CharMap.cs and pokecrystal charmap.asm.
 * The terminator byte is 0x50 (same as Gen 1).
 *
 * VERIFIED: The 0x80-0xFF range is used for names, nicknames, and OT names
 * in International (English/Western) Gen 2 save files.
 */

// Gen 2 International character map: byte value → character
// This is the CORRECT map from PKHeX / pokecrystal
const GEN2_CHAR_MAP = {
    // String terminator
    0x50: '',        // String terminator — stop reading
    
    // Special / control
    0x00: '',        // NUL — skip
    0x4E: '',        // Also used as terminator in some contexts
    
    // Uppercase A-Z (0x80-0x99)
    0x80: 'A', 0x81: 'B', 0x82: 'C', 0x83: 'D', 0x84: 'E',
    0x85: 'F', 0x86: 'G', 0x87: 'H', 0x88: 'I', 0x89: 'J',
    0x8A: 'K', 0x8B: 'L', 0x8C: 'M', 0x8D: 'N', 0x8E: 'O',
    0x8F: 'P', 0x90: 'Q', 0x91: 'R', 0x92: 'S', 0x93: 'T',
    0x94: 'U', 0x95: 'V', 0x96: 'W', 0x97: 'X', 0x98: 'Y',
    0x99: 'Z',
    
    // Brackets and punctuation (0x9A-0x9F)
    0x9A: '(', 0x9B: ')', 0x9C: ':', 0x9D: ';', 0x9E: '[', 0x9F: ']',
    
    // Lowercase a-z (0xA0-0xB9)
    0xA0: 'a', 0xA1: 'b', 0xA2: 'c', 0xA3: 'd', 0xA4: 'e',
    0xA5: 'f', 0xA6: 'g', 0xA7: 'h', 0xA8: 'i', 0xA9: 'j',
    0xAA: 'k', 0xAB: 'l', 0xAC: 'm', 0xAD: 'n', 0xAE: 'o',
    0xAF: 'p', 0xB0: 'q', 0xB1: 'r', 0xB2: 's', 0xB3: 't',
    0xB4: 'u', 0xB5: 'v', 0xB6: 'w', 0xB7: 'x', 0xB8: 'y',
    0xB9: 'z',
    
    // Special characters (0xC0-0xC5)
    0xC0: 'Ä', 0xC1: 'Ö', 0xC2: 'Ü', 0xC3: 'ä', 0xC4: 'ö', 0xC5: 'ü',
    
    // Apostrophe contractions (0xD0-0xD6)
    0xD0: "'d", 0xD1: "'l", 0xD2: "'m", 0xD3: "'r", 0xD4: "'s", 0xD5: "'t", 0xD6: "'v",
    
    // Symbols and punctuation (0xE0-0xEF)
    0xE0: '\u2019',  // ' (right single quotation mark / apostrophe)
    0xE1: 'P',       // P (from PK)
    0xE2: 'K',       // K (from PK/MN)
    0xE3: 'M',       // M
    0xE4: 'N',       // N
    0xE5: '-',       // hyphen
    0xE6: '?',       // question mark
    0xE7: '!',       // exclamation mark
    0xE8: '.',       // period
    0xE9: '&',       // ampersand
    0xEA: '\u00E9',  // é (as in Pokémon)
    0xEB: '\u25B7',  // ▷
    0xEC: '\u25B6',  // ▶
    0xED: '\u25BC',  // ▼
    0xEE: '\u2642',  // ♂ (male symbol)
    0xEF: '\u00D7',  // × (multiplication sign)
    
    // More symbols and numbers (0xF0-0xFE)
    0xF0: '\u00D7',  // × (alternate)
    0xF1: '.',       // period (alternate)
    0xF2: '/',       // slash
    0xF3: ',',       // comma
    0xF4: '\u2640',  // ♀ (female symbol)
    0xF5: '0', 0xF6: '1', 0xF7: '2', 0xF8: '3', 0xF9: '4',
    0xFA: '5', 0xFB: '6', 0xFC: '7', 0xFD: '8', 0xFE: '9',
    
    // Space (0x7F)
    0x7F: ' ',
    
    // Some additional control/placeholder codes in lower range
    // These should NOT appear in user-facing text but we handle them
    0x49: '...',     // ellipsis (used in some contexts)
    0x75: '+',       // plus sign
    0x76: '$',       // dollar sign  
    0x78: '@',       // at sign
    0x79: '%',       // percent
    0x7A: '=',       // equals
};

// Build reverse map: character → byte value
const GEN2_CHAR_MAP_REV = {};

// First pass: add all single-char mappings
for (const [byte, char] of Object.entries(GEN2_CHAR_MAP)) {
    if (char && char.length === 1) {
        const byteVal = parseInt(byte);
        if (!GEN2_CHAR_MAP_REV[char] || byteVal >= 0x80) {
            // Prefer the 0x80+ range for reverse mapping
            GEN2_CHAR_MAP_REV[char] = byteVal;
        }
    }
}

// Explicit overrides for reliable encoding
GEN2_CHAR_MAP_REV['\u00E9'] = 0xEA;  // é → 0xEA
GEN2_CHAR_MAP_REV[' '] = 0x7F;        // space → 0x7F
GEN2_CHAR_MAP_REV['A'] = 0x80;        // A → 0x80
GEN2_CHAR_MAP_REV['Z'] = 0x99;        // Z → 0x99
GEN2_CHAR_MAP_REV['a'] = 0xA0;        // a → 0xA0
GEN2_CHAR_MAP_REV['z'] = 0xB9;        // z → 0xB9
GEN2_CHAR_MAP_REV['0'] = 0xF5;        // 0 → 0xF5
GEN2_CHAR_MAP_REV['9'] = 0xFE;        // 9 → 0xFE
GEN2_CHAR_MAP_REV['!'] = 0xE7;        // ! → 0xE7
GEN2_CHAR_MAP_REV['?'] = 0xE6;        // ? → 0xE6
GEN2_CHAR_MAP_REV['.'] = 0xE8;        // . → 0xE8
GEN2_CHAR_MAP_REV[','] = 0xF3;        // , → 0xF3
GEN2_CHAR_MAP_REV['-'] = 0xE5;        // - → 0xE5
GEN2_CHAR_MAP_REV['/'] = 0xF2;        // / → 0xF2
GEN2_CHAR_MAP_REV['('] = 0x9A;        // ( → 0x9A
GEN2_CHAR_MAP_REV[')'] = 0x9B;        // ) → 0x9B
GEN2_CHAR_MAP_REV[':'] = 0x9C;        // : → 0x9C
GEN2_CHAR_MAP_REV[';'] = 0x9D;        // ; → 0x9D
GEN2_CHAR_MAP_REV['['] = 0x9E;        // [ → 0x9E
GEN2_CHAR_MAP_REV[']'] = 0x9F;        // ] → 0x9F
GEN2_CHAR_MAP_REV['&'] = 0xE9;        // & → 0xE9
GEN2_CHAR_MAP_REV['+'] = 0x75;        // + → 0x75
GEN2_CHAR_MAP_REV['$'] = 0x76;        // $ → 0x76
GEN2_CHAR_MAP_REV['@'] = 0x78;        // @ → 0x78
GEN2_CHAR_MAP_REV['%'] = 0x79;        // % → 0x79
GEN2_CHAR_MAP_REV['='] = 0x7A;        // = → 0x7A
GEN2_CHAR_MAP_REV['\u2642'] = 0xEE;   // ♂ → 0xEE
GEN2_CHAR_MAP_REV['\u2640'] = 0xF4;   // ♀ → 0xF4

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
            if (char !== '') {
                result += char;
            }
        } else {
            // Unknown byte — skip silently
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

    // Pad with terminators up to maxLength
    while (result.length < maxLength - 1) {
        result.push(0x7F); // Space padding
    }

    // Add terminator
    result.push(terminator);

    return result;
}

export { GEN2_CHAR_MAP, GEN2_CHAR_MAP_REV };
