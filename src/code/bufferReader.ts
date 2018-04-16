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

    readByte(noAssert?: boolean): number {
        let start = this._offset;
        ++this._offset;
        return this._buffer.readUInt8(start, noAssert);
    }

    readUInt32(noAssert?: boolean): number {
        let start = this._offset;
        this._offset += 4;
        return this._buffer.readUInt32LE(start, noAssert);
    }

    readDouble(noAssert?: boolean): number {
        let start = this._offset;
        this._offset += 8;
        return this._buffer.readDoubleLE(start, noAssert);
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

