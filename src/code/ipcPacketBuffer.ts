import { IpcPacketBufferWrap, BufferType } from './ipcPacketBufferWrap';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';

export namespace IpcPacketBuffer {
    export interface RawContent extends IpcPacketBufferWrap.RawContent {
        buffer: Buffer;
    }
}

export class IpcPacketBuffer extends IpcPacketBufferWrap {
    private _buffer: Buffer;

    constructor(rawContent?: IpcPacketBuffer.RawContent) {
        super(rawContent);
        if (rawContent) {
            this._buffer = rawContent.buffer;
        }
    }

    reset(): void {
        super.reset();
        this._buffer = null;
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    setRawContent(rawContent: IpcPacketBuffer.RawContent): void {
        super.setRawContent(rawContent);
        this._buffer = rawContent.buffer;
    }

    getRawContent(): IpcPacketBuffer.RawContent {
        const rawContent : IpcPacketBuffer.RawContent = {
            type: this._type,
            contentSize: this._contentSize,
            buffer: this._buffer
        };
        return rawContent;
    }

    keepDecodingFromReader(bufferReader: Reader): boolean {
        if ((this._type === BufferType.Partial) && (this._contentSize >= 0)) {
            const packetSize = this.packetSize;
            if (bufferReader.checkEOF(packetSize)) {
                this._buffer = bufferReader.subarray(packetSize);
                return true;
            }
            else {
                this._buffer = null;
                return false;
            }
        }
        return this.decodeFromReader(bufferReader);
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        bufferReader.pushd();
        const result = this._readHeader(bufferReader);
        bufferReader.popd();
        if (result) {
            this._buffer = bufferReader.subarray(this.packetSize);
        }
        else {
            this._buffer = null;
        }
        return result;
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        const result = this._readHeader(new BufferReader(buffer));
        if (result) {
            this._buffer = buffer;
        }
        else {
            this._buffer = null;
        }
        return result;
    }

    private _serializeAndCheck(checker: () => boolean, data: any): boolean {
        const bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
        return checker.call(this);
    }

    serializeNumber(dataNumber: number): boolean {
        return this._serializeAndCheck(this.isNumber, dataNumber);
    }

    serializeBoolean(dataBoolean: boolean): boolean {
        return this._serializeAndCheck(this.isBoolean, dataBoolean);
    }

    serializeDate(dataDate: boolean): boolean {
        return this._serializeAndCheck(this.isDate, dataDate);
    }

    serializeString(data: string, encoding?: BufferEncoding): boolean {
        const bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
        return this.isString();
    }

    serializeObject(dataObject: Object): boolean {
        return this._serializeAndCheck(this.isObject, dataObject);
    }

    serializeBuffer(dataBuffer: Buffer): boolean {
        return this._serializeAndCheck(this.isBuffer, dataBuffer);
    }

    serializeArray(args: any[]): boolean {
        return this._serializeAndCheck(this.isArray, args);
    }

    serialize(data: any): boolean {
        return this._serializeAndCheck(this.isComplete, data);
    }

    private _parseAndCheck(checker: () => boolean): any {
        if (checker.call(this)) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
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
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArrayLength(bufferReader);
        }
        return null;
    }

    parseArrayAt(index: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArrayAt(bufferReader, index);
        }
        return null;
    }

    // parseArraySetAt(index: number, data: any): void {
    //     if (this.isArray()) {
    //         const bufferReader = new BufferReader(this._buffer);
    //         return this._readArraySetAt(bufferReader, index);
    //     }
    //     return null;
    // }

    parseArraySlice(start?: number, end?: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArraySlice(bufferReader, start, end);
        }
        return null;
    }
}