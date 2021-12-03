import { Writer, WriterBase } from './writer';

const Num8bits = 1;
const Num16bits = 2;
const Num32bits = 4;
// const Num48bits = 5;
// const Num64bits = 6;
const NumDouble = 8;

export class BufferWriterSize extends WriterBase {
    private _length: number;

    constructor() {
        super();
        this._length = 0;
    }

    reset(): void {
        this._length = 0;
    }

    get buffer(): Buffer {
        return WriterBase.EmptyBuffer;
    }

    get buffers(): Buffer[] {
        return [];
    }

    get length(): number {
        return this._length;
    }

    get offset(): number {
        return 0;
    }

    // Uint8Array ?
    writeBytes(dataArray: number[]): number {
        this._length += dataArray.length * Num8bits;
        return this._length;
    }

    writeByte(data: number): number {
        this._length += Num8bits;
        return this._length;
    }

    writeUInt16(data: number): number {
        this._length += Num16bits;
        return this._length;
    }

    writeUInt32(data: number): number {
        this._length += Num32bits;
        return this._length;
    }

    writeDouble(data: number): number {
        this._length += NumDouble;
        return this._length;
    }

    writeString(data: string, encoding?: BufferEncoding, len?: number): number {
        if (len !== undefined) {
            data = data.substr(len);
        }
        this._length += Buffer.byteLength(data, encoding);
        return this._length;
    }

    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number {
        let len = data.length;
        if (sourceStart !== undefined) {
            len -= Math.max(sourceStart, len);
        }
        if (sourceEnd !== undefined) {
            len -= Math.max(sourceEnd, len);
        }
        this._length += len;
        return this._length;
    }

    writeBuffers(buffers: Buffer[], totalLength?: number): number {
        for (let i = 0, l = buffers.length; i < l; ++i) {
            this.writeBuffer(buffers[i]);
        }
        return this._length;
    }

    writeArrayBuffer(data: ArrayBuffer): number {
        this._length += data.byteLength;
        return this._length;
    }

    write(writer: Writer): number {
        return this.writeBuffers(writer.buffers);
    }

    pushContext(): void {
    }

    popContext(): void {
    }
}

