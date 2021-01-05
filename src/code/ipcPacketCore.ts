// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { IpcPacketType, DynamicHeaderSize, FixedHeaderSize, FooterLength } from './ipcPacketHeader';
import { IpcPacketContent } from './ipcPacketContent';

export class IpcPacketCore extends IpcPacketContent {
    // We save top header info
    protected _writeDynamicBuffer(writer: Writer, type: IpcPacketType, bufferContent: Buffer): void {
        this._rawContent = {
            type,
            headerSize: DynamicHeaderSize,
            contentSize: bufferContent.length
        };
        super._writeDynamicBuffer(writer, type, bufferContent);
    }

    protected _writeDynamicContent(writer: Writer, type: IpcPacketType, writerContent: Writer): void {
        this._rawContent = {
            type,
            headerSize: DynamicHeaderSize,
            contentSize: writerContent.length
        };
        super._writeDynamicContent(writer, type, writerContent);
    }

    protected _writeFixedContent(bufferWriter: Writer, type: IpcPacketType, bufferContent?: Buffer): void {
        this._rawContent = {
            type,
            headerSize: FixedHeaderSize,
            contentSize: bufferContent ? bufferContent.length - FixedHeaderSize - FooterLength : 0
        };
        super._writeFixedContent(bufferWriter, type, bufferContent);
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
        this._writeDynamicContent(bufferWriter, IpcPacketType.ArrayWithSize, contentWriter);
    }

    read(bufferReader: Reader): any | undefined {
        return super.read(bufferReader, (rawContent) => {
            this._rawContent = rawContent;
        });
    }
}
