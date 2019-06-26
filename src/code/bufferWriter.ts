import { Writer, WriterBase } from './writer';

export class BufferWriter extends WriterBase {
    private _offset: number;
    private _buffer: Buffer;

    constructor(buffer: Buffer, offset?: number) {
        super();

        this._buffer = buffer;
        this._offset = offset || 0;
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
        for (let i = 0, l = dataArray.length; i < l; ++i) {
            this._writeNumber(Buffer.prototype.writeUInt8, dataArray[i], 1);
        }
        return this._offset;
    }

    private _writeNumber(bufferFunction: (value: number, offset: number, noAssert?: boolean) => number, data: number, byteSize: number): number {
        this._offset = bufferFunction.call(this._buffer, data, this._offset, this._noAssert);
        return this._offset;
    }

    writeByte(data: number): number {
        return this._writeNumber(Buffer.prototype.writeUInt8, data, 1);
    }

    writeUInt32(data: number): number {
        return this._writeNumber(Buffer.prototype.writeUInt32LE, data, 4);
    }

    writeDouble(data: number): number {
        return this._writeNumber(Buffer.prototype.writeDoubleLE, data, 8);
    }

    writeString(data: string, encoding?: BufferEncoding, len?: number): number {
        this._offset += this._buffer.write(data, this._offset, len, encoding);
        return this._offset;
    }

    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number {
        this._offset += data.copy(this._buffer, this._offset, sourceStart, sourceEnd);
        return this._offset;
    }

    write(writer: Writer): number {
        let buffers = writer.buffers;
        for (let i = 0, l = buffers.length; i < l; ++i) {
            this.writeBuffer(buffers[i]);
        }
        return this._offset;
    }

    pushContext(): void {
    }

    popContext(): void {
    }
}

