/**
 * BaseTextCodec.js — Abstract base class for generation-specific text encoding/decoding.
 * All generation codecs inherit from this class and provide their own character maps.
 */
export class BaseTextCodec {
    constructor(config) {
        this.terminator = config.terminator ?? 0x50;
        this.padding = config.padding ?? 0x50;
        this.bytesPerChar = config.bytesPerChar ?? 1;
        this.maxNickLen = config.maxNickLen ?? 10;
        this.maxOTLen = config.maxOTLen ?? 7;
        this.charMap = config.charMap ?? {};
        this.reverseMap = config.reverseMap ?? {};
    }

    /**
     * Decode binary data to a string.
     * @param {Uint8Array} data - Raw binary data
     * @param {number} offset - Start offset
     * @param {number} maxLen - Maximum string length in characters
     * @returns {string}
     */
    decode(data, offset, maxLen) {
        const result = [];
        for (let i = 0; i < maxLen; i++) {
            const bytePos = offset + (i * this.bytesPerChar);
            if (bytePos >= data.length) break;

            let value;
            if (this.bytesPerChar === 1) {
                value = data[bytePos];
            } else {
                value = data[bytePos] | (data[bytePos + 1] << 8);
            }

            if (value === this.terminator) break;
            const ch = this.charMap[value];
            if (ch === undefined || ch === this.terminator) break;
            result.push(ch);
        }
        return result.join('');
    }

    /**
     * Encode a string to binary data.
     * @param {string} text - Text to encode
     * @param {number} maxLen - Maximum string length in characters
     * @returns {Uint8Array}
     */
    encode(text, maxLen) {
        const bufSize = maxLen * this.bytesPerChar;
        const buffer = new Uint8Array(bufSize);
        // Fill with padding
        buffer.fill(this.padding);

        if (!text || text.length === 0) {
            if (this.bytesPerChar === 1) {
                buffer[0] = this.terminator;
            } else {
                buffer[0] = this.terminator & 0xFF;
                buffer[1] = (this.terminator >> 8) & 0xFF;
            }
            return buffer;
        }

        let pos = 0;
        for (let i = 0; i < text.length && i < maxLen; i++) {
            const ch = text[i];
            const byteVal = this.reverseMap[ch];
            if (byteVal === undefined) {
                // Try uppercase fallback
                const upper = ch.toUpperCase();
                const upperVal = this.reverseMap[upper];
                if (upperVal !== undefined) {
                    this._writeUnit(buffer, pos, upperVal);
                    pos += this.bytesPerChar;
                }
                continue;
            }
            this._writeUnit(buffer, pos, byteVal);
            pos += this.bytesPerChar;
        }

        // Write terminator after last character
        if (pos < bufSize) {
            this._writeUnit(buffer, pos, this.terminator);
        }

        return buffer;
    }

    _writeUnit(buffer, pos, value) {
        if (this.bytesPerChar === 1) {
            buffer[pos] = value & 0xFF;
        } else {
            buffer[pos] = value & 0xFF;
            buffer[pos + 1] = (value >> 8) & 0xFF;
        }
    }

    /**
     * Check if a character is valid in this encoding.
     * @param {string} ch - Character to check
     * @returns {boolean}
     */
    isValidChar(ch) {
        return this.reverseMap[ch] !== undefined || this.reverseMap[ch.toUpperCase()] !== undefined;
    }
}
