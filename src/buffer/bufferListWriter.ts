import { Buffer } from 'buffer';
import { Writer, WriterBase } from './writer';

export abstract class BufferListWriterBase extends WriterBase {
    protected _length: number;

    constructor() {
        super();

        this._length = 0;
    }

    reset(): void {
        this._length = 0;
    }

    get length(): number {
        return this._length;
    }

    abstract readonly buffer: Buffer;
    abstract readonly buffers: Buffer[];

    protected abstract _appendBuffer(buffer: Buffer, length: number): number;
    protected abstract _appendBuffers(buffers: Buffer[], totalLength: number): number;

    writeBytes(dataArray: number[]): number {
        const uint8Array = new Uint8Array(dataArray);
        const buffer = Buffer.from(uint8Array.buffer);
        return this._appendBuffer(buffer, buffer.length);
    }

    writeByte(data: number): number {
        const buffer = Buffer.allocUnsafe(1)
        buffer[0] = data;
        return this._appendBuffer(buffer, 1);
    }

    private _writeNumber(bufferFunction: (value: number, offset: number, noAssert?: boolean) => number, data: number, byteSize: number): number {
        const buffer = Buffer.allocUnsafe(byteSize);
        bufferFunction.call(buffer, data, 0);
        return this._appendBuffer(buffer, byteSize);
    }

    writeUInt16(data: number): number {
        return this._writeNumber(Buffer.prototype.writeUInt16LE, data, 2);
    }

    writeUInt32(data: number): number {
        return this._writeNumber(Buffer.prototype.writeUInt32LE, data, 4);
    }

    writeDouble(data: number): number {
        return this._writeNumber(Buffer.prototype.writeDoubleLE, data, 8);
    }

    writeString(data: string, encoding?: BufferEncoding, len?: number): number {
        if (len != null) {
            data = data.substring(0, len);
        }
        const buffer = Buffer.from(data, encoding);
        return this._appendBuffer(buffer, buffer.length);
    }

    writeBuffer(buffer: Buffer, sourceStart?: number, sourceEnd?: number): number {
        if ((sourceStart != null) || (sourceEnd != null)) {
            buffer = buffer.slice(sourceStart, sourceEnd);
        }
        return this._appendBuffer(buffer, buffer.length);
    }

    writeBuffers(buffers: Buffer[], totalLength?: number): number {
        totalLength = (totalLength == null) ? buffers.reduce((sum, buffer) => sum + buffer.length, 0) : totalLength;
        return this._appendBuffers(buffers, totalLength);
    }

    writeArrayBuffer(data: ArrayBuffer): number {
        const buffer = Buffer.from(data);
        return this.writeBuffer(buffer);
    }

    write(writer: Writer): number {
        return this._appendBuffers(writer.buffers, writer.length);
    }

    pushContext(): void {
    }

    popContext(): void {
    }
}

export class BufferListWriter extends BufferListWriterBase {
    protected _buffers: Buffer[];

    constructor() {
        super();
        this._buffers = [];
    }

    reset(): void {
        super.reset();

        this._buffers = [];
    }

    get buffer(): Buffer {
        if (this._buffers.length === 0) {
            return WriterBase.EmptyBuffer;
        }
        if (this._buffers.length > 1) {
            this._buffers = [ Buffer.concat(this._buffers, this._length) ];
        }
        return this._buffers[0];
    }

    get buffers(): Buffer[] {
        return this._buffers;
    }

    protected _appendBuffer(buffer: Buffer, length: number): number {
        this._buffers.push(buffer);
        this._length += length;
        return this._length;
    }

    protected _appendBuffers(buffers: Buffer[], totalLength: number): number {
        // 'push' is faster than 'concat' but may have a "Maximum call stack size exceeded" exception when buffers length is very long
        // this._buffers.push.apply(this._buffers, buffers);
        // for (let i = 0, l = buffers.length; i < l; ++i) {
        //     this._buffers.push(buffers[i]);
        // }
        this._buffers = this._buffers.concat(buffers);
        this._length += totalLength;
        return this._length;
    }
}
