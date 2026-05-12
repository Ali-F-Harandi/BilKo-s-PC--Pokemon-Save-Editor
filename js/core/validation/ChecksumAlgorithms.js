/**
 * ChecksumAlgorithms.js — Pluggable checksum algorithm implementations.
 * Used by all generation validators and writers.
 */
export class ChecksumAlgorithms {
    /**
     * Gen1: 8-bit 1's complement sum.
     * Sum all bytes from start to end (inclusive), then invert.
     * Result is (sum & 0xFF) inverted = (~sum) & 0xFF
     */
    static add8(view, start, end) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            sum += view[i];
        }
        return (~sum) & 0xFF;
    }

    /**
     * Validate an 8-bit checksum.
     */
    static validateAdd8(view, start, end, checksumOffset) {
        const calculated = ChecksumAlgorithms.add8(view, start, end);
        return calculated === (view[checksumOffset] & 0xFF);
    }

    /**
     * Gen2: Plain 16-bit additive sum, stored little-endian.
     * This is NOT 1's complement — just a direct sum.
     */
    static add16LE(view, start, end) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            sum += view[i];
        }
        return (sum & 0xFFFF) >>> 0;
    }

    /**
     * Validate a 16-bit LE checksum.
     */
    static validateAdd16LE(view, start, end, checksumOffset) {
        const calculated = ChecksumAlgorithms.add16LE(view, start, end);
        const storedLow = view[checksumOffset];
        const storedHigh = view[checksumOffset + 1];
        const stored = ((storedHigh << 8) | storedLow) >>> 0;
        return calculated === stored;
    }

    /**
     * Write a 16-bit LE checksum to the save data.
     */
    static writeAdd16LE(view, start, end, checksumOffset) {
        const checksum = ChecksumAlgorithms.add16LE(view, start, end);
        view[checksumOffset] = checksum & 0xFF;
        view[checksumOffset + 1] = (checksum >> 8) & 0xFF;
        return checksum;
    }

    /**
     * Write an 8-bit checksum to the save data.
     */
    static writeAdd8(view, start, end, checksumOffset) {
        const checksum = ChecksumAlgorithms.add8(view, start, end);
        view[checksumOffset] = checksum & 0xFF;
        return checksum;
    }
}
