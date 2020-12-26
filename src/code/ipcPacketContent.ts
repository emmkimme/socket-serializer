// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { BufferType, DynamicHeaderSize, FixedHeaderSize, IpcPacketCore, FooterLength } from './ipcPacketCore';

export class IpcPacketContent extends IpcPacketCore {
    constructor(rawContent?: IpcPacketCore.RawContent) {
        super(rawContent);
    }

    protected writeDynamicBuffer(writer: Writer, bufferType: BufferType, bufferContent: Buffer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = bufferContent.length;

        super.writeDynamicBuffer(writer, bufferType, bufferContent);
    }

    protected writeDynamicContent(writer: Writer, bufferType: BufferType, writerContent: Writer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = writerContent.length;

        super.writeDynamicContent(writer, bufferType, writerContent);
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected writeFixedContent(bufferWriter: Writer, bufferType: BufferType, bufferContent?: Buffer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = FixedHeaderSize;
        this._contentSize = bufferContent ? bufferContent.length - FixedHeaderSize - FooterLength : 0;
        super.writeFixedContent(bufferWriter, bufferType, bufferContent);
    }

    // Default methods for these kind of data
    writeArray(bufferWriter: Writer, args: any[]): void {
        const packetCore = new IpcPacketCore();
        const contentWriter = new BufferListWriter();
        contentWriter.writeUInt32(args.length);
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            packetCore.write(contentWriter, args[i]);
        }
        // JSONParser.uninstall();
        // Add args.length size
        this.writeDynamicContent(bufferWriter, BufferType.ArrayWithSize, contentWriter);
    }

    // Header has been read and checked
    _readContentObjectDirect(bufferReader: Reader): any {
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
    _readContentArray(bufferReader: Reader): any[] {
        const packetCore = new IpcPacketCore();
        return packetCore._readContentArray(bufferReader);
    }

    // Header has been read and checked
    _readContentArrayAt(bufferReader: Reader, index: number): any | undefined {
        const packetCore = new IpcPacketCore();
        return packetCore._readContentArrayAt(bufferReader, index);
    }

    _readContentArraySlice(bufferReader: Reader, start?: number, end?: number): any | undefined {
        const packetCore = new IpcPacketCore();
        return packetCore._readContentArraySlice(bufferReader, start, end);
    }
}
