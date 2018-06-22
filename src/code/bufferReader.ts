// import { Buffer } from 'buffer';
import { ReaderBase, AdjustEnd } from './reader';

export class BufferReader extends ReaderBase {
    private _offset: number;
    private _buffer: Buffer;
    private _contexts: number[];

    constructor(buffer: Buffer, offset?: number) {
        super();

        this._buffer = buffer;
        this._offset = offset || 0;
        this._contexts = [];
    }

    get length(): number {
        return this._buffer.length;
    }

    get offset(): number {
        return this._offset;
    }

    pushd(): number {
        this._contexts.push(this._offset);
        return this._contexts.length;
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
        let start = this._offset;
        this._offset += byteSize;
        return bufferFunction.call(this._buffer, start, this._noAssert);
    }

    readByte(): number {
        return this._readNumber(Buffer.prototype.readUInt8, 1);
    }

    readUInt32(): number {
        return this._readNumber(Buffer.prototype.readUInt32LE, 4);
    }

    readDouble(): number {
        return this._readNumber(Buffer.prototype.readDoubleLE, 8);
    }

    readString(encoding?: string, len?: number): string {
        let end = AdjustEnd(this._offset, this._buffer.length, len);
        if (this._offset === end) {
            return '';
        }
        else {
            let start = this._offset;
            this._offset = end;
            return this._buffer.toString(encoding, start, end);
        }
    }

    readBuffer(len?: number): Buffer {
        let end = AdjustEnd(this._offset, this._buffer.length, len);
        if (this._offset === end) {
            return Buffer.allocUnsafe(0);
        }
        else {
            let start = this._offset;
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

    reduce(): void {
        // Till now, do nothing 
        // Either a conservative slice or a destructive copy to implement ?

        // let start = this._offset;
        // this._offset = 0;
        // this._buffer = this._buffer.slice(start);
    }
}

