/**
 * Gen2TextCodec.js — Generation 2 text encoding/decoding.
 * Gen2 extends Gen1 encoding with language-specific tables and ligatures.
 * Languages: English, French/German, Italian/Spanish, Japanese, Korean.
 */
import { BaseTextCodec } from './BaseTextCodec.js';

// English character map for Gen2
const GEN2_EN_CHAR_MAP = {};
const GEN2_EN_REVERSE_MAP = {};

(function() {
    const m = GEN2_EN_CHAR_MAP;
    const r = GEN2_EN_REVERSE_MAP;

    m[0x50] = '\0'; // terminator
    m[0x4E] = '\n'; // line break (for mail)
    // Uppercase A-Z: 0x01-0x1A
    for (let i = 0; i < 26; i++) { m[0x01 + i] = String.fromCharCode(65 + i); }
    // Lowercase a-z: 0x21-0x3A
    for (let i = 0; i < 26; i++) { m[0x21 + i] = String.fromCharCode(97 + i); }
    // Digits 0-9: 0x3B-0x44 (note: é at 0x3B for some tables, adjusted)
    // Actually in Gen2 EN: 0-9 at 0x41-0x4A
    // Let's use the standard Gen2 EN table mapping
    m[0x3B] = 'é';
    // Space
    m[0x7F] = ' ';
    // Punctuation
    m[0x45] = '('; m[0x46] = ')'; m[0x47] = ':'; m[0x48] = ';';
    m[0x49] = '['; m[0x4A] = ']'; m[0x4B] = '.'; m[0x4C] = ',';
    m[0x4D] = '!'; m[0x4E] = '\n'; m[0x4F] = '?'; m[0x50] = '\0';
    m[0x51] = '.'; m[0x52] = '-'; m[0x53] = '..'; m[0x54] = '...';
    m[0x55] = "'"; m[0x56] = "'"; m[0x57] = '♂'; m[0x58] = '♀';
    m[0x59] = '¥'; m[0x5A] = '×'; m[0x5B] = '/'; m[0x5C] = ',';
    m[0x5D] = '*'; m[0x5E] = '#'; m[0x5F] = '@'; m[0x60] = '+';
    // Digits 0-9: 0x41-0x4A (overlapping with punctuation in some tables)
    // Actually the correct Gen2 table: digits at different offsets
    // Let me use the most common Gen2 English mapping:
    // 0x01-0x1A = A-Z, 0x21-0x3A = a-z, 0x3B-0x44 = 0-9 + special
    // Reset digits to correct positions
    for (let i = 0; i < 10; i++) { m[0x3C + i] = String.fromCharCode(48 + i); }
    // Ligatures (English apostrophe-before)
    m[0xD0] = "'d"; m[0xD1] = "'l"; m[0xD2] = "'m"; m[0xD3] = "'r";
    m[0xD4] = "'s"; m[0xD5] = "'t"; m[0xD6] = "'v";
    // PK MN symbols
    m[0xE1] = 'Pk'; m[0xE2] = 'Mn';

    // Build reverse map
    for (const [k, v] of Object.entries(m)) {
        if (v !== '\0' && v !== '\n' && !r[v]) r[v] = parseInt(k);
    }
    // Ensure single-char mappings
    r[' '] = 0x7F; r['?'] = 0x4F; r['!'] = 0x4D; r['.'] = 0x4B;
    r[','] = 0x4C; r["'"] = 0x55; r['-'] = 0x52; r['('] = 0x45;
    r[')'] = 0x46; r[':'] = 0x47; r[';'] = 0x48; r['*'] = 0x5D;
    r['#'] = 0x5E; r['/'] = 0x5B; r['+'] = 0x60; r['@'] = 0x5F;
    r['é'] = 0x3B; r['♂'] = 0x57; r['♀'] = 0x58;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(65 + i)] = 0x01 + i;
    for (let i = 0; i < 26; i++) r[String.fromCharCode(97 + i)] = 0x21 + i;
    for (let i = 0; i < 10; i++) r[String.fromCharCode(48 + i)] = 0x3C + i;
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
                // Italian/Spanish use similar table to French
                charMap = GEN2_FRE_CHAR_MAP;
                reverseMap = GEN2_FRE_REVERSE_MAP;
                break;
            default:
                charMap = GEN2_EN_CHAR_MAP;
                reverseMap = GEN2_EN_REVERSE_MAP;
        }

        super({
            terminator: 0x50,
            padding: 0x7F, // Gen2 pads with 0x7F (space)
            bytesPerChar: 1,
            maxNickLen: isJapanese ? 5 : 10,
            maxOTLen: isJapanese ? 5 : 7,
            charMap,
            reverseMap
        });
        this.language = language;
    }

    /**
     * Gen2-specific decode that handles ligatures and control codes.
     */
    decode(data, offset, maxLen) {
        const result = [];
        for (let i = 0; i < maxLen; i++) {
            const bytePos = offset + i;
            if (bytePos >= data.length) break;
            const value = data[bytePos];
            if (value === this.terminator) break;
            // Skip control codes 0x80-0x83
            if (value >= 0x80 && value <= 0x83) continue;
            const ch = this.charMap[value];
            if (ch === undefined) {
                result.push('?');
            } else if (ch !== '\0' && ch !== '\n') {
                result.push(ch);
            }
        }
        return result.join('');
    }
}
