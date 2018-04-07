// import { Buffer } from 'buffer';
import { Reader, AdjustEnd } from './reader';

export class BufferReader implements Reader {
    private _offset: number;
    private _buffer: Buffer;

    constructor(buffer: Buffer, offset?: number) {
        this._buffer = buffer;
        this._offset = offset || 0;
    }

    checkEOF(offsetStep?: number): boolean {
        return (this._offset + (offsetStep || 0) > this._buffer.length);
    }

    get length(): number {
        return this._buffer.length;
    }

    get offset(): number {
        return this._offset;
    }

    seek(offset: number): number {
        return this._offset = offset;
    }

    skip(offsetStep?: number): number {
        offsetStep = offsetStep || 1;
        this._offset += offsetStep;
        return this.offset;
    }

    readByte(): number {
        return this._buffer[this._offset++];
    }

    readUInt32(): number {
        let start = this._offset;
        this._offset += 4;
        return this._buffer.readUInt32LE(start);
    }

    readDouble(): number {
        let start = this._offset;
        this._offset += 8;
        return this._buffer.readDoubleLE(start);
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

