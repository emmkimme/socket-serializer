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

    private _parseAndCheck(checker: () => boolean): any {
        if (checker.call(this)) {
            let bufferReader = new BufferReader(this._buffer);
            bufferReader.skip(this._headerSize);
            return this._readContent(0, bufferReader);
        }
        return null;
    }

    parse(): any {
        return this._parseAndCheck(this.isComplete);
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

    parseString(): string | null {
        return this._parseAndCheck(this.isString);
    }

    parseArrayLength(): number | null {
        if (this.isArray()) {
            let bufferReader = new BufferReader(this._buffer);
            bufferReader.skip(this._headerSize);
            return this._readArrayLength(bufferReader);
        }
        return null;
    }

    parseArrayAt(index: number): any | null {
        if (this.isArray()) {
            let bufferReader = new BufferReader(this._buffer);
            bufferReader.skip(this._headerSize);
            return this._readArrayAt(bufferReader, index);
        }
        return null;
    }

    parseArraySlice(start?: number, end?: number): any | null {
        if (this.isArray()) {
            let bufferReader = new BufferReader(this._buffer);
            bufferReader.skip(this._headerSize);
            return this._sliceArray(bufferReader, start, end);
        }
        return null;
    }
}