import { Buffer } from 'buffer';
import { Reader, ReaderBase } from './reader';

export namespace BufferListReader {
    export interface Context {
        offset: number;
        curBufferIndex: number;
        curOffset: number;
        rebuild?: boolean;
    }
}

export class BufferListReader extends ReaderBase {
    static readonly ReduceThreshold = 100000; // in bytes

    private _length: number;
    private _buffers: Buffer[];
    private _curBufferIndex: number;
    private _curOffset: number;
    private _contexts: BufferListReader.Context[];

    constructor(buffers?: Buffer[], offset?: number) {
        super(0);

        this._contexts = [];

        this._buffers = buffers || [];
        // Sum all the buffers length
        this._length = this._buffers.reduce((sum, buffer) => sum + buffer.length, 0);

        this._curOffset = 0;
        this._curBufferIndex = 0;
        this.seek(offset || 0);
    }

    reset(): void {
        super.reset();

        this._contexts = [];

        this._buffers = [];
        this._length = 0;
        this._curOffset = 0;
        this._curBufferIndex = 0;
    }

    appendBuffer(buffer: Buffer): void {
        this._buffers.push(buffer);
        this._length += buffer.length;
    }

    get length(): number {
        return this._length;
    }

    pushd(): number {
        return this._contexts.push({ offset: this._offset, curOffset: this._curOffset, curBufferIndex: this._curBufferIndex });
    }

    popd(): number {
        // ({ offset: this._offset, curOffset: this._curOffset, curBufferIndex: this._curBufferIndex } = this._contexts.pop());
        const context = this._contexts.pop()
        if (!context.rebuild) {
            this._offset = context.offset;
            this._curBufferIndex = context.curBufferIndex;
            this._curOffset = context.curOffset;
        }
        else {
            if (context.offset < (this._length >> 1)) {
                this._offset = 0;
                this._curBufferIndex = 0;
                this._curOffset = 0;
            }
            else {
                this._offset = this._length - 1;
                this._curBufferIndex = this._buffers.length - 1;
                this._curOffset = this._buffers[this._curBufferIndex].length - 1;
            }
            this.seek(context.offset);
        }
        return this._contexts.length;
    }

    seek(offset: number): boolean {
        if (this._offset !== offset) {
            let curBuffer = this._buffers[this._curBufferIndex];
            this._curOffset += (offset - this._offset);
            this._offset = offset;
            while (this._curOffset >= curBuffer.length) {
                if (this._curBufferIndex >= this._buffers.length - 1) {
                    if (!this._noAssert) {
                        throw new RangeError('Index out of range');
                    }
                    return false;
                }
                this._curOffset -= curBuffer.length;
                ++this._curBufferIndex;
                curBuffer = this._buffers[this._curBufferIndex];
            }
            while (this._curOffset < 0) {
                if (this._curBufferIndex <= 0) {
                    if (!this._noAssert) {
                        throw new RangeError('Index out of range');
                    }
                    return false;
                }
                --this._curBufferIndex;
                curBuffer = this._buffers[this._curBufferIndex];
                this._curOffset += curBuffer.length;
            }
        }
        return this.checkEOF();
    }

    reduce() {
        if (this.checkEOF(1)) {
            this.reset();
        }
        else {
            if (this._curBufferIndex > 0) {
                this._buffers.splice(0, this._curBufferIndex);
                this._length -= (this._offset - this._curOffset);
                this._offset = this._curOffset;
                this._curBufferIndex = 0;
            }
            // 'consolidate' may accumulate data in a single buffer which may growing up and growing.....
            // So we have to explicitely/physically reduce it
            if (this._buffers.length >= 0) {
                const curBuffer = this._buffers[0];
                if ((curBuffer.length > BufferListReader.ReduceThreshold) && (this._curOffset > (curBuffer.length >> 1))) {
                // if (this._curOffset > (curBuffer.length >> 1)) {
                    const newBuffer = Buffer.allocUnsafe(curBuffer.length - this._curOffset);
                    curBuffer.copy(newBuffer, 0, this._curOffset);
                    this._buffers[0] = newBuffer;
                    this._length -= this._curOffset;
                    this._offset -= this._curOffset;
                    this._curOffset = 0;
                }
            }
        }
    }

    private _consolidate(len: number): Buffer {
        let curBuffer = this._buffers[this._curBufferIndex];
        let newOffset = this._curOffset + len;
        if (newOffset > curBuffer.length) {
            let bufferLength = 0;
            const buffers = [];
            for (let endBufferIndex = this._curBufferIndex, l = this._buffers.length; endBufferIndex < l; ++endBufferIndex) {
                buffers.push(this._buffers[endBufferIndex]);
                bufferLength += this._buffers[endBufferIndex].length;
                if (newOffset <= bufferLength) {
                    break;
                }
            }
            curBuffer = this._buffers[this._curBufferIndex] = Buffer.concat(buffers, bufferLength);
            this._buffers.splice(this._curBufferIndex + 1, buffers.length - 1);
            if (!this._noAssert && (newOffset > curBuffer.length)) {
                // throw new RangeError('Index out of range');
            }
            let index = this._contexts.length;
            while (index) {
                const context = this._contexts[--index];
                context.rebuild = context.rebuild || (context.curBufferIndex > this._curBufferIndex);
            }
        }
        else if (newOffset === curBuffer.length) {
            ++this._curBufferIndex;
            newOffset = 0;
        }
        this._offset += len;
        this._curOffset = newOffset;
        return curBuffer;
    }

    private _readNumber(bufferFunction: (offset: number, noAssert?: boolean) => number, byteSize: number): number {
        const start = this._curOffset;
        const currBuffer = this._consolidate(byteSize);
        return bufferFunction.call(currBuffer, start, this._noAssert);
    }

    readByte(): number {
        return this._readNumber(Buffer.prototype.readUInt8, 1);
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
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return '';
        }
        else {
            const start = this._curOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            return currBuffer.toString(encoding, start, end);
        }
    }

    subarray(len: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return Buffer.alloc(0);
        }
        else {
            const start = this._curOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            if ((start === 0) && (len === currBuffer.length)) {
                return currBuffer;
            }
            else {
                return Buffer.from(currBuffer.buffer, currBuffer.byteOffset + start, len);
            }
        }
    }

    slice(len?: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return Buffer.alloc(0);
        }
        else {
            const start = this._curOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            if ((start === 0) && (len === currBuffer.length)) {
                return currBuffer;
            }
            else {
                return currBuffer.slice(start, end);
            }
        }

        // let start = this._offset;
        // let end = Math.min(start + len, this._length);
        // let bufferLen = end - start;

        // this._offset += bufferLen;

        // let targetBuffer = Buffer.allocUnsafe(bufferLen);
        // let targetOffset = 0;
        // for (; this._curBufferIndex < this._buffers.length; ++this._curBufferIndex) {
        //     currBuffer = this._buffers[this._curBufferIndex];
        //     let curBufferLen = currBuffer.length - this._curOffset;
        //     if (curBufferLen >= bufferLen) {
        //         currBuffer.copy(targetBuffer, targetOffset, this._curOffset, this._curOffset + bufferLen);
        //         this._curOffset += bufferLen;
        //         bufferLen = 0;
        //         break;
        //     }
        //     else {
        //         currBuffer.copy(targetBuffer, targetOffset, this._curOffset, this._curOffset + curBufferLen);
        //         bufferLen -= curBufferLen;
        //         targetOffset += curBufferLen;
        //         this._curOffset = 0;
        //     }
        // }
        // return targetBuffer;
    }
}
