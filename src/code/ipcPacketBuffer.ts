import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { IpcPacketHeader } from './ipcPacketHeader';
import { BufferListWriter } from './bufferListWriter';

export namespace IpcPacketBuffer {
    export type RawData = IpcPacketBufferCore.RawData;
}

export class IpcPacketBuffer extends IpcPacketBufferCore {
    private _buffer: Buffer;

    constructor(rawHeader?: IpcPacketBuffer.RawData) {
        super(rawHeader);
        if (rawHeader) {
            if (rawHeader.buffer) {
                this._buffer = rawHeader.buffer;
            }
            else if (rawHeader.buffers) {
                this._buffer = Buffer.concat(rawHeader.buffers);
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

    setRawData(rawHeader: IpcPacketBuffer.RawData): void {
        super.setRawData(rawHeader);
        if (rawHeader) {
            if (rawHeader.buffer) {
                this._buffer = rawHeader.buffer;
            }
            else if (rawHeader.buffers) {
                this._buffer = Buffer.concat(rawHeader.buffers);
            }
        }
        this._buffer = this._buffer || IpcPacketBufferCore.EmptyBuffer;
    }

    getRawData(): IpcPacketBuffer.RawData {
        const rawHeader : IpcPacketBuffer.RawData = {
            ...this._rawHeader,
            buffer: this._buffer
        };
        return rawHeader;
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        this._rawHeader = IpcPacketHeader.ReadHeader(bufferReader);
        bufferReader.setContext(context);
        if (this._rawHeader.contentSize >= 0) {
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
        this._rawHeader = IpcPacketHeader.ReadHeader(new BufferReader(buffer));
        if (this._rawHeader.contentSize >= 0) {
            this._buffer = buffer;
            return true;
        }
        else {
            this._buffer = IpcPacketBufferCore.EmptyBuffer;
            return false;
        }
    }

    protected _parseReader(): Reader {
        const bufferReader = new BufferReader(this._buffer, this._rawHeader.headerSize);
         return bufferReader;
     }
 
     serialize(data: any): void {
        const writer = new BufferListWriter();
        this.write(writer, data);
        this._buffer = writer.buffer;
    }
}
 