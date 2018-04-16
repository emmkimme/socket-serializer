// import { Buffer } from 'buffer';
import { Reader, AdjustEnd } from './reader';

export class BufferReader extends Reader {
    private _offset: number;
    private _buffer: Buffer;

    constructor(buffer: Buffer, offset?: number) {
        super();
        this._buffer = buffer;
        this._offset = offset || 0;
    }

    get length(): number {
        return this._buffer.length;
    }

    get offset(): number {
        return this._offset;
    }

    seek(offset: number): boolean {
        this._offset = offset;
        return this.checkEOF();
    }

    private _readNumber(bufferFunction: (offset: number, noAssert?: boolean) => number, byteSize: number, noAssert?: boolean): number {
        let start = this._offset;
        this._offset += byteSize;
        return bufferFunction.call(this._buffer, start, noAssert);
    }

    readByte(noAssert?: boolean): number {
        return this._readNumber(Buffer.prototype.readUInt8, 1, noAssert);
    }

    readUInt32(noAssert?: boolean): number {
        return this._readNumber(Buffer.prototype.readUInt32LE, 4, noAssert);
    }

    readDouble(noAssert?: boolean): number {
        return this._readNumber(Buffer.prototype.readDoubleLE, 8, noAssert);
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
            return Buffer.alloc(0);
        }
        else {
            let start = this._offset;
            this._offset = end;
            return this._buffer.slice(start, end);
        }
    }
}

