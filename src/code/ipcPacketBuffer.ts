import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';

export namespace IpcPacketBuffer {
    export type RawContent = IpcPacketBufferCore.RawContent;
}

export class IpcPacketBuffer extends IpcPacketBufferCore {
    private _buffer: Buffer;

    constructor(rawContent?: IpcPacketBuffer.RawContent) {
        super(rawContent);
        if (rawContent) {
            if (rawContent.buffer) {
                this._buffer = rawContent.buffer;
            }
            else if (rawContent.buffers) {
                this._buffer = Buffer.concat(rawContent.buffers);
            }
        }
        this._buffer = this._buffer || IpcPacketBufferCore.EmptyBuffer;
    }

    reset(): void {
        super.reset();
        this._buffer = IpcPacketBufferCore.EmptyBuffer;
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    get buffers(): Buffer[] {
        return [this._buffer];
    }

    protected _parseReader(): Reader {
       const bufferReader = new BufferReader(this._buffer, this._headerSize);
        return bufferReader;
    }

    setRawContent(rawContent: IpcPacketBuffer.RawContent): void {
        super.setRawContent(rawContent);
        if (rawContent) {
            if (rawContent.buffer) {
                this._buffer = rawContent.buffer;
            }
            else if (rawContent.buffers) {
                this._buffer = Buffer.concat(rawContent.buffers);
            }
        }
        this._buffer = this._buffer || IpcPacketBufferCore.EmptyBuffer;
    }

    getRawContent(): IpcPacketBuffer.RawContent {
        const rawContent : IpcPacketBuffer.RawContent = {
            type: this._type,
            contentSize: this._contentSize,
            partialContent: this._partialContent,
            buffer: this._buffer
        };
        return rawContent;
    }

    keepDecodingFromReader(bufferReader: Reader): boolean {
        if (this._partialContent) {
            const packetSize = this.packetSize;
            if (bufferReader.checkEOF(packetSize) === false) {
                this._partialContent = false;
                this._buffer = bufferReader.subarray(packetSize);
                return true;
            }
            else {
                this._buffer = IpcPacketBufferCore.EmptyBuffer;
                return false;
            }
        }
        return this.decodeFromReader(bufferReader);
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        const isComplete = this._readHeader(bufferReader);
        bufferReader.setContext(context);
        if (isComplete) {
            this._buffer = bufferReader.subarray(this.packetSize);
        }
        else {
            this._buffer = IpcPacketBufferCore.EmptyBuffer;
        }
        return isComplete;
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        const isComplete = this._readHeader(new BufferReader(buffer));
        if (isComplete) {
            this._buffer = buffer;
        }
        else {
            this._buffer = IpcPacketBufferCore.EmptyBuffer;
        }
        return isComplete;
    }

    serialize(data: any, checker?: () => boolean): boolean {
        const writer = new BufferListWriter();
        this.write(writer, data);
        this._buffer = writer.buffer;
        return checker ? checker.call(this) : true;
    }

    // FOR PERFORMANCE PURPOSE, do not check the inner type, trust the caller
    serializeNumber(data: number): void {
        const writer = new BufferListWriter();
        this.writeNumber(writer, data);
        this._buffer = writer.buffer;
    }

    serializeBoolean(data: boolean): void {
        const writer = new BufferListWriter();
        this.writeBoolean(writer, data);
        this._buffer = writer.buffer;
    }

    serializeDate(data: Date):  void {
        const writer = new BufferListWriter();
        this.writeDate(writer, data);
        this._buffer = writer.buffer;
    }

    serializeString(data: string, encoding?: BufferEncoding): void {
        const writer = new BufferListWriter();
        this.writeString(writer, data, encoding);
        this._buffer = writer.buffer;
    }

    serializeObject(data: Object):  void {
        const writer = new BufferListWriter();
        this.writeObject(writer, data);
        this._buffer = writer.buffer;
    }

    serializeBuffer(data: Buffer):  void {
        const writer = new BufferListWriter();
        this.writeBuffer(writer, data);
        this._buffer = writer.buffer;
    }

    serializeArray(data: any[]):  void {
        const writer = new BufferListWriter();
        this.writeArray(writer, data);
        this._buffer = writer.buffer;
    }
}
 