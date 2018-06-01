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
    noAssert: boolean;

    checkEOF(offsetStep?: number): boolean;
    skip(offsetStep?: number): boolean;
    seek(offset: number): boolean;
    readByte(): number;
    readUInt32(): number;
    readDouble(): number;
    readString(encoding?: string, len?: number): string;
    readBuffer(len?: number): Buffer;
}

// Implement common methods
export abstract class ReaderBase implements Reader {
    protected _noAssert: boolean;

    constructor() {
        this._noAssert = true;
    }

    get noAssert(): boolean {
        return this._noAssert;
    }

    set noAssert(noAssert: boolean) {
        this._noAssert = noAssert;
    }

    checkEOF(offsetStep?: number): boolean {
        return (this.offset + (offsetStep || 0) > this.length);
    }

    skip(offsetStep?: number): boolean {
        return this.seek(this.offset + (offsetStep || 1));
    }

    readonly length: number;
    readonly offset: number;

    abstract seek(offset: number): boolean;
    abstract readByte(): number;
    abstract readUInt32(): number;
    abstract readDouble(): number;
    abstract readString(encoding?: string, len?: number): string;
    abstract readBuffer(len?: number): Buffer;
}
