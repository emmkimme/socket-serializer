import { Buffer } from 'buffer';
import { Reader, ReaderBase, ReaderContext } from './reader';

export interface BufferListReaderContext extends ReaderContext {
    curBufferIndex: number;
    curOffset: number;
    timestamp: number;
}

export class BufferListReader extends ReaderBase {
    static readonly ReduceThreshold = 100000; // in bytes

    private _length: number;
    private _buffers: Buffer[];
    private _curBufferIndex: number;
    private _curBufferOffset: number;
    private _timestamp: number;

    private _contexts: BufferListReaderContext[];

    constructor(buffers?: Buffer[], offset?: number) {
        super(0);

        this._contexts = [];
        this._timestamp = 0;

        this._buffers = buffers || [];
        // Sum buffers length
        this._length = this._buffers.reduce((sum, buffer) => sum + buffer.length, 0);

        this._curBufferOffset = 0;
        this._curBufferIndex = 0;
        this.seek(offset || 0);
    }

    reset(): void {
        super.reset();

        this._contexts = [];

        this._buffers = [];
        this._length = 0;
        this._curBufferOffset = 0;
        this._curBufferIndex = 0;
    }

    appendBuffer(buffer: Buffer): void {
        this._buffers.push(buffer);
        this._length += buffer.length;
    }

    get length(): number {
        return this._length;
    }

    getContext(): BufferListReaderContext {
        return {
            timestamp: this._timestamp,
            offset: this._offset,
            curOffset: this._curBufferOffset,
            curBufferIndex: this._curBufferIndex
        };
    }

    setContext(context: BufferListReaderContext): void {
        if (context.timestamp === this._timestamp) {
            this._offset = context.offset;
            this._curBufferIndex = context.curBufferIndex;
            this._curBufferOffset = context.curOffset;
        }
        else {
            if (context.offset < (this._length >> 1)) {
                this._offset = 0;
                this._curBufferIndex = 0;
                this._curBufferOffset = 0;
            }
            else {
                this._offset = this._length - 1;
                this._curBufferIndex = this._buffers.length - 1;
                this._curBufferOffset = this._buffers[this._curBufferIndex].length - 1;
            }
            this.seek(context.offset);
        }
    }

    pushd(): number {
        return this._contexts.push(this.getContext());
    }

    popd(): number {
        // ({ offset: this._offset, curOffset: this._curOffset, curBufferIndex: this._curBufferIndex } = this._contexts.pop());
        const context = this._contexts.pop()
        this.setContext(context);
        return this._contexts.length;
    }

    seek(offset: number): boolean {
        if (this._offset !== offset) {
            let curBuffer = this._buffers[this._curBufferIndex];
            this._curBufferOffset += (offset - this._offset);
            this._offset = offset;
            while (this._curBufferOffset >= curBuffer.length) {
                if (this._curBufferIndex >= this._buffers.length - 1) {
                    if (!this._noAssert) {
                        throw new RangeError('Index out of range');
                    }
                    return false;
                }
                this._curBufferOffset -= curBuffer.length;
                ++this._curBufferIndex;
                curBuffer = this._buffers[this._curBufferIndex];
            }
            while (this._curBufferOffset < 0) {
                if (this._curBufferIndex <= 0) {
                    if (!this._noAssert) {
                        throw new RangeError('Index out of range');
                    }
                    return false;
                }
                --this._curBufferIndex;
                curBuffer = this._buffers[this._curBufferIndex];
                this._curBufferOffset += curBuffer.length;
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
                this._length -= (this._offset - this._curBufferOffset);
                this._offset = this._curBufferOffset;
                this._curBufferIndex = 0;
            }
            // 'consolidate' may accumulate data in a single buffer which may growing up and growing.....
            // So we have to explicitely/physically reduce it
            if (this._buffers.length >= 0) {
                const curBuffer = this._buffers[0];
                if ((curBuffer.length > BufferListReader.ReduceThreshold) && (this._curBufferOffset > (curBuffer.length >> 1))) {
                    // if (this._curOffset > (curBuffer.length >> 1)) {
                    const newBuffer = Buffer.allocUnsafe(curBuffer.length - this._curBufferOffset);
                    curBuffer.copy(newBuffer, 0, this._curBufferOffset);
                    this._buffers[0] = newBuffer;
                    this._length -= this._curBufferOffset;
                    this._offset -= this._curBufferOffset;
                    this._curBufferOffset = 0;
                }
            }
        }
    }

    private _consolidate(len: number): Buffer {
        let curBuffer = this._buffers[this._curBufferIndex];
        this._curBufferOffset += len;
        this._offset += len;
        if (this._curBufferOffset > curBuffer.length) {
            let bufferLength = 0;
            const buffers = [];
            for (let endBufferIndex = this._curBufferIndex, l = this._buffers.length; endBufferIndex < l; ++endBufferIndex) {
                const buffer = this._buffers[endBufferIndex];
                buffers.push(buffer);
                bufferLength += buffer.length;
                if (this._curBufferOffset <= bufferLength) {
                    break;
                }
            }
            curBuffer = Buffer.concat(buffers, bufferLength);
            this._buffers.splice(this._curBufferIndex, buffers.length, curBuffer);
            if (!this._noAssert && (this._curBufferOffset > curBuffer.length)) {
                // throw new RangeError('Index out of range');
            }
            ++this._timestamp;
            // let index = this._contexts.length;
            // while (index) {
            //     const context = this._contexts[--index];
            //     context.rebuild = context.rebuild || (context.curBufferIndex > this._curBufferIndex);
            // }
        }
        else if (this._curBufferOffset === curBuffer.length) {
            ++this._curBufferIndex;
            this._curBufferOffset = 0;
        }
        return curBuffer;
    }

    private _readNumber(bufferFunction: (offset: number, noAssert?: boolean) => number, byteSize: number): number {
        const start = this._curBufferOffset;
        const currBuffer = this._consolidate(byteSize);
        return bufferFunction.call(currBuffer, start, this._noAssert);
    }

    readByte(): number {
        const start = this._curBufferOffset;
        const currBuffer = this._consolidate(1);
        return currBuffer[start];
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
            const start = this._curBufferOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            return currBuffer.toString(encoding, start, start + len);
        }
    }

    subarray(len?: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return ReaderBase.EmptyBuffer;
        }
        else {
            const start = this._curBufferOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            if ((start === 0) && (len === currBuffer.length)) {
                return currBuffer;
            }
            else {
                // return Buffer.from(currBuffer.buffer, currBuffer.byteOffset + start, len);
                return currBuffer.subarray(start, start + len);
            }
        }
    }

    subarrayList(len?: number): Buffer[] {
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return [ReaderBase.EmptyBuffer];
        }
        else {
            len = end - this._offset;
            this._offset += len;

            let curBuffer = this._buffers[this._curBufferIndex];
            const subBuffer = curBuffer.subarray(this._curBufferOffset, this._curBufferOffset + len);
            const buffers = [subBuffer];
            len -= subBuffer.length;
            this._curBufferOffset += subBuffer.length;

            while (len > 0) {
                ++this._curBufferIndex;

                curBuffer = this._buffers[this._curBufferIndex];
                const subBuffer = curBuffer.subarray(0, len);
                buffers.push(subBuffer);

                len -= subBuffer.length;
                this._curBufferOffset = subBuffer.length;
            }
            if (this._curBufferOffset === curBuffer.length) {
                this._curBufferOffset = 0;
                ++this._curBufferIndex;
            }
            return buffers;
        }
    }

    slice(len?: number): Buffer {
        const end = Reader.AdjustEnd(this._offset, this._length, len);
        if (this._offset === end) {
            return ReaderBase.EmptyBuffer;
        }
        else {
            const start = this._curBufferOffset;
            len = end - this._offset;
            const currBuffer = this._consolidate(len);
            if ((start === 0) && (len === currBuffer.length)) {
                return currBuffer;
            }
            else {
                return currBuffer.slice(start, start + len);
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
