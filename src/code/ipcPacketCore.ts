// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { IpcPacketType, DynamicHeaderSize, FixedHeaderSize, FooterLength } from './ipcPacketHeader';
import { IpcPacketContent } from './ipcPacketContent';

export class IpcPacketCore extends IpcPacketContent {
    // We save top header info
    protected writeDynamicBuffer(writer: Writer, type: IpcPacketType, bufferContent: Buffer): void {
        this._partialContent = false;
        this._type = type;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = bufferContent.length;
        super.writeDynamicBuffer(writer, type, bufferContent);
    }

    protected writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer): void {
        this._partialContent = false;
        this._type = type;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = writerContent.length;
        super.writeDynamicContent(writer, type, writerContent);
    }

    protected writeFixedContent(bufferWriter: Writer, type: IpcPacketType, bufferContent?: Buffer): void {
        this._partialContent = false;
        this._type = type;
        this._headerSize = FixedHeaderSize;
        this._contentSize = bufferContent ? bufferContent.length - FixedHeaderSize - FooterLength : 0;
        super.writeFixedContent(bufferWriter, type, bufferContent);
    }

    // We create an IpcPacketContent to keep current top header info untouched
    writeArray(bufferWriter: Writer, args: any[]): void {
        const contentWriter = new BufferListWriter();
        // Add args.length size
        contentWriter.writeUInt32(args.length);
        // JSONParser.install();
        const packetContent = new IpcPacketContent();
        for (let i = 0, l = args.length; i < l; ++i) {
            packetContent.write(contentWriter, args[i]);
        }
        // JSONParser.uninstall();
        this.writeDynamicContent(bufferWriter, IpcPacketType.ArrayWithSize, contentWriter);
    }

    // We create an IpcPacketContent to keep current top header info untouched
    _readContentArray(bufferReader: Reader): any[] {
        const packetContent = new IpcPacketContent();
        return packetContent._readContentArray(bufferReader);
    }
}
