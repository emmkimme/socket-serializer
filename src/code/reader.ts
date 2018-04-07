// import { Buffer } from 'buffer';

export function AdjustEnd(offset: number, maxLen: number, len?: number): number {
    let end: number;
    // Check null/undefined case first
    if (len == null) {
        end = maxLen;
    }
    else if (len <= 0) {
        end = offset;
    }
    else {
        end = Math.min(offset + len, maxLen);
    }
    return end;
}

export interface Reader {
    readonly length: number;
    readonly offset: number;

    checkEOF(offsetStep?: number): boolean;
    seek(offset: number): number;
    skip(offsetStep?: number): number;
    readByte(): number;
    readUInt32(): number;
    readDouble(): number;
    readString(encoding?: string, len?: number): string;
    readBuffer(len?: number): Buffer;
}

