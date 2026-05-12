/**
 * BinaryWriter.js — Unified binary data writer for all generations.
 * Provides a cursor-based API for writing multi-byte integers, BCD, GB strings,
 * and bitfields into Uint8Array buffers.
 */
export class BinaryWriter {
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

    seek(offset) { this._offset = offset; }
    skip(bytes) { this._offset += bytes; }

    writeUint8(value) {
        this._view[this._offset++] = value & 0xFF;
    }

    writeUint16BE(value) {
        this._view[this._offset++] = (value >> 8) & 0xFF;
        this._view[this._offset++] = value & 0xFF;
    }

    writeUint16LE(value) {
        this._view[this._offset++] = value & 0xFF;
        this._view[this._offset++] = (value >> 8) & 0xFF;
    }

    writeUint24BE(value) {
        this._view[this._offset++] = (value >> 16) & 0xFF;
        this._view[this._offset++] = (value >> 8) & 0xFF;
        this._view[this._offset++] = value & 0xFF;
    }

    writeUint32BE(value) {
        this._view[this._offset++] = (value >> 24) & 0xFF;
        this._view[this._offset++] = (value >> 16) & 0xFF;
        this._view[this._offset++] = (value >> 8) & 0xFF;
        this._view[this._offset++] = value & 0xFF;
    }

    writeUint32LE(value) {
        this._view[this._offset++] = value & 0xFF;
        this._view[this._offset++] = (value >> 8) & 0xFF;
        this._view[this._offset++] = (value >> 16) & 0xFF;
        this._view[this._offset++] = (value >> 24) & 0xFF;
    }

    writeBCD(value, length) {
        value = Math.max(0, Math.min(value, Math.pow(10, length * 2) - 1));
        for (let i = length - 1; i >= 0; i--) {
            const low = value % 10;
            value = Math.floor(value / 10);
            const high = value % 10;
            value = Math.floor(value / 10);
            this._view[this._offset + i] = ((high << 4) | low) & 0xFF;
        }
        this._offset += length;
    }

    writeBytes(data) {
        if (data instanceof Uint8Array) {
            this._view.set(data, this._offset);
        } else {
            for (let i = 0; i < data.length; i++) {
                this._view[this._offset + i] = data[i];
            }
        }
        this._offset += data.length;
    }

    writeByteAt(offset, value) {
        this._view[offset] = value & 0xFF;
    }

    writeUint16BEAt(offset, value) {
        this._view[offset] = (value >> 8) & 0xFF;
        this._view[offset + 1] = value & 0xFF;
    }

    writeUint16LEAt(offset, value) {
        this._view[offset] = value & 0xFF;
        this._view[offset + 1] = (value >> 8) & 0xFF;
    }

    writeUint24BEAt(offset, value) {
        this._view[offset] = (value >> 16) & 0xFF;
        this._view[offset + 1] = (value >> 8) & 0xFF;
        this._view[offset + 2] = value & 0xFF;
    }

    fillBytes(offset, length, value) {
        for (let i = 0; i < length; i++) {
            this._view[offset + i] = value & 0xFF;
        }
    }
}
