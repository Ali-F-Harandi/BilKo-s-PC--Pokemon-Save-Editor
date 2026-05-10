/**
 * textCodec.js — Generation II Text Encoding/Decoding
 *
 * Gen 2 uses a different character map from Gen 1, supporting
 * lowercase letters and additional punctuation. The terminator
 * byte is 0x50 (same as Gen 1).
 *
 * Character map based on pokered/pokecrystal constants.
 */

// Gen 2 character map: byte value → character
const GEN2_CHAR_MAP = {
    0x50: '',       // String terminator (map to empty)
    0x00: ' ',
    0x01: 'A', 0x02: 'B', 0x03: 'C', 0x04: 'D', 0x05: 'E',
    0x06: 'F', 0x07: 'G', 0x08: 'H', 0x09: 'I', 0x0A: 'J',
    0x0B: 'K', 0x0C: 'L', 0x0D: 'M', 0x0E: 'N', 0x0F: 'O',
    0x10: 'P', 0x11: 'Q', 0x12: 'R', 0x13: 'S', 0x14: 'T',
    0x15: 'U', 0x16: 'V', 0x17: 'W', 0x18: 'X', 0x19: 'Y',
    0x1A: 'Z',
    0x1B: '(', 0x1C: ')', 0x1D: ':', 0x1E: ';', 0x1F: '[',
    0x20: ']',
    0x21: 'a', 0x22: 'b', 0x23: 'c', 0x24: 'd', 0x25: 'e',
    0x26: 'f', 0x27: 'g', 0x28: 'h', 0x29: 'i', 0x2A: 'j',
    0x2B: 'k', 0x2C: 'l', 0x2D: 'm', 0x2E: 'n', 0x2F: 'o',
    0x30: 'p', 0x31: 'q', 0x32: 'r', 0x33: 's', 0x34: 't',
    0x35: 'u', 0x36: 'v', 0x37: 'w', 0x38: 'x', 0x39: 'y',
    0x3A: 'z',
    // Special characters
    0x3B: '\u00E9',  // é (as in Pokémon)
    0x3C: '\'d',     // apostrophe-d
    0x3D: '\'l',     // apostrophe-l
    0x3E: '\'s',     // apostrophe-s
    0x3F: '\'t',     // apostrophe-t
    0x40: '\'v',     // apostrophe-v
    // Numbers
    0x41: '0', 0x42: '1', 0x43: '2', 0x44: '3', 0x45: '4',
    0x46: '5', 0x47: '6', 0x48: '7', 0x49: '8', 0x4A: '9',
    // Punctuation and symbols
    0x4B: '!', 0x4C: '?', 0x4D: '.', 0x4E: ',', 0x4F: '-',
    // More symbols
    0x5B: '\u2642', // ♂ (male symbol)
    0x5C: '\u2640', // ♀ (female symbol)
    0x5D: '/', 0x5E: '*', 0x5F: '.',
    0x68: '\u2026', // … (ellipsis)
    0x75: '+',
    0x79: '\u00D7', // × (multiplication sign)
    0x7F: ' ',      // Another space variant
    // PKMN abbreviation
    0x84: 'PK', 0x85: 'MN',
    // Control codes (not rendered)
    0x4C: '?', // Also used as question mark
};

// Reverse map: character → byte value
const GEN2_CHAR_MAP_REV = {};
for (const [byte, char] of Object.entries(GEN2_CHAR_MAP)) {
    if (char && char.length === 1) {
        // Only single characters go in reverse map
        // Multi-char sequences like 'PK', 'MN' handled specially
        if (!GEN2_CHAR_MAP_REV[char]) {
            GEN2_CHAR_MAP_REV[char] = parseInt(byte);
        }
    }
}
// Special: 'é' maps to 0x3B
GEN2_CHAR_MAP_REV['\u00E9'] = 0x3B;
// Space
GEN2_CHAR_MAP_REV[' '] = 0x7F;

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
        const char = GEN2_CHAR_MAP[byte];
        if (char !== undefined) {
            result += char;
        } else if (byte >= 0x80 && byte <= 0x83) {
            // Control characters, skip
            continue;
        } else {
            result += '?'; // Unknown character
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
    const upperStr = str || '';

    for (let i = 0; i < upperStr.length && result.length < maxLength - 1; i++) {
        let char = upperStr[i];

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
