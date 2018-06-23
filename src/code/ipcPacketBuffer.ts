import { IpcPacketBufferWrap } from './ipcPacketBufferWrap';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';

export class IpcPacketBuffer extends IpcPacketBufferWrap {
    private _buffer: Buffer;

    constructor() {
        super();
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        bufferReader.pushd();
        let result = this._readHeader(bufferReader);
        bufferReader.popd();
        if (result) {
            this._buffer = bufferReader.readBuffer(this.packetSize);
            // bufferReader.reduce();
        }
        return result;
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        let result = this._readHeader(new BufferReader(buffer));
        if (result) {
            this._buffer = buffer;
        }
        return result;
    }

    serializeNumber(dataNumber: number): void {
        let bufferWriter = new BufferListWriter();
        this.writeNumber(bufferWriter, dataNumber);
        this._buffer = bufferWriter.buffer;
    }

    serializeBoolean(dataBoolean: boolean): void {
        let bufferWriter = new BufferListWriter();
        this.writeBoolean(bufferWriter, dataBoolean);
        this._buffer = bufferWriter.buffer;
    }

    serializeString(data: string, encoding?: string): void {
        let bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
    }

    serializeObject(dataObject: Object): void {
        let bufferWriter = new BufferListWriter();
        this.writeObject(bufferWriter, dataObject);
        this._buffer = bufferWriter.buffer;
    }

    serializeBuffer(data: Buffer): void {
        let bufferWriter = new BufferListWriter();
        this.writeBuffer(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    serializeArray(args: any[]): void {
        let bufferWriter = new BufferListWriter();
        this.writeArray(bufferWriter, args);
        this._buffer = bufferWriter.buffer;
    }

    serialize(data: any): void {
        let bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    parse(): any {
        if (this.isComplete()) {
            let bufferReader = new BufferReader(this._buffer);
            return this.read(bufferReader);
        }
        return null;
    }

    private _parseAndCheck(checker: () => boolean): any {
        if (checker.call(this)) {
            let bufferReader = new BufferReader(this._buffer);
            return this.read(bufferReader);
        }
        return null;
    }

    parseBoolean(): boolean | null {
        return this._parseAndCheck(this.isBoolean);
    }

    parseNumber(): number | null {
        return this._parseAndCheck(this.isNumber);
   }

    parseObject(): any | null {
        return this._parseAndCheck(this.isObject);
    }

    parseBuffer(): Buffer | null {
        return this._parseAndCheck(this.isBuffer);
    }

    parseArray(): any[] | null {
        return this._parseAndCheck(this.isArray);
    }

    parseString(encoding?: string): string | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.readString(bufferReader, encoding);
    }

    parseArrayLength(): number | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.readArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.readArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.sliceArray(bufferReader, start, end);
    }
}