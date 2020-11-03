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

    protected abstract _appendBuffer(length: number, buffer: Buffer): number;
    protected abstract _appendBuffers(length: number, buffers: Buffer[]): number;

    writeBytes(dataArray: number[]): number {
        const uint8Array = new Uint8Array(dataArray);
        const buffer = Buffer.from(uint8Array.buffer);
        return this._appendBuffer(buffer.length, buffer);
    }

    private _writeNumber(bufferFunction: (value: number, offset: number, noAssert?: boolean) => number, data: number, byteSize: number): number {
        const buffer = Buffer.allocUnsafe(byteSize);
        bufferFunction.call(buffer, data, 0);
        return this._appendBuffer(byteSize, buffer);
    }

    writeByte(data: number): number {
        return this._writeNumber(Buffer.prototype.writeUInt8, data, 1);
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
        return this._appendBuffer(buffer.length, buffer);
    }

    writeBuffer(buffer: Buffer, sourceStart?: number, sourceEnd?: number): number {
        if ((sourceStart != null) || (sourceEnd != null)) {
            buffer = buffer.slice(sourceStart, sourceEnd);
        }
        return this._appendBuffer(buffer.length, buffer);
    }

    write(writer: Writer): number {
        return this._appendBuffers(writer.length, writer.buffers);
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
            return Buffer.allocUnsafe(0);
        }
        if (this._buffers.length > 1) {
            this._buffers = [ Buffer.concat(this._buffers, this._length) ];
        }
        return this._buffers[0];
    }

    get buffers(): Buffer[] {
        return this._buffers;
    }

    protected _appendBuffer(length: number, buffer: Buffer): number {
        this._buffers.push(buffer);
        this._length += length;
        return this._length;
    }

    protected _appendBuffers(length: number, buffers: Buffer[]): number {
        this._buffers = this._buffers.concat(buffers);
        // for (let i = 0, l = buffers.length; i < l; ++i) {
        //     this._buffers.push(buffers[i]);
        // }
        this._length += length;
        return this._length;
    }
}
