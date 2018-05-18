import { Buffer } from 'buffer';
import { Writer } from './writer';

export abstract class BufferListWriterBase implements Writer {
    protected _length: number;

    constructor() {
        this._length = 0;
    }

    get length(): number {
        return this._length;
    }

    abstract readonly buffer: Buffer;
    abstract readonly buffers: Buffer[];

    protected abstract _appendBuffer(length: number, ...buffers: Buffer[]): number;

    writeByte(data: number): number {
        let buffer = Buffer.allocUnsafe(1);
        buffer.writeUInt8(data, 0);
        return this._appendBuffer(1, buffer);
    }

    writeBytes(dataArray: number[]): number {
        let uint8Array = new Uint8Array(dataArray);
        let buffer = Buffer.from(uint8Array.buffer);
        return this._appendBuffer(buffer.length, buffer);
    }

    writeUInt32(data: number): number {
        let buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32LE(data, 0);
        return this._appendBuffer(4, buffer);
    }

    writeDouble(data: number): number {
        let buffer = Buffer.allocUnsafe(8);
        buffer.writeDoubleLE(data, 0);
        return this._appendBuffer(8, buffer);
    }

    writeString(data: string, encoding?: string, len?: number): number {
        if (len != null) {
            data = data.substring(0, len);
        }
        let buffer = Buffer.from(data, encoding);
        return this._appendBuffer(buffer.length, buffer);
    }

    writeBuffer(buffer: Buffer, sourceStart?: number, sourceEnd?: number): number {
        if ((sourceStart != null) || (sourceEnd != null)) {
            buffer = buffer.slice(sourceStart, sourceEnd);
        }
        return this._appendBuffer(buffer.length, buffer);
    }

    write(writer: Writer): number {
        return this._appendBuffer(writer.length, ...writer.buffers);
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

    get buffer(): Buffer {
        if (this._buffers.length === 0) {
            return Buffer.alloc(0);
        }
        if (this._buffers.length > 1) {
            this._buffers = [ Buffer.concat(this._buffers, this._length) ];
        }
        return this._buffers[0];
    }

    get buffers(): Buffer[] {
        return this._buffers;
    }

    protected _appendBuffer(length: number, ...buffers: Buffer[]): number {
        this._length += length;
        this._buffers.push(...buffers);
        return this._length;
    }
}
