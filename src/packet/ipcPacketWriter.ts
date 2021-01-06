import { JSONParser } from 'json-helpers';

import { Writer } from '../buffer/writer';
import { BufferListWriter } from '../buffer/bufferListWriter';
import { BufferWriter } from '../buffer/bufferWriter';

import { IpcPacketType, FooterLength, FixedHeaderSize, IpcPacketHeader, DynamicHeaderSize } from './ipcPacketHeader';
import { FooterSeparator } from './ipcPacketHeader';
import { DoubleContentSize, IntegerContentSize } from './ipcPacketHeader';

function CreateZeroSizeBuffer(bufferType: IpcPacketType): Buffer {
    // assert(this.isFixedSize() === true);
    // Write the whole in one block buffer, to avoid multiple small buffers
    const packetSize = FixedHeaderSize + FooterLength;
    const bufferWriterAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
    bufferWriterAllInOne.writeUInt16(bufferType);
    bufferWriterAllInOne.writeByte(FooterSeparator);
    return bufferWriterAllInOne.buffer;
}

const BufferFooter = Buffer.allocUnsafe(1).fill(FooterSeparator);
const BufferBooleanTrue = CreateZeroSizeBuffer(IpcPacketType.BooleanTrue);
const BufferBooleanFalse = CreateZeroSizeBuffer(IpcPacketType.BooleanFalse);
const BufferUndefined = CreateZeroSizeBuffer(IpcPacketType.Undefined);
const BufferNull = CreateZeroSizeBuffer(IpcPacketType.Null);

export namespace IpcPacketWriter {
    export type Callback = (rawHeader: IpcPacketHeader.RawData) => void;
}

export class IpcPacketWriter {
    constructor() {
    }

    protected _writeDynamicBuffer(writer: Writer, type: IpcPacketType, packetBuffer: Buffer, cb: IpcPacketWriter.Callback): void {
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

    protected _writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer, cb: IpcPacketWriter.Callback): void {
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
    protected _writeFixedContent(writer: Writer, type: IpcPacketType, num: number, cb: IpcPacketWriter.Callback): void {
        let packetBuffer: Buffer;
        switch (type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger: {
                const packetSize = FixedHeaderSize + IntegerContentSize + FooterLength;
                const bufferWriterAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
                bufferWriterAllInOne.writeUInt16(type);
                bufferWriterAllInOne.writeUInt32(num);
                bufferWriterAllInOne.writeByte(FooterSeparator);
                packetBuffer = bufferWriterAllInOne.buffer;
                break;
            }

            case IpcPacketType.Double:
            case IpcPacketType.Date: {
                const packetSize = FixedHeaderSize + DoubleContentSize + FooterLength;
                const bufferWriterAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
                bufferWriterAllInOne.writeUInt16(type);
                bufferWriterAllInOne.writeDouble(num);
                bufferWriterAllInOne.writeByte(FooterSeparator);
                packetBuffer = bufferWriterAllInOne.buffer;
                break;
            }
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
    write(bufferWriter: Writer, data: any, cb?: IpcPacketWriter.Callback): void {
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
    protected _writeNumber(bufferWriter: Writer, dataNumber: number, cb: IpcPacketWriter.Callback): void {
        // An integer
        if (Number.isInteger(dataNumber)) {
            const absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    this._writeFixedContent(bufferWriter, IpcPacketType.NegativeInteger, absDataNumber, cb);
                }
                // Positive integer
                else {
                    this._writeFixedContent(bufferWriter, IpcPacketType.PositiveInteger, absDataNumber, cb);
                }
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Save as a double.
        this._writeFixedContent(bufferWriter, IpcPacketType.Double, dataNumber, cb);
    }

    protected _writeDate(bufferWriter: Writer, data: Date, cb: IpcPacketWriter.Callback) {
        this._writeFixedContent(bufferWriter, IpcPacketType.Date, data.getTime(), cb);
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    protected _writeString(bufferWriter: Writer, data: string, cb: IpcPacketWriter.Callback) {
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
    protected _writeObject(bufferWriter: Writer, dataObject: any, cb: IpcPacketWriter.Callback): void {
        const stringifycation = JSONParser.stringify(dataObject);
        const buffer = Buffer.from(stringifycation, 'utf8');
        this._writeDynamicBuffer(bufferWriter, IpcPacketType.ObjectSTRINGIFY, buffer, cb);
    }

    // Default methods for these kind of data
    protected _writeArray(bufferWriter: Writer, args: any[], cb: IpcPacketWriter.Callback): void {
        const contentWriter = new BufferListWriter();
        contentWriter.writeUInt32(args.length);
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(contentWriter, args[i]);
        }
        // JSONParser.uninstall();
        this._writeDynamicContent(bufferWriter, IpcPacketType.ArrayWithSize, contentWriter, cb);
    }
}
