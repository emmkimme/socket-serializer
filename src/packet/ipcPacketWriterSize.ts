import { Writer } from '../buffer/writer';
import { PossibleTypedArrays } from '../utils/types';

import { DynamicHeaderSize, FixedHeaderSize, FooterLength, IpcPacketType, MapArrayBufferToShortCodes } from './ipcPacketHeader';
import { FooterSeparator } from './ipcPacketHeader';
import { BufferBooleanFalse, BufferBooleanTrue, BufferNull, BufferUndefined, IpcPacketWriter } from './ipcPacketWriter';

/** @internal */
export class IpcPacketWriterSize extends IpcPacketWriter {
    constructor() {
        super();
    }

    protected _writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer, cb: IpcPacketWriter.Callback): void {
        throw 'not supported';
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected _writeFixedContent(writer: Writer, type: IpcPacketType, num: number, cb: IpcPacketWriter.Callback): void {
        const len = writer.length;
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
        if (cb) {
            cb({
                type,
                headerSize: FixedHeaderSize,
                contentSize: (writer.length - len) - FixedHeaderSize - FooterLength
            });
        }
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    protected _writeString(bufferWriter: Writer, data: string, cb: IpcPacketWriter.Callback) {
        const len = bufferWriter.length;
        bufferWriter.writeUInt16(IpcPacketType.String);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeString(data);
        bufferWriter.writeByte(FooterSeparator);
        if (cb) {
            cb({
                type: IpcPacketType.String,
                headerSize: FixedHeaderSize,
                contentSize: (bufferWriter.length - len) - DynamicHeaderSize - FooterLength
            });
        }
    }

    // Default methods for these kind of data
    protected _writeObject(bufferWriter: Writer, dataObject: any, cb: IpcPacketWriter.Callback): void {
        const stringifycation = this._json.stringify(dataObject);
        const len = bufferWriter.length;
        bufferWriter.writeUInt16(IpcPacketType.ObjectSTRINGIFY);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeString(stringifycation);
        bufferWriter.writeByte(FooterSeparator);
        if (cb) {
            cb({
                type: IpcPacketType.ObjectSTRINGIFY,
                headerSize: DynamicHeaderSize,
                contentSize: (bufferWriter.length - len) - DynamicHeaderSize - FooterLength
            });
        }
    }

    // Default methods for these kind of data
    protected _writeArray(bufferWriter: Writer, args: any[], cb: IpcPacketWriter.Callback): void {
        const len = bufferWriter.length;
        bufferWriter.writeUInt16(IpcPacketType.ArrayWithSize);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeUInt32(args.length);
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(bufferWriter, args[i]);
        }
        bufferWriter.writeByte(FooterSeparator);
        if (cb) {
            cb({
                type: IpcPacketType.ArrayWithSize,
                headerSize: DynamicHeaderSize,
                contentSize: (bufferWriter.length - len) - DynamicHeaderSize - FooterLength
            });
        }
    }

    protected _writeArrayBuffer(bufferWriter: Writer, data: ArrayBuffer, cb: IpcPacketWriter.Callback): void {
        const len = bufferWriter.length;
        bufferWriter.writeUInt16(IpcPacketType.ArrayBufferWithSize);
        bufferWriter.writeUInt32(0);
        bufferWriter.writeByte(0);
        bufferWriter.writeArrayBuffer(data);
        bufferWriter.writeByte(FooterSeparator);
        if (cb) {
            cb({
                type: IpcPacketType.ArrayBufferWithSize,
                headerSize: DynamicHeaderSize,
                contentSize: (bufferWriter.length - len) - DynamicHeaderSize - FooterLength
            });
        }
    }

    protected _writeTypedArray(bufferWriter: Writer, data: any, arrayType: PossibleTypedArrays, cb: IpcPacketWriter.Callback): void {
        const shortCodeDef = MapArrayBufferToShortCodes[arrayType];
        if (shortCodeDef) {
            const len = bufferWriter.length;
            bufferWriter.writeUInt16(IpcPacketType.ArrayBufferWithSize);
            bufferWriter.writeUInt32(0);
            bufferWriter.writeByte(shortCodeDef.shortCode);
            const arrayBuffer = data.buffer as ArrayBuffer;
            bufferWriter.writeArrayBuffer(arrayBuffer);
            bufferWriter.writeByte(FooterSeparator);
            if (cb) {
                cb({
                    type: IpcPacketType.ArrayBufferWithSize,
                    headerSize: DynamicHeaderSize,
                    contentSize: (bufferWriter.length - len) - DynamicHeaderSize - FooterLength
                });
            }
        }
    }
}
