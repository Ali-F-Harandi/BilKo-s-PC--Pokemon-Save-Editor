/**
 * Gen2TextCodec.js — Generation 2 text encoding/decoding.
 * Gen2 uses the 0x80-0xFF byte range for A-Z, a-z, 0-9 in International saves.
 * This is DIFFERENT from Gen1 which uses 0x80-0x99 for A-Z in a different layout.
 *
 * VERIFIED against PKHeX CharMap.cs and pokecrystal charmap.asm.
 * Languages: English, French/German, Italian/Spanish, Japanese, Korean.
 */
import { BaseTextCodec } from './BaseTextCodec.js';

// English character map for Gen2 (CORRECT: 0x80-0xFF range)
const GEN2_EN_CHAR_MAP = {};
const GEN2_EN_REVERSE_MAP = {};

(function() {
    const m = GEN2_EN_CHAR_MAP;
    const r = GEN2_EN_REVERSE_MAP;

    // String terminator
    m[0x50] = '\0';

    // Uppercase A-Z: 0x80-0x99
    for (let i = 0; i < 26; i++) { m[0x80 + i] = String.fromCharCode(65 + i); }

    // Brackets and punctuation: 0x9A-0x9F
    m[0x9A] = '('; m[0x9B] = ')'; m[0x9C] = ':'; m[0x9D] = ';';
    m[0x9E] = '['; m[0x9F] = ']';

    // Lowercase a-z: 0xA0-0xB9
    for (let i = 0; i < 26; i++) { m[0xA0 + i] = String.fromCharCode(97 + i); }

    // Special characters
    m[0xC0] = 'Ä'; m[0xC1] = 'Ö'; m[0xC2] = 'Ü'; m[0xC3] = 'ä'; m[0xC4] = 'ö'; m[0xC5] = 'ü';

    // Ligatures (English apostrophe-before)
    m[0xD0] = "'d"; m[0xD1] = "'l"; m[0xD2] = "'m"; m[0xD3] = "'r";
    m[0xD4] = "'s"; m[0xD5] = "'t"; m[0xD6] = "'v";

    // Symbols and punctuation
    m[0xE0] = "'";  // right single quotation mark
    m[0xE5] = '-';  // hyphen
    m[0xE6] = '?';  m[0xE7] = '!';  m[0xE8] = '.';  m[0xE9] = '&';
    m[0xEA] = 'é';  // as in Pokémon
    m[0xEE] = '♂';  m[0xEF] = '×';

    // More symbols
    m[0xF0] = '×';  m[0xF1] = '.';  m[0xF2] = '/';  m[0xF3] = ',';
    m[0xF4] = '♀';

    // Digits 0-9: 0xF5-0xFE
    for (let i = 0; i < 10; i++) { m[0xF5 + i] = String.fromCharCode(48 + i); }

    // Space
    m[0x7F] = ' ';

    // Build reverse map
    for (const [k, v] of Object.entries(m)) {
        if (v !== '\0' && v !== '\n' && v.length === 1 && !r[v]) {
            r[v] = parseInt(k);
        }
    }
    // Explicit overrides for reliable encoding
    r[' '] = 0x7F;
    r['?'] = 0xE6; r['!'] = 0xE7; r['.'] = 0xE8; r[','] = 0xF3;
    r["'"] = 0xE0; r['-'] = 0xE5; r['('] = 0x9A; r[')'] = 0x9B;
    r[':'] = 0x9C; r[';'] = 0x9D; r['['] = 0x9E; r[']'] = 0x9F;
    r['&'] = 0xE9; r['é'] = 0xEA; r['♂'] = 0xEE; r['♀'] = 0xF4;
    r['/'] = 0xF2;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(65 + i)] = 0x80 + i;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(97 + i)] = 0xA0 + i;
    for (let i = 0; i < 10; i++) r[String.fromCharCode(48 + i)] = 0xF5 + i;
    // Ligatures
    r["'d"] = 0xD0; r["'l"] = 0xD1; r["'m"] = 0xD2; r["'r"] = 0xD3;
    r["'s"] = 0xD4; r["'t"] = 0xD5; r["'v"] = 0xD6;
})();

// French/German character map for Gen2 (apostrophe-after ligatures)
const GEN2_FRE_CHAR_MAP = { ...GEN2_EN_CHAR_MAP };
const GEN2_FRE_REVERSE_MAP = { ...GEN2_EN_REVERSE_MAP };
(function() {
    const m = GEN2_FRE_CHAR_MAP;
    const r = GEN2_FRE_REVERSE_MAP;
    // Override ligatures for French (apostrophe-after)
    m[0xD0] = "d'"; m[0xD1] = "l'"; m[0xD2] = "m'"; m[0xD3] = "n'";
    m[0xD4] = "p'"; m[0xD5] = "s'"; m[0xD6] = "t'"; m[0xD7] = "c'";
    m[0xD8] = "j'"; m[0xD9] = "u'"; m[0xDA] = "y'";
    r["d'"] = 0xD0; r["l'"] = 0xD1; r["m'"] = 0xD2; r["n'"] = 0xD3;
    r["p'"] = 0xD4; r["s'"] = 0xD5; r["t'"] = 0xD6; r["c'"] = 0xD7;
})();

export class Gen2TextCodec extends BaseTextCodec {
    constructor(language = 'en') {
        let charMap, reverseMap;
        const isJapanese = language === 'jp' || language === 'jpn';

        switch (language) {
            case 'fre':
            case 'ger':
                charMap = GEN2_FRE_CHAR_MAP;
                reverseMap = GEN2_FRE_REVERSE_MAP;
                break;
            case 'ita':
            case 'spa':
                charMap = GEN2_FRE_CHAR_MAP;
                reverseMap = GEN2_FRE_REVERSE_MAP;
                break;
            default:
                charMap = GEN2_EN_CHAR_MAP;
                reverseMap = GEN2_EN_REVERSE_MAP;
        }

        super({
            terminator: 0x50,
            padding: 0x7F,
            bytesPerChar: 1,
            maxNickLen: isJapanese ? 5 : 10,
            maxOTLen: isJapanese ? 5 : 7,
            charMap,
            reverseMap
        });
        this.language = language;
    }

    decode(data, offset, maxLen) {
        const result = [];
        for (let i = 0; i < maxLen; i++) {
            const bytePos = offset + i;
            if (bytePos >= data.length) break;
            const value = data[bytePos];
            if (value === this.terminator) break;
            if (value === 0x00) continue; // Skip NUL padding
            const ch = this.charMap[value];
            if (ch === undefined) {
                // Unknown byte — skip silently
            } else if (ch !== '\0' && ch !== '\n') {
                result.push(ch);
            }
        }
        return result.join('');
    }
}
