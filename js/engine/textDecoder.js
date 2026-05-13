/**
 * textDecoder.js — Gen 1 Text Encoding/Decoding
 *
 * Ported from lib/utils/textDecoder.ts
 * Handles the custom character map used in Generation 1 Pokémon games.
 */

/** Gen 1 character map: byte value → character */
export const CHAR_MAP = {
  0x80: 'A', 0x81: 'B', 0x82: 'C', 0x83: 'D', 0x84: 'E', 0x85: 'F', 0x86: 'G', 0x87: 'H', 0x88: 'I',
  0x89: 'J', 0x8A: 'K', 0x8B: 'L', 0x8C: 'M', 0x8D: 'N', 0x8E: 'O', 0x8F: 'P', 0x90: 'Q', 0x91: 'R',
  0x92: 'S', 0x93: 'T', 0x94: 'U', 0x95: 'V', 0x96: 'W', 0x97: 'X', 0x98: 'Y', 0x99: 'Z',
  0x9A: '(', 0x9B: ')', 0x9C: ':', 0x9D: ';', 0x9E: '[', 0x9F: ']', 0xA0: 'a', 0xA1: 'b', 0xA2: 'c',
  0xA3: 'd', 0xA4: 'e', 0xA5: 'f', 0xA6: 'g', 0xA7: 'h', 0xA8: 'i', 0xA9: 'j', 0xAA: 'k', 0xAB: 'l',
  0xAC: 'm', 0xAD: 'n', 0xAE: 'o', 0xAF: 'p', 0xB0: 'q', 0xB1: 'r', 0xB2: 's', 0xB3: 't', 0xB4: 'u',
  0xB5: 'v', 0xB6: 'w', 0xB7: 'x', 0xB8: 'y', 0xB9: 'z',

  // Numerics
  0xF6: '0',
  0xF7: '1', 0xF8: '2', 0xF9: '3', 0xFA: '4', 0xFB: '5', 0xFC: '6', 0xFD: '7', 0xFE: '8', 0xFF: '9',

  // Special chars
  0x7F: ' ', // Space
  0x50: '',  // Terminator
  0xE8: '.',
  0xF2: '/', // Forward slash (was incorrectly '.')
  0xE3: '-',
  0xE6: '?',
  0xE7: '!',
  0xF3: '(', // Opening parenthesis (was incorrectly '/')
  0xF4: ')', // Closing parenthesis (was incorrectly ',')

  // Gen 1 Specifics
  0xE1: 'Pk',
  0xE2: 'Mn',
  0x60: "'", // Bold single quote
  0xEF: '♂',
  0xF5: '♀', // Female symbol
  0xE0: "'",
  0xE4: "'", // 'r contraction
  0xE5: "'", // 'm contraction
  0xE9: ',', // Comma
  0xEA: ';', // Semicolon
  0xEB: ':', // Colon
  0xF0: '¥', // Yen symbol
  0xF1: '×', // Multiplication sign
  0x52: '\n', // Line break (handled as space or ignored)
  0x54: 'POKé',
};

/** Reverse character map: character → byte value (for encoding) */
export const CHAR_MAP_REV = {
  'A': 0x80, 'B': 0x81, 'C': 0x82, 'D': 0x83, 'E': 0x84, 'F': 0x85, 'G': 0x86, 'H': 0x87,
  'I': 0x88, 'J': 0x89, 'K': 0x8A, 'L': 0x8B, 'M': 0x8C, 'N': 0x8D, 'O': 0x8E, 'P': 0x8F,
  'Q': 0x90, 'R': 0x91, 'S': 0x92, 'T': 0x93, 'U': 0x94, 'V': 0x95, 'W': 0x96, 'X': 0x97,
  'Y': 0x98, 'Z': 0x99, '(': 0x9A, ')': 0x9B, ':': 0x9C, ';': 0x9D, '[': 0x9E, ']': 0x9F,
  'a': 0xA0, 'b': 0xA1, 'c': 0xA2, 'd': 0xA3, 'e': 0xA4, 'f': 0xA5, 'g': 0xA6, 'h': 0xA7,
  'i': 0xA8, 'j': 0xA9, 'k': 0xAA, 'l': 0xAB, 'm': 0xAC, 'n': 0xAD, 'o': 0xAE, 'p': 0xAF,
  'q': 0xB0, 'r': 0xB1, 's': 0xB2, 't': 0xB3, 'u': 0xB4, 'v': 0xB5, 'w': 0xB6, 'x': 0xB7,
  'y': 0xB8, 'z': 0xB9, ' ': 0x7F, '?': 0xE6, '!': 0xE7, '.': 0xE8, '-': 0xE3,
  '/': 0xF2, ',': 0xE9, ';': 0xEA, ':': 0xEB, "'": 0xE0,
  '0': 0xF6, '1': 0xF7, '2': 0xF8, '3': 0xF9, '4': 0xFA, '5': 0xFB, '6': 0xFC, '7': 0xFD, '8': 0xFE, '9': 0xFF
};

/**
 * Decode Gen 1 text from a byte buffer.
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {number} maxLength
 * @returns {string}
 */
export const decodeText = (buffer, offset, maxLength) => {
  let result = '';
  for (let i = 0; i < maxLength; i++) {
    if (offset + i >= buffer.length) break;
    const byte = buffer[offset + i];

    // Terminators: 0x50 is standard, but 0x00 is often found in empty/padded data
    if (byte === 0x50 || byte === 0x00) break;

    const char = CHAR_MAP[byte] || '?';
    result += char;
  }
  return result;
};

/**
 * Encode text to Gen 1 byte format.
 * @param {string} text - The text to encode
 * @param {number} length - Total byte length (padded with terminator)
 * @param {number} [terminator=0x50] - Terminator byte value
 * @returns {number[]} Array of byte values
 */
export function encodeText(text, length, terminator = 0x50) {
  const result = [];
  for (let i = 0; i < length; i++) {
    if (i < text.length) {
      const char = text[i];
      result.push(CHAR_MAP_REV[char] !== undefined ? CHAR_MAP_REV[char] : 0xE6);
    } else {
      result.push(terminator);
    }
  }
  return result;
}
