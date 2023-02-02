import { Buffer } from 'buffer';
import { Reader, ReaderBase } from './reader';

export class BufferReader extends ReaderBase {
    private _buffer: Buffer;
    private _contexts: number[];

    constructor(buffer: Buffer, offset?: number) {
        super(offset);

        this._buffer = buffer || ReaderBase.EmptyBuffer;
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
        if ((offset < 0) || (offset >= this._buffer.length)) {
            if (!this._noAssert) {
                throw new RangeError('Index out of range');
            }
            return false;
        }
        this._offset = offset;
        return true;
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
            return this._decodeString(this._buffer, start, end);
        }
    }

    slice(len?: number): Buffer {
        const buffer = this._buffer.slice(this._offset, this._offset + len);
        this._offset += buffer.length;
        return buffer;
        // const end = Reader.AdjustEnd(this._offset, this._buffer.length, len);
        // if (this._offset === end) {
        //     return ReaderBase.EmptyBuffer;
        // }
        // else {
        //     const start = this._offset;
        //     len = end - this._offset;
        //     this._offset = end;
        //     if ((start === 0) && (len === this._buffer.length)) {
        //         return this._buffer;
        //     }
        //     else {
        //         return this._buffer.slice(start, end);
        //     }
        // }
    }

    readBuffer(len?: number): Buffer {
        const buffer = this._buffer.subarray(this._offset, this._offset + len);
        this._offset += buffer.length;
        return buffer;
        // const end = Reader.AdjustEnd(this._offset, this._buffer.length, len);
        // if (this._offset === end) {
        //     return ReaderBase.EmptyBuffer;
        // }
        // else {
        //     const start = this._offset;
        //     len = end - this._offset;
        //     this._offset = end;
        //     // return Buffer.from(this._buffer, this._buffer.byteOffset + start, len);
        //     return this._buffer.subarray(start, start + len);
        // }
    }

    readBufferList(len?: number): Buffer[] {
        return [this.readBuffer(len)];
    }
 
    readArrayBuffer(len?: number): ArrayBuffer {
        const buffer = this.readBuffer(len);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + len);
        return arrayBuffer;
    }

    reduce(): void {
        // Till now, do nothing 
        // Either a conservative slice or a destructive copy to implement ?

        // let start = this._offset;
        // this._offset = 0;
        // this._buffer = this._buffer.slice(start);
    }
}

