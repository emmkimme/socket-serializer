import { JSONParser } from 'json-helpers';

import { Reader } from './reader';
import { Writer } from './writer';

import { BufferListWriter } from './bufferListWriter';
import { BufferWriter } from './bufferWriter';

import { IpcPacketType, FooterLength, FixedHeaderSize, IpcPacketHeader } from './ipcPacketHeader';
import { FooterSeparator } from './ipcPacketHeader';
import { DoubleContentSize, DateContentSize, IntegerContentSize, BooleanContentSize, NullUndefinedContentSize } from './ipcPacketHeader';

function CreateBufferFor(bufferType: IpcPacketType, contentSize: number, num: number): Buffer {
    // assert(this.isFixedSize() === true);
    // Write the whole in one block buffer, to avoid multiple small buffers
    const packetSize = FixedHeaderSize + contentSize + FooterLength;
    const bufferWriteAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
    bufferWriteAllInOne.writeUInt16(bufferType);
    // Write content
    switch (bufferType) {
        case IpcPacketType.NegativeInteger:
        case IpcPacketType.PositiveInteger:
            bufferWriteAllInOne.writeUInt32(num);
            break;
        case IpcPacketType.Double:
        case IpcPacketType.Date:
            bufferWriteAllInOne.writeDouble(num);
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
    bufferWriteAllInOne.writeByte(FooterSeparator);
    return bufferWriteAllInOne.buffer;
}

const BufferFooter = Buffer.allocUnsafe(1).fill(FooterSeparator);
const BufferBooleanTrue = CreateBufferFor(IpcPacketType.BooleanTrue, BooleanContentSize, -1);
const BufferBooleanFalse = CreateBufferFor(IpcPacketType.BooleanFalse, BooleanContentSize, -1);
const BufferUndefined = CreateBufferFor(IpcPacketType.Undefined, NullUndefinedContentSize, -1);
const BufferNull = CreateBufferFor(IpcPacketType.Null, NullUndefinedContentSize, -1);

export namespace IpcPacketContent {
    export interface RawContent extends IpcPacketHeader.RawContent {
    }
}

export class IpcPacketContent extends IpcPacketHeader {
    protected writeDynamicBuffer(bufferWriter: Writer, bufferType: IpcPacketType, bufferContent: Buffer): void {
        bufferWriter.pushContext();
        bufferWriter.writeUInt16(bufferType);
        bufferWriter.writeUInt32(bufferContent.length);
        bufferWriter.writeBuffer(bufferContent);
        bufferWriter.writeBuffer(BufferFooter);
        bufferWriter.popContext();
    }

    protected writeDynamicContent(bufferWriter: Writer, bufferType: IpcPacketType, writerContent: Writer): void {
        bufferWriter.pushContext();
        bufferWriter.writeUInt16(bufferType);
        bufferWriter.writeUInt32(writerContent.length);
        bufferWriter.write(writerContent);
        bufferWriter.writeBuffer(BufferFooter);
        bufferWriter.popContext();
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected writeFixedContent(bufferWriter: Writer, bufferType: IpcPacketType, bufferContent?: Buffer): void {
        switch (bufferType) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
            case IpcPacketType.Double:
            case IpcPacketType.Date:
                break;
            case IpcPacketType.Null:
                bufferContent = BufferNull;
                break;
            case IpcPacketType.Undefined:
                bufferContent = BufferUndefined;
                break;
            case IpcPacketType.BooleanFalse:
                bufferContent = BufferBooleanFalse;
                break;
            case IpcPacketType.BooleanTrue:
                bufferContent = BufferBooleanTrue;
                break;
            // default :
            //     throw new Error('socket-serializer - write: not expected data');
        }
        // Push block in origin writer
        bufferWriter.pushContext();
        bufferWriter.writeBuffer(bufferContent);
        bufferWriter.popContext();
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
    write(bufferWriter: Writer, data: any): void {
        switch (typeof data) {
            case 'object':
                if (data === null) {
                    this.writeFixedContent(bufferWriter, IpcPacketType.Null);
                }
                else if (Buffer.isBuffer(data)) {
                    this.writeBuffer(bufferWriter, data);
                }
                else if (Array.isArray(data)) {
                    this.writeArray(bufferWriter, data);
                }
                else if (data instanceof Date) {
                    this.writeDate(bufferWriter, data);
                }
                else {
                    this.writeObject(bufferWriter, data);
                }
                break;
            case 'string':
                this.writeString(bufferWriter, data);
                break;
            case 'number':
                this.writeNumber(bufferWriter, data);
                break;
            case 'boolean':
                this.writeBoolean(bufferWriter, data);
                break;
            case 'undefined':
                this.writeFixedContent(bufferWriter, IpcPacketType.Undefined);
                break;
            case 'symbol':
            default:
                break;
        }
    }

    writeBoolean(bufferWriter: Writer, dataBoolean: boolean) {
        const type = dataBoolean ? IpcPacketType.BooleanTrue : IpcPacketType.BooleanFalse;
        this.writeFixedContent(bufferWriter, type);
    }

    // Thanks for parsing coming from https://github.com/tests-always-included/buffer-serializer/
    writeNumber(bufferWriter: Writer, dataNumber: number): void {
        // An integer
        if (Number.isInteger(dataNumber)) {
            const absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    const bufferContent = CreateBufferFor(IpcPacketType.NegativeInteger, IntegerContentSize, absDataNumber);
                    this.writeFixedContent(bufferWriter, IpcPacketType.NegativeInteger, bufferContent);
                }
                // Positive integer
                else {
                    const bufferContent = CreateBufferFor(IpcPacketType.PositiveInteger, IntegerContentSize, absDataNumber);
                    this.writeFixedContent(bufferWriter, IpcPacketType.PositiveInteger, bufferContent);
                }
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Save as a double.
        const bufferContent = CreateBufferFor(IpcPacketType.Double, DoubleContentSize, dataNumber);
        this.writeFixedContent(bufferWriter, IpcPacketType.Double, bufferContent);
    }

    writeDate(bufferWriter: Writer, data: Date) {
        const bufferContent = CreateBufferFor(IpcPacketType.Date, DateContentSize, data.getTime());
        this.writeFixedContent(bufferWriter, IpcPacketType.Date, bufferContent);
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    writeString(bufferWriter: Writer, data: string, encoding?: BufferEncoding): void {
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
        this.writeDynamicBuffer(bufferWriter, IpcPacketType.String, buffer);
    }

    writeBuffer(bufferWriter: Writer, buffer: Buffer): void {
        this.writeDynamicBuffer(bufferWriter, IpcPacketType.Buffer, buffer);
    }

    // Default methods for these kind of data
    writeObject(bufferWriter: Writer, dataObject: any): void {
        const stringifycation = JSONParser.stringify(dataObject);
        const buffer = Buffer.from(stringifycation, 'utf8');
        this.writeDynamicBuffer(bufferWriter, IpcPacketType.ObjectSTRINGIFY, buffer);
    }

    // Default methods for these kind of data
    writeArray(bufferWriter: Writer, args: any[]): void {
        const contentWriter = new BufferListWriter();
        contentWriter.writeUInt32(args.length);
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(contentWriter, args[i]);
        }
        // JSONParser.uninstall();
        this.writeDynamicContent(bufferWriter, IpcPacketType.ArrayWithSize, contentWriter);
    }

    read(bufferReader: Reader): any | undefined {
        if (this.readHeader(bufferReader)) {
            const arg = this._readContent(bufferReader);
            bufferReader.skip(FooterLength);
            return arg;
        }
        // throw err ?
        return undefined;
    }

    protected _readContent(bufferReader: Reader): any | undefined {
        switch (this._type) {
            case IpcPacketType.String:
                return this._readContentString(bufferReader, this._contentSize);

            case IpcPacketType.Buffer:
                return bufferReader.subarray(this._contentSize);

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
                return this._readContentObject(bufferReader);

            case IpcPacketType.Null:
                return null;

            case IpcPacketType.Undefined:
                return undefined;

            default: 
                return undefined;
        }
    }

    // Header has been read and checked
    protected _readContentString(bufferReader: Reader, len: number): string {
        // Encoding will be managed later
        return bufferReader.readString('utf8', len);
    }

    protected _readContentObject(bufferReader: Reader): string {
        const data = bufferReader.readString('utf8', this._contentSize);
        return JSONParser.parse(data);
    }

    // Header has been read and checked
    _readContentArray(bufferReader: Reader): any[] {
        const argsLen = bufferReader.readUInt32();
        const args = new Array(argsLen);
        let argIndex = 0;
        while (argIndex < argsLen) {
            const arg = this.read(bufferReader);
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
        if (this.readHeader(bufferReader)) {
            bufferReader.skip(this._contentSize + FooterLength);
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
        const packetContent = new IpcPacketContent();
        while (index > 0) {
            // Do not decode data just skip
            if (packetContent._byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --index;
        }
        return packetContent.read(bufferReader);
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

        const packetContent = new IpcPacketContent();
        while (start > 0) {
            // Do not decode data just skip
            if (packetContent._byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --start;
            --end;
        }
        const args = new Array(end);
        let argIndex = 0;
        while (argIndex < end) {
            const arg = packetContent.read(bufferReader);
            args[argIndex++] = arg;
        }
        return args;
    }
}
