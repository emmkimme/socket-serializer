import { JSONParser } from 'json-helpers';

import { Reader } from './reader';
import { Writer } from './writer';

import { BufferListWriter } from './bufferListWriter';
import { BufferWriter } from './bufferWriter';

import { IpcPacketType, FooterLength, FixedHeaderSize, IpcPacketHeader, DynamicHeaderSize } from './ipcPacketHeader';
import { FooterSeparator } from './ipcPacketHeader';
import { DoubleContentSize, DateContentSize, IntegerContentSize, BooleanContentSize, NullUndefinedContentSize } from './ipcPacketHeader';

function CreatePacketBufferFor(bufferType: IpcPacketType, contentSize: number, num: number): Buffer {
    // assert(this.isFixedSize() === true);
    // Write the whole in one block buffer, to avoid multiple small buffers
    const packetSize = FixedHeaderSize + contentSize + FooterLength;
    const bufferWriterAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
    bufferWriterAllInOne.writeUInt16(bufferType);
    // Write content
    switch (bufferType) {
        case IpcPacketType.NegativeInteger:
        case IpcPacketType.PositiveInteger:
            bufferWriterAllInOne.writeUInt32(num);
            break;
        case IpcPacketType.Double:
        case IpcPacketType.Date:
            bufferWriterAllInOne.writeDouble(num);
            break;
        // case IpcPacketType.Null:
        // case IpcPacketType.Undefined:
        // case IpcPacketType.BooleanFalse:
        // case IpcPacketType.BooleanTrue:
        //     break;
        // default :
        //     throw new Error('socket-serializer - write: not expected data');
    }
    // Write footer
    bufferWriterAllInOne.writeByte(FooterSeparator);
    return bufferWriterAllInOne.buffer;
}

const BufferFooter = Buffer.allocUnsafe(1).fill(FooterSeparator);
const BufferBooleanTrue = CreatePacketBufferFor(IpcPacketType.BooleanTrue, BooleanContentSize, -1);
const BufferBooleanFalse = CreatePacketBufferFor(IpcPacketType.BooleanFalse, BooleanContentSize, -1);
const BufferUndefined = CreatePacketBufferFor(IpcPacketType.Undefined, NullUndefinedContentSize, -1);
const BufferNull = CreatePacketBufferFor(IpcPacketType.Null, NullUndefinedContentSize, -1);

export namespace IpcPacketContent {
    export type WriterCallback = (rawHeader: IpcPacketHeader.RawData) => void;
    export type ReaderCallback = (rawHeader: IpcPacketHeader.RawData, arg?: any) => void;
}

export class IpcPacketContent {
    protected _writeDynamicBuffer(writer: Writer, type: IpcPacketType, packetBuffer: Buffer, cb: IpcPacketContent.WriterCallback): void {
        const contentSize = packetBuffer.length;
        writer.pushContext();
        writer.writeUInt16(type);
        writer.writeUInt32(contentSize);
        writer.writeBuffer(packetBuffer);
        writer.writeBuffer(BufferFooter);
        writer.popContext();
        if (cb) {
            cb({
                type,
                headerSize: DynamicHeaderSize,
                contentSize
            });
        }
    }

    protected _writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer, cb: IpcPacketContent.WriterCallback): void {
        const contentSize = writerContent.length;
        writer.pushContext();
        writer.writeUInt16(type);
        writer.writeUInt32(contentSize);
        writer.write(writerContent);
        writer.writeBuffer(BufferFooter);
        writer.popContext();
        if (cb) {
            cb({
                type,
                headerSize: DynamicHeaderSize,
                contentSize
            });
        }
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected _writeFixedContent(writer: Writer, type: IpcPacketType, packetBuffer: Buffer, cb: IpcPacketContent.WriterCallback): void {
        switch (type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
            case IpcPacketType.Double:
            case IpcPacketType.Date:
                break;
            case IpcPacketType.Null:
                packetBuffer = BufferNull;
                break;
            case IpcPacketType.Undefined:
                packetBuffer = BufferUndefined;
                break;
            case IpcPacketType.BooleanFalse:
                packetBuffer = BufferBooleanFalse;
                break;
            case IpcPacketType.BooleanTrue:
                packetBuffer = BufferBooleanTrue;
                break;
            // default :
            //     throw new Error('socket-serializer - write: not expected data');
        }
        // Push block in origin writer
        writer.pushContext();
        writer.writeBuffer(packetBuffer);
        writer.popContext();
        if (cb) {
            cb({
                type,
                headerSize: FixedHeaderSize,
                contentSize: packetBuffer.length - FixedHeaderSize - FooterLength
            });
        }
    }

    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.4.3
    // Type of val              Result
    // ------------------------------------
    // Undefined                "undefined"
    // Null                     "object"
    // Boolean                  "boolean"
    // Number                   "number"
    // String                   "string"
    // Object (native and does not implement [[Call]])      "object"
    // Object (native or host and does implement [[Call]])  "function"
    // Object (host and does not implement [[Call]])        Implementation-defined except may not be "undefined", "boolean", "number", or "string".
    write(bufferWriter: Writer, data: any, cb?: IpcPacketContent.WriterCallback): void {
        switch (typeof data) {
            case 'object':
                if (data === null) {
                    this._writeFixedContent(bufferWriter, IpcPacketType.Null, undefined, cb);
                }
                else if (Buffer.isBuffer(data)) {
                    this._writeDynamicBuffer(bufferWriter, IpcPacketType.Buffer, data, cb);
                }
                else if (Array.isArray(data)) {
                    this._writeArray(bufferWriter, data, cb);
                }
                else if (data instanceof Date) {
                    this._writeDate(bufferWriter, data, cb);
                }
                else {
                    this._writeObject(bufferWriter, data, cb);
                }
                break;
            case 'string':
                this._writeString(bufferWriter, data, cb);
                break;
            case 'number':
                this._writeNumber(bufferWriter, data, cb);
                break;
            case 'boolean':
                this._writeFixedContent(bufferWriter, data ? IpcPacketType.BooleanTrue : IpcPacketType.BooleanFalse, undefined, cb);
                break;
            case 'undefined':
                this._writeFixedContent(bufferWriter, IpcPacketType.Undefined, undefined, cb);
                break;
            case 'symbol':
            default:
                break;
        }
    }

    // Thanks for parsing coming from https://github.com/tests-always-included/buffer-serializer/
    protected _writeNumber(bufferWriter: Writer, dataNumber: number, cb: IpcPacketContent.WriterCallback): void {
        // An integer
        if (Number.isInteger(dataNumber)) {
            const absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    const packetBuffer = CreatePacketBufferFor(IpcPacketType.NegativeInteger, IntegerContentSize, absDataNumber);
                    this._writeFixedContent(bufferWriter, IpcPacketType.NegativeInteger, packetBuffer, cb);
                }
                // Positive integer
                else {
                    const packetBuffer = CreatePacketBufferFor(IpcPacketType.PositiveInteger, IntegerContentSize, absDataNumber);
                    this._writeFixedContent(bufferWriter, IpcPacketType.PositiveInteger, packetBuffer, cb);
                }
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Save as a double.
        const packetBuffer = CreatePacketBufferFor(IpcPacketType.Double, DoubleContentSize, dataNumber);
        this._writeFixedContent(bufferWriter, IpcPacketType.Double, packetBuffer, cb);
    }

    protected _writeDate(bufferWriter: Writer, data: Date, cb: IpcPacketContent.WriterCallback) {
        const packetBuffer = CreatePacketBufferFor(IpcPacketType.Date, DateContentSize, data.getTime());
        this._writeFixedContent(bufferWriter, IpcPacketType.Date, packetBuffer, cb);
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    protected _writeString(bufferWriter: Writer, data: string, cb: IpcPacketContent.WriterCallback) {
        // Encoding will be managed later, force 'utf8'
        // case 'hex':
        // case 'utf8':
        // case 'utf-8':
        // case 'ascii':
        // case 'latin1':
        // case 'binary':
        // case 'base64':
        // case 'ucs2':
        // case 'ucs-2':
        // case 'utf16le':
        // case 'utf-16le':
        const buffer = Buffer.from(data, 'utf8');
        this._writeDynamicBuffer(bufferWriter, IpcPacketType.String, buffer, cb);
    }

    // Default methods for these kind of data
    protected _writeObject(bufferWriter: Writer, dataObject: any, cb: IpcPacketContent.WriterCallback): void {
        const stringifycation = JSONParser.stringify(dataObject);
        const buffer = Buffer.from(stringifycation, 'utf8');
        this._writeDynamicBuffer(bufferWriter, IpcPacketType.ObjectSTRINGIFY, buffer, cb);
    }

    // Default methods for these kind of data
    protected _writeArray(bufferWriter: Writer, args: any[], cb: IpcPacketContent.WriterCallback): void {
        const contentWriter = new BufferListWriter();
        contentWriter.writeUInt32(args.length);
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(contentWriter, args[i]);
        }
        // JSONParser.uninstall();
        this._writeDynamicContent(bufferWriter, IpcPacketType.ArrayWithSize, contentWriter, cb);
    }

    read(bufferReader: Reader, cb?: IpcPacketContent.ReaderCallback): any | undefined {
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

    protected _read(bufferReader: Reader): any | undefined {
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
    protected _readContentString(bufferReader: Reader, contentSize: number): string {
        // Encoding will be managed later
        return bufferReader.readString('utf8', contentSize);
    }

    protected _readContentObject(bufferReader: Reader, contentSize: number): string {
        const data = bufferReader.readString('utf8', contentSize);
        return JSONParser.parse(data);
    }

    // Header has been read and checked
    protected _readContentArray(bufferReader: Reader): any[] {
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

    protected _byPass(bufferReader: Reader): boolean {
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
