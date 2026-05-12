/**
 * BinaryReader.js — Unified binary data reader for all generations.
 * Provides a cursor-based API for reading multi-byte integers, BCD, GB strings,
 * and bitfields from Uint8Array buffers.
 */
export class BinaryReader {
    constructor(buffer, offset = 0) {
        if (buffer instanceof Uint8Array) {
            this._view = buffer;
        } else {
            this._view = new Uint8Array(buffer);
        }
        this._offset = offset;
    }

    get offset() { return this._offset; }
    get length() { return this._view.length; }
    get remaining() { return this._view.length - this._offset; }

    seek(offset) { this._offset = offset; }
    skip(bytes) { this._offset += bytes; }

    readUint8() {
        const v = this._view[this._offset++];
        return v;
    }

    readUint16BE() {
        const v = (this._view[this._offset] << 8) | this._view[this._offset + 1];
        this._offset += 2;
        return v >>> 0;
    }

    readUint16LE() {
        const v = this._view[this._offset] | (this._view[this._offset + 1] << 8);
        this._offset += 2;
        return v >>> 0;
    }

    readUint24BE() {
        const v = (this._view[this._offset] << 16) | (this._view[this._offset + 1] << 8) | this._view[this._offset + 2];
        this._offset += 3;
        return v >>> 0;
    }

    readUint32BE() {
        const v = (this._view[this._offset] << 24) | (this._view[this._offset + 1] << 16) | (this._view[this._offset + 2] << 8) | this._view[this._offset + 3];
        this._offset += 4;
        return v >>> 0;
    }

    readUint32LE() {
        const v = this._view[this._offset] | (this._view[this._offset + 1] << 8) | (this._view[this._offset + 2] << 16) | (this._view[this._offset + 3] << 24);
        this._offset += 4;
        return v >>> 0;
    }

    readBCD(length) {
        let result = 0;
        let multiplier = 1;
        for (let i = length - 1; i >= 0; i--) {
            const byte = this._view[this._offset + i];
            const low = byte & 0x0F;
            const high = (byte >> 4) & 0x0F;
            if (low > 9 || high > 9) return 0; // Invalid BCD
            result += low * multiplier;
            multiplier *= 10;
            result += high * multiplier;
            multiplier *= 10;
        }
        this._offset += length;
        return result;
    }

    readBytes(length) {
        const slice = this._view.slice(this._offset, this._offset + length);
        this._offset += length;
        return slice;
    }

    readByteAt(offset) {
        return this._view[offset];
    }

    readUint16BEAt(offset) {
        return ((this._view[offset] << 8) | this._view[offset + 1]) >>> 0;
    }

    readUint24BEAt(offset) {
        return ((this._view[offset] << 16) | (this._view[offset + 1] << 8) | this._view[offset + 2]) >>> 0;
    }
}
