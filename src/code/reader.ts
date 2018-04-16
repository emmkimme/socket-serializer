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

export abstract class Reader {
    readonly length: number;
    readonly offset: number;

    checkEOF(offsetStep?: number): boolean {
        return (this.offset + (offsetStep || 0) > this.length);
    }

    skip(offsetStep?: number): boolean {
        return this.seek(this.offset + (offsetStep || 1));
    }

    abstract seek(offset: number): boolean;
    abstract readByte(noAssert?: boolean): number;
    abstract readUInt32(noAssert?: boolean): number;
    abstract readDouble(noAssert?: boolean): number;
    abstract readString(encoding?: string, len?: number): string;
    abstract readBuffer(len?: number): Buffer;
}

