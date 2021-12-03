import { Writer, WriterBase } from './writer';

export class BufferWriter extends WriterBase {
    private _offset: number;
    private _buffer: Buffer;

    constructor(buffer: Buffer, offset?: number) {
        super();

        this._buffer = buffer;
        this._offset = offset || 0;
    }

    reset(): void {
        this._buffer = WriterBase.EmptyBuffer;
        this._offset = 0;
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    get buffers(): Buffer[] {
        return [this._buffer];
    }

    get length(): number {
        return this._buffer.length;
    }

    get offset(): number {
        return this._offset;
    }

    // Uint8Array ?
    writeBytes(dataArray: number[]): number {
        const uint8Array = new Uint8Array(dataArray);
        this._offset += this._buffer.copy(uint8Array, this._offset, 0);
        return this._offset;
        // for (let i = 0, l = dataArray.length; i < l; ++i) {
        //     this.writeByte(dataArray[i]);
        // }
        // return this._offset;
    }

    writeByte(data: number): number {
        this._buffer[this._offset++] = data;
        return this._offset;
    }

    writeUInt16(data: number): number {
        this._offset = this._buffer.writeUInt16LE(data, this._offset);
        return this._offset;
    }

    writeUInt32(data: number): number {
        this._offset = this._buffer.writeUInt32LE(data, this._offset);
        return this._offset;
    }

    writeDouble(data: number): number {
        this._offset = this._buffer.writeDoubleLE(data, this._offset);
        return this._offset;
    }

    writeString(data: string, encoding?: BufferEncoding, len?: number): number {
        this._offset += this._buffer.write(data, this._offset, len, encoding);
        return this._offset;
    }

    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number {
        this._offset += data.copy(this._buffer, this._offset, sourceStart, sourceEnd);
        return this._offset;
    }

    writeBuffers(buffers: Buffer[], totalLength?: number): number {
        for (let i = 0, l = buffers.length; i < l; ++i) {
            this.writeBuffer(buffers[i]);
        }
        return this._offset;
    }

    writeArrayBuffer(data: ArrayBuffer): number {
        const buffer = Buffer.from(data);
        return this.writeBuffer(buffer);
    }

    write(writer: Writer): number {
        return this.writeBuffers(writer.buffers);
    }

    pushContext(): void {
    }

    popContext(): void {
    }
}

