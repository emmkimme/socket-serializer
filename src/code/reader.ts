// import { Buffer } from 'buffer';

export namespace Reader {
    export function AdjustEnd(offset: number, maxLen: number, len?: number): number {
        // Check null/undefined case first
        if (len == null) {
            return maxLen;
        }
        else if (len <= 0) {
            return offset;
        }
        else {
            offset += len;
            if (offset > maxLen) {
                return maxLen;
            }
            return offset;
        }
    }
}

export interface ReaderContext {
    offset: number;
}

export interface Reader {
    readonly length: number;
    readonly offset: number;
    noAssert: boolean;

    reset(): void;

    getContext(): ReaderContext;
    setContext(context: ReaderContext): void;

    pushd(): number;
    popd(): number;

    checkEOF(offsetStep?: number): boolean;
    skip(offsetStep?: number): boolean;
    seek(offset: number): boolean;

    readByte(): number;
    readUInt16(): number;
    readUInt32(): number;
    readDouble(): number;
    readString(encoding?: BufferEncoding, len?: number): string;
    subarray(len?: number): Buffer;
    slice(len?: number): Buffer;

    reduce(): void;
}

// Implement common methods
export abstract class ReaderBase implements Reader {
    protected static EmptyBuffer = Buffer.allocUnsafe(0);

    protected _noAssert: boolean;
    protected _offset: number;

    constructor(offset?: number) {
        this._offset = offset || 0;
        this._noAssert = true;
    }

    abstract get length(): number;

    getContext(): ReaderContext {
        return { offset: this._offset };
    }

    setContext(context: ReaderContext): void {
        this._offset = context.offset;
    }

    get offset(): number {
        return this._offset;
    }

    get noAssert(): boolean {
        return this._noAssert;
    }

    set noAssert(noAssert: boolean) {
        this._noAssert = noAssert;
    }

    reset(): void {
        this._offset = 0;
    }

    checkEOF(offsetStep?: number): boolean {
        return (this._offset + (offsetStep || 0) > this.length);
    }

    skip(offsetStep?: number): boolean {
        return this.seek(this._offset + (offsetStep || 1));
    }

    abstract pushd(): number;
    abstract popd(): number;
    abstract seek(offset: number): boolean;
    abstract readByte(): number;
    abstract readUInt16(): number;
    abstract readUInt32(): number;
    abstract readDouble(): number;
    abstract readString(encoding?: BufferEncoding, len?: number): string;
    
    abstract subarray(len?: number): Buffer;
    abstract subarrayList(len?: number): Buffer[];

    abstract slice(len?: number): Buffer;

    abstract reduce(): void;
}
