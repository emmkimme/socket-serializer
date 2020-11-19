// import { Buffer } from 'buffer';
import { Reader, ReaderBase } from './reader';

export class BufferReader extends ReaderBase {
    private _buffer: Buffer;
    private _contexts: number[];

    constructor(buffer: Buffer, offset?: number) {
        super(offset);

        this._buffer = buffer;
        this._contexts = [];
    }

    reset(): void {
        super.reset();

        this._buffer = ReaderBase.EmptyBuffer;
        this._contexts = [];
    }

    get length(): number {
        return this._buffer.length;
    }

    pushd(): number {
        return this._contexts.push(this._offset);
    }

    popd(): number {
        this._offset = this._contexts.pop();
        return this._contexts.length;
    }

    seek(offset: number): boolean {
        this._offset = offset;
        return this.checkEOF();
    }

    private _readNumber(bufferFunction: (offset: number, noAssert?: boolean) => number, byteSize: number): number {
        const start = this._offset;
        this._offset += byteSize;
        return bufferFunction.call(this._buffer, start, this._noAssert);
    }

    readByte(): number {
        return this._buffer[this._offset++];
    }

    readUInt16(): number {
        return this._readNumber(Buffer.prototype.readUInt16LE, 2);
    }

    readUInt32(): number {
        return this._readNumber(Buffer.prototype.readUInt32LE, 4);
    }

    readDouble(): number {
        return this._readNumber(Buffer.prototype.readDoubleLE, 8);
    }

    readString(encoding?: BufferEncoding, len?: number): string {
        const end = Reader.AdjustEnd(this._offset, this._buffer.length, len);
        if (this._offset === end) {
            return '';
        }
        else {
            const start = this._offset;
            this._offset = end;
            return this._buffer.toString(encoding, start, end);
        }
    }

    slice(len?: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._buffer.length, len);
        if (this._offset === end) {
            return Buffer.allocUnsafe(0);
        }
        else {
            const start = this._offset;
            len = end - this._offset;
            this._offset = end;
            if ((start === 0) && (len === this._buffer.length)) {
                return this._buffer;
            }
            else {
                return this._buffer.slice(start, end);
            }
        }
    }

    subarray(len?: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._buffer.length, len);
        if (this._offset === end) {
            return Buffer.alloc(0);
        }
        else {
            const start = this._offset;
            len = end - this._offset;
            this._offset = end;
            return Buffer.from(this._buffer, this._buffer.byteOffset + start, len);
        }
    }
 
    reduce(): void {
        // Till now, do nothing 
        // Either a conservative slice or a destructive copy to implement ?

        // let start = this._offset;
        // this._offset = 0;
        // this._buffer = this._buffer.slice(start);
    }
}

