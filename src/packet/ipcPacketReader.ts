import { JSONParser } from 'json-helpers';

import { Reader } from '../buffer/reader';

import { IpcPacketType, FooterLength, IpcPacketHeader, MapShortCodeToArrayBuffer } from './ipcPacketHeader';

export namespace IpcPacketReader {
    export type Callback = (rawHeader: IpcPacketHeader.RawData, arg?: any) => void;
}

export class IpcPacketReader {
    constructor() {
    }

    read(bufferReader: Reader, cb?: IpcPacketReader.Callback): any | undefined {
        const rawHeader = IpcPacketHeader.ReadHeader(bufferReader);
        if (rawHeader.contentSize >= 0) {
            const arg = this.readContent(bufferReader, rawHeader.type, rawHeader.contentSize);
            bufferReader.skip(FooterLength);
            if (cb) cb(rawHeader, arg);
            return arg;
        }
        // throw err ?
        if (cb) cb(rawHeader);
        return undefined;
    }

    private _read(bufferReader: Reader): any | undefined {
        const rawHeader = IpcPacketHeader.ReadHeader(bufferReader);
        if (rawHeader.contentSize >= 0) {
            const arg = this.readContent(bufferReader, rawHeader.type, rawHeader.contentSize);
            bufferReader.skip(FooterLength);
            return arg;
        }
        // throw err ?
        return undefined;
    }

    readContent(bufferReader: Reader, type: IpcPacketType, contentSize: number): any | undefined {
        switch (type) {
            case IpcPacketType.String:
                return this._readContentString(bufferReader, contentSize);

            case IpcPacketType.Buffer:
                return bufferReader.subarray(contentSize);

            case IpcPacketType.Double:
                return bufferReader.readDouble();
            case IpcPacketType.NegativeInteger:
                return -bufferReader.readUInt32();
            case IpcPacketType.PositiveInteger:
                return +bufferReader.readUInt32();

            case IpcPacketType.BooleanTrue:
                return true;
            case IpcPacketType.BooleanFalse:
                return false;

            case IpcPacketType.Date:
                return new Date(bufferReader.readDouble());
    
                // case IpcPacketType.ArrayWithLen:
            case IpcPacketType.ArrayWithSize:
                return this._readContentArray(bufferReader);

            case IpcPacketType.ArrayBufferWithSize:
                return this._readContentTypedArray(bufferReader, contentSize);

                // case IpcPacketType.Object:
            //     return this._readContentObjectDirect(bufferReader);
            case IpcPacketType.ObjectSTRINGIFY:
                return this._readContentObject(bufferReader, contentSize);

            case IpcPacketType.Null:
                return null;

            case IpcPacketType.Undefined:
                return undefined;

            default: 
                return undefined;
        }
    }

    // Header has been read and checked
    private _readContentString(bufferReader: Reader, contentSize: number): string {
        // Encoding will be managed later
        return bufferReader.readString('utf8', contentSize);
    }

    private _readContentObject(bufferReader: Reader, contentSize: number): string {
        const data = bufferReader.readString('utf8', contentSize);
        return JSONParser.parse(data);
    }

    private _readContentTypedArray(bufferReader: Reader, contentSize: number): any {
        const shortCode = bufferReader.readByte();
        const typedArrayDef = MapShortCodeToArrayBuffer[shortCode];
        if (shortCode === 0) {
            const buffer = bufferReader.subarray(contentSize - 1);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + contentSize - 1);
        }
        if (typedArrayDef == null) {
            return undefined;
        }
        const buffer = bufferReader.subarray(contentSize - 1);
        return new typedArrayDef.ctor(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + contentSize - 1));
    }

    // Header has been read and checked
    private _readContentArray(bufferReader: Reader): any[] {
        const argsLen = bufferReader.readUInt32();
        const args = new Array(argsLen);
        let argIndex = 0;
        while (argIndex < argsLen) {
            const arg = this._read(bufferReader);
            args[argIndex++] = arg;
        }
        return args;
    }

    // Header has been read and checked
    readContentArrayLength(bufferReader: Reader): number| undefined {
        return bufferReader.readUInt32();
    }

    private _byPass(bufferReader: Reader): boolean {
        // Do not decode data just skip
        const rawHeader = IpcPacketHeader.ReadHeader(bufferReader);
        if (rawHeader.contentSize >= 0) {
            bufferReader.skip(rawHeader.contentSize + FooterLength);
            return true;
        }
        return false;
    }

    // Header has been read and checked
    readContentArrayAt(bufferReader: Reader, index: number): any | undefined {
        const argsLen = bufferReader.readUInt32();
        if (index >= argsLen) {
            return undefined;
        }
        while (index > 0) {
            // Do not decode data just skip
            if (this._byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --index;
        }
        return this._read(bufferReader);
    }

    // Header has been read and checked
    readContentArraySlice(bufferReader: Reader, start?: number, end?: number): any | undefined {
        const argsLen = bufferReader.readUInt32();
        if (start == null) {
            start = 0;
        }
        else if (start < 0) {
            start = argsLen + start;
        }
        if (start >= argsLen) {
            return [];
        }
        if (end == null) {
            end = argsLen;
        }
        else if (end < 0) {
            end = argsLen + end;
        }
        else {
            end = Math.min(end, argsLen);
        }
        if (end <= start) {
            return [];
        }

        while (start > 0) {
            // Do not decode data just skip
            if (this._byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --start;
            --end;
        }
        const args = new Array(end);
        let argIndex = 0;
        while (argIndex < end) {
            const arg = this._read(bufferReader);
            args[argIndex++] = arg;
        }
        return args;
    }
}
