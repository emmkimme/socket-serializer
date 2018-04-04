import { Buffer } from 'buffer';
import { Writer, BufferAllocFromArray } from './writer';

export abstract class BufferListWriterBase implements Writer {
    protected _length: number;

    constructor() {
        this._length = 0;
    }

    abstract readonly buffer: Buffer;
    abstract readonly buffers: Buffer[];

    get length(): number {
        return this._length;
    }

    protected _appendBuffer(buffer: Buffer): number {
        this._length += buffer.length;
        return this._length;
    }

    writeByte(data: number): number {
        let buffer = Buffer.alloc(1);
        buffer[0] = data;
        return this._appendBuffer(buffer);
    }

    // Uint8Array ?
    writeBytes(dataArray: number[]): number {
        return this._appendBuffer(BufferAllocFromArray(dataArray));
    }

    writeUInt32(data: number): number {
        let buffer = Buffer.alloc(4);
        buffer.writeUInt32LE(data, 0);
        return this._appendBuffer(buffer);
    }

    writeDouble(data: number): number {
        let buffer = Buffer.alloc(8);
        buffer.writeDoubleLE(data, 0);
        return this._appendBuffer(buffer);
    }

    writeString(data: string, encoding?: string, len?: number): number {
        if (len && (len < data.length)) {
            data = data.substring(0, len);
        }
        return this._appendBuffer(Buffer.from(data, encoding));
    }

    writeBuffer(buffer: Buffer, sourceStart?: number, sourceEnd?: number): number {
        sourceStart = sourceStart || 0;
        sourceEnd = sourceEnd || buffer.length;

        if ((sourceStart > 0) || (sourceEnd < buffer.length)) {
            buffer = buffer.slice(sourceStart, sourceEnd);
        }
        return this._appendBuffer(buffer);
    }

    write(writer: Writer): number {
        let buffers = writer.buffers;
        for (let i = 0, l = buffers.length; i < l; ++i) {
            this._appendBuffer(buffers[i]);
        }
        return this._length;
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

    protected _appendBuffer(buffer: Buffer): number {
        this._buffers.push(buffer);
        return super._appendBuffer(buffer);
    }
}
