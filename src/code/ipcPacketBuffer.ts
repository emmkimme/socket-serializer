import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { Writer } from './writer';
import { IpcPacketHeader } from './ipcPacketHeader';

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
            ...this._rawContent,
            buffer: this._buffer
        };
        return rawContent;
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        this._rawContent = IpcPacketHeader.ReadHeader(bufferReader);
        bufferReader.setContext(context);
        if (this._rawContent.contentSize >= 0) {
            this._buffer = bufferReader.subarray(this.packetSize);
            return true;
        }
        else {
            this._buffer = IpcPacketBufferCore.EmptyBuffer;
            return false;
        }
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        this._rawContent = IpcPacketHeader.ReadHeader(new BufferReader(buffer));
        if (this._rawContent.contentSize >= 0) {
            this._buffer = buffer;
            return true;
        }
        else {
            this._buffer = IpcPacketBufferCore.EmptyBuffer;
            return false;
        }
    }

    protected _parseReader(): Reader {
        const bufferReader = new BufferReader(this._buffer, this._rawContent.headerSize);
         return bufferReader;
     }
 
    protected _serializeDone(writer: Writer) {
        this._buffer = writer.buffer;
    }
}
 