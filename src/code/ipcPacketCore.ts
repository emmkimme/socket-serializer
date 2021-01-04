// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { IpcPacketType, DynamicHeaderSize, FixedHeaderSize, FooterLength } from './ipcPacketHeader';
import { IpcPacketContent } from './ipcPacketContent';

export class IpcPacketCore extends IpcPacketContent {
    // We save top header info
    protected writeDynamicBuffer(writer: Writer, bufferType: IpcPacketType, bufferContent: Buffer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = bufferContent.length;
        super.writeDynamicBuffer(writer, bufferType, bufferContent);
    }

    protected writeDynamicContent(writer: Writer, bufferType: IpcPacketType, writerContent: Writer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = DynamicHeaderSize;
        this._contentSize = writerContent.length;
        super.writeDynamicContent(writer, bufferType, writerContent);
    }

    protected writeFixedContent(bufferWriter: Writer, bufferType: IpcPacketType, bufferContent?: Buffer): void {
        this._partialContent = false;
        this._type = bufferType;
        this._headerSize = FixedHeaderSize;
        this._contentSize = bufferContent ? bufferContent.length - FixedHeaderSize - FooterLength : 0;
        super.writeFixedContent(bufferWriter, bufferType, bufferContent);
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
