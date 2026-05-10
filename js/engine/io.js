/**
 * io.js — Binary Writer Utility
 *
 * Ported from lib/utils/io.ts
 * Seekable binary writer for constructing save files.
 */

export class BinaryWriter {
  /**
   * @param {number|Uint8Array} sizeOrBuffer - Buffer size or existing Uint8Array
   */
  constructor(sizeOrBuffer) {
    if (typeof sizeOrBuffer === 'number') {
      this._buffer = new Uint8Array(sizeOrBuffer);
    } else {
      this._buffer = sizeOrBuffer; // Edit in place or copy
    }
    this._view = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
    this._offset = 0;
  }

  /** Seek to a specific position */
  seek(offset) {
    this._offset = offset;
  }

  /** Current write position */
  tell() {
    return this._offset;
  }

  /** Get the underlying buffer */
  getBuffer() {
    return this._buffer;
  }

  /** Write a single byte */
  u8(value) {
    this._view.setUint8(this._offset++, value);
  }

  /** Write a big-endian uint16 */
  u16be(value) {
    this._view.setUint16(this._offset, value, false); // Big Endian
    this._offset += 2;
  }

  /** Write a big-endian uint24 */
  u24be(value) {
    this.u8((value >> 16) & 0xFF);
    this.u8((value >> 8) & 0xFF);
    this.u8(value & 0xFF);
  }

  /** Write Binary Coded Decimal */
  bcd(value, length) {
    // Clamp value to maximum representable BCD for the given length
    // 3 bytes = max 999999, 2 bytes = max 9999
    const maxBcd = Math.pow(10, length * 2) - 1;
    let temp = Math.max(0, Math.min(Math.floor(value), maxBcd));
    const start = this._offset;
    for (let i = length - 1; i >= 0; i--) {
      const lower = temp % 10;
      temp = Math.floor(temp / 10);
      const upper = temp % 10;
      temp = Math.floor(temp / 10);
      this._view.setUint8(start + i, (upper << 4) | lower);
    }
    this._offset += length;
  }

  /** Write raw bytes */
  bytes(data) {
    if (data instanceof Uint8Array) {
      this._buffer.set(data, this._offset);
    } else {
      this._buffer.set(new Uint8Array(data), this._offset);
    }
    this._offset += data.length;
  }

  /** Write Gen 1 encoded string */
  string(str, maxLength, terminator = 0x50) {
    const CHAR_MAP_REV = {
      'A': 0x80, 'B': 0x81, 'C': 0x82, 'D': 0x83, 'E': 0x84, 'F': 0x85, 'G': 0x86, 'H': 0x87,
      'I': 0x88, 'J': 0x89, 'K': 0x8A, 'L': 0x8B, 'M': 0x8C, 'N': 0x8D, 'O': 0x8E, 'P': 0x8F,
      'Q': 0x90, 'R': 0x91, 'S': 0x92, 'T': 0x93, 'U': 0x94, 'V': 0x95, 'W': 0x96, 'X': 0x97,
      'Y': 0x98, 'Z': 0x99, '(': 0x9A, ')': 0x9B, ':': 0x9C, ';': 0x9D, '[': 0x9E, ']': 0x9F,
      'a': 0xA0, 'b': 0xA1, 'c': 0xA2, 'd': 0xA3, 'e': 0xA4, 'f': 0xA5, 'g': 0xA6, 'h': 0xA7,
      'i': 0xA8, 'j': 0xA9, 'k': 0xAA, 'l': 0xAB, 'm': 0xAC, 'n': 0xAD, 'o': 0xAE, 'p': 0xAF,
      'q': 0xB0, 'r': 0xB1, 's': 0xB2, 't': 0xB3, 'u': 0xB4, 'v': 0xB5, 'w': 0xB6, 'x': 0xB7,
      'y': 0xB8, 'z': 0xB9, ' ': 0x7F, '?': 0xE6, '!': 0xE7, '.': 0xE8, '-': 0xE3,
      '0': 0xF6, '1': 0xF7, '2': 0xF8, '3': 0xF9, '4': 0xFA, '5': 0xFB, '6': 0xFC, '7': 0xFD, '8': 0xFE, '9': 0xFF
    };

    for (let i = 0; i < maxLength; i++) {
      if (i < str.length) {
        const char = str[i];
        this.u8(CHAR_MAP_REV[char] !== undefined ? CHAR_MAP_REV[char] : 0xE6);
      } else {
        this.u8(terminator);
      }
    }
  }
}
