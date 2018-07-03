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

    private _serializeAndCheck(data: any, checker: () => boolean): boolean {
        let bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
        return checker.call(this);
    }

    serializeNumber(dataNumber: number): boolean {
        return this._serializeAndCheck(dataNumber, this.isNumber);
    }

    serializeBoolean(dataBoolean: boolean): boolean {
        return this._serializeAndCheck(dataBoolean, this.isBoolean);
    }

    serializeDate(dataDate: boolean): boolean {
        return this._serializeAndCheck(dataDate, this.isDate);
    }

    serializeString(data: string, encoding?: string): boolean {
        let bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
        return this.isString();
    }

    serializeObject(dataObject: Object): boolean {
        return this._serializeAndCheck(dataObject, this.isObject);
    }

    serializeBuffer(dataBuffer: Buffer): boolean {
        return this._serializeAndCheck(dataBuffer, this.isBuffer);
    }

    serializeArray(args: any[]): boolean {
        return this._serializeAndCheck(args, this.isArray);
    }

    serialize(data: any): boolean {
        return this._serializeAndCheck(data, this.isComplete);
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

    parseDate(): Date | null {
        return this._parseAndCheck(this.isDate);
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
            return this._readArraySlice(bufferReader, start, end);
        }
        return null;
    }
}