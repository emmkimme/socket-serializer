// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { BufferType, DynamicHeaderSize, FixedHeaderSize, ArrayFieldSize, IpcPacketCore } from './ipcPacketCore';

export class IpcPacketContent extends IpcPacketCore {
    constructor(rawContent?: IpcPacketCore.RawContent) {
        super(rawContent);
    }

    protected pushDynamicContent(writer: Writer, bufferType: BufferType, contentSize: number): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = contentSize;

        super.pushDynamicContent(writer, bufferType, contentSize);
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected writeFixedSize(bufferWriter: Writer, bufferType: BufferType, contentSize: number, num: number): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = FixedHeaderSize;
        this._contentSize = contentSize;

        super.writeFixedSize(bufferWriter, bufferType, contentSize, num);
    }

    // Default methods for these kind of data
    writeArray(bufferWriter: Writer, args: any[]): void {
        const packetCore = new IpcPacketCore();
        const contentBufferWriter = new BufferListWriter();
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            packetCore.write(contentBufferWriter, args[i]);
        }
        // JSONParser.uninstall();
        // Add args.length size
        const contentSize = contentBufferWriter.length + ArrayFieldSize;
        this.pushDynamicContent(bufferWriter, BufferType.ArrayWithSize, contentSize);
        bufferWriter.writeUInt32(args.length);
        bufferWriter.write(contentBufferWriter);
        this.popContent(bufferWriter);
    }

    // Header has been read and checked
    protected _readObjectDirect(bufferReader: Reader): any {
        // Preserve the top type/content size
        const packetCore = new IpcPacketCore();

        const offsetContentSize = bufferReader.offset + this._contentSize;
        const dataObject: any = {};
        while (bufferReader.offset < offsetContentSize) {
            let keyLen = bufferReader.readUInt32();
            let key = bufferReader.readString('utf8', keyLen);
            dataObject[key] = packetCore.read(bufferReader);
        }
        return dataObject;
    }

    // Header has been read and checked
    readArray(bufferReader: Reader): any[] {
        const packetCore = new IpcPacketCore();
        return packetCore.readArray(bufferReader);
    }

    // Header has been read and checked
    readArrayAt(bufferReader: Reader, index: number): any | undefined {
        const packetCore = new IpcPacketCore();
        return packetCore.readArrayAt(bufferReader, index);
    }

    readArraySlice(bufferReader: Reader, start?: number, end?: number): any | undefined {
        const packetCore = new IpcPacketCore();
        return packetCore.readArraySlice(bufferReader, start, end);
    }
}
