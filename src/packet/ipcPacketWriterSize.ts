const whichTypedArray = require('which-typed-array');

import { Writer } from '../buffer/writer';

import { IpcPacketType, MapArrayBufferToShortCodes } from './ipcPacketHeader';
import { FooterSeparator } from './ipcPacketHeader';
import { BufferBooleanFalse, BufferBooleanTrue, BufferFooter, BufferNull, BufferUndefined, IpcPacketWriter } from './ipcPacketWriter';

export class IpcPacketWriterSize extends IpcPacketWriter {
    constructor() {
        super();
    }

    protected _writeDynamicBuffer(writer: Writer, type: IpcPacketType, buffer: Buffer, cb: IpcPacketWriter.Callback): void {
        throw 'not supported';
    }

    protected _writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer, cb: IpcPacketWriter.Callback): void {
        throw 'not supported';
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected _writeFixedContent(writer: Writer, type: IpcPacketType, num: number): void {
        switch (type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger: {
                writer.writeUInt16(type);
                writer.writeUInt32(num);
                writer.writeByte(FooterSeparator);
                break;
            }
            case IpcPacketType.Double:
            case IpcPacketType.Date: {
                writer.writeUInt16(type);
                writer.writeDouble(num);
                writer.writeByte(FooterSeparator);
                break;
            }
            case IpcPacketType.Null:
                writer.writeBuffer(BufferNull);
                break;
            case IpcPacketType.Undefined:
                writer.writeBuffer(BufferUndefined);
                break;
            case IpcPacketType.BooleanFalse:
                writer.writeBuffer(BufferBooleanFalse);
                break;
            case IpcPacketType.BooleanTrue:
                writer.writeBuffer(BufferBooleanTrue);
                break;
            // default :
            //     throw new Error('socket-serializer - write: not expected data');
        }
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    protected _writeString(bufferWriter: Writer, data: string, cb: IpcPacketWriter.Callback) {
        bufferWriter.writeUInt16(IpcPacketType.String);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeString(data);
        bufferWriter.writeByte(FooterSeparator);
    }

    // Default methods for these kind of data
    protected _writeObject(bufferWriter: Writer, dataObject: any, cb: IpcPacketWriter.Callback): void {
        const stringifycation = this._json.stringify(dataObject);
        bufferWriter.writeUInt16(IpcPacketType.ObjectSTRINGIFY);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeString(stringifycation);
        bufferWriter.writeByte(FooterSeparator);
    }

    // Default methods for these kind of data
    protected _writeArray(bufferWriter: Writer, args: any[], cb: IpcPacketWriter.Callback): void {
        bufferWriter.writeUInt16(IpcPacketType.ArrayWithSize);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeUInt32(args.length);
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(bufferWriter, args[i]);
        }
        bufferWriter.writeByte(FooterSeparator);
    }

    protected _writeArrayBuffer(bufferWriter: Writer, data: ArrayBuffer, cb: IpcPacketWriter.Callback): void {
        bufferWriter.writeUInt16(IpcPacketType.ArrayBufferWithSize);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeByte(0);
        bufferWriter.writeArrayBuffer(data);
        bufferWriter.writeByte(FooterSeparator);
    }

    protected _writeTypedArray(bufferWriter: Writer, data: any, cb: IpcPacketWriter.Callback): void {
        const shortCodeDef = MapArrayBufferToShortCodes[whichTypedArray(data)];
        if (shortCodeDef) {
            bufferWriter.writeUInt16(IpcPacketType.ArrayBufferWithSize);
            bufferWriter.writeUInt32(0);
            bufferWriter.writeByte(shortCodeDef.shortCode);
            const arrayBuffer = data.buffer as ArrayBuffer;
            bufferWriter.writeArrayBuffer(arrayBuffer);
            bufferWriter.writeByte(FooterSeparator);
        }
    }
}
