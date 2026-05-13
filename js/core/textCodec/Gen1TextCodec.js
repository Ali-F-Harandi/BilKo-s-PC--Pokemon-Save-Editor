/**
 * Gen1TextCodec.js — Generation 1 text encoding/decoding.
 * Gen1 uses a proprietary 1-byte character encoding with 0x50 terminator.
 * Two variants: English (TableEN) and Japanese (TableJP).
 */
import { BaseTextCodec } from './BaseTextCodec.js';

// English character map (0x80-0x99 = A-Z, 0xA0-0xB9 = a-z, 0xF6-0xFF = 0-9)
const GEN1_EN_CHAR_MAP = {};
const GEN1_EN_REVERSE_MAP = {};

// Build the character map
(function() {
    const m = GEN1_EN_CHAR_MAP;
    const r = GEN1_EN_REVERSE_MAP;

    m[0x50] = '\0'; // terminator (not rendered)
    m[0x7F] = ' ';  // space
    // Uppercase A-Z: 0x80-0x99
    for (let i = 0; i < 26; i++) { m[0x80 + i] = String.fromCharCode(65 + i); }
    // Lowercase a-z (some positions have special chars): 0xA0-0xB9
    const lowerStart = 0xA0;
    for (let i = 0; i < 26; i++) { m[lowerStart + i] = String.fromCharCode(97 + i); }
    // Digits 0-9: 0xF6-0xFF
    for (let i = 0; i < 10; i++) { m[0xF6 + i] = String.fromCharCode(48 + i); }

    // Special characters
    m[0xE1] = 'Pk'; m[0xE2] = 'Mn'; m[0xE3] = '-';
    m[0xE6] = '?'; m[0xE7] = '!'; m[0xE8] = '.'; m[0xE9] = ',';
    m[0xEA] = ';'; m[0xEB] = ':'; m[0xE4] = "'"; // 'r contraction apostrophe
    m[0xE5] = "'"; // 'm contraction apostrophe
    m[0xEF] = '\u2642'; // ♂ male symbol
    m[0xF5] = '\u2640'; // ♀ female symbol
    m[0xF0] = '\u00A5'; // ¥ yen
    m[0xF1] = '\u00D7'; // × multiply
    m[0xF2] = '/'; m[0xF3] = '('; m[0xF4] = ')';
    m[0x5D] = '*'; // Trade OT marker
    // Apostrophe
    m[0xE0] = "'";
    // Line break
    m[0x52] = '\n';
    // POKé
    m[0x54] = 'POKé';

    // Build reverse map
    for (const [k, v] of Object.entries(m)) {
        if (v !== '\0' && !r[v]) r[v] = parseInt(k);
    }
    // Special: map individual characters from multi-char strings
    r[' '] = 0x7F; r['?'] = 0xE6; r['!'] = 0xE7; r['.'] = 0xE8;
    r[','] = 0xE9; r[';'] = 0xEA; r[':'] = 0xEB; r["'"] = 0xE0;
    r['-'] = 0xE3; r['*'] = 0x5D; r['/'] = 0xF2;
    // Note: '(' and ')' are already mapped to 0x9A/0x9B by the
    // programmatic reverse map. Do NOT override to 0xF3/0xF4 here,
    // as 0x9A/0x9B are the standard bracket positions for encoding.
    for (let i = 0; i < 10; i++) r[String.fromCharCode(48 + i)] = 0xF6 + i;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(65 + i)] = 0x80 + i;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(97 + i)] = lowerStart + i;
})();

// Japanese character map
const GEN1_JP_CHAR_MAP = {};
const GEN1_JP_REVERSE_MAP = {};

(function() {
    const m = GEN1_JP_CHAR_MAP;
    const r = GEN1_JP_REVERSE_MAP;
    m[0x50] = '\0';
    m[0x7F] = ' ';
    // Katakana basic: 0x80-0x9F (a-o)
    const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    for (let i = 0; i < katakana.length && 0x80 + i <= 0x9F + 0x20; i++) {
        m[0x80 + i] = katakana[i];
    }
    // Digits and basic ASCII
    for (let i = 0; i < 10; i++) { m[0xF6 + i] = String.fromCharCode(48 + i); }
    m[0xEF] = '\u2642'; m[0xF5] = '\u2640';
    m[0xE6] = '?'; m[0xE7] = '!'; m[0xE8] = '.';

    for (const [k, v] of Object.entries(m)) {
        if (v !== '\0' && !r[v]) r[v] = parseInt(k);
    }
    r[' '] = 0x7F; r['?'] = 0xE6; r['!'] = 0xE7; r['.'] = 0xE8;
    for (let i = 0; i < 10; i++) r[String.fromCharCode(48 + i)] = 0xF6 + i;
})();

export class Gen1TextCodec extends BaseTextCodec {
    constructor(language = 'en') {
        const isJapanese = language === 'jp' || language === 'jpn';
        const charMap = isJapanese ? GEN1_JP_CHAR_MAP : GEN1_EN_CHAR_MAP;
        const reverseMap = isJapanese ? GEN1_JP_REVERSE_MAP : GEN1_EN_REVERSE_MAP;
        super({
            terminator: 0x50,
            padding: 0x50,
            bytesPerChar: 1,
            maxNickLen: isJapanese ? 5 : 10,
            maxOTLen: isJapanese ? 5 : 7,
            charMap,
            reverseMap
        });
        this.language = language;
    }
}
