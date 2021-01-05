import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListReader } from './bufferListReader';
import { IpcPacketHeader } from './ipcPacketHeader';
import { BufferListWriter } from './bufferListWriter';

export namespace IpcPacketBufferList {
    export type RawContent = IpcPacketBufferCore.RawContent;
}

export class IpcPacketBufferList extends IpcPacketBufferCore {
    private _buffers: Buffer[];

    constructor(rawContent?: IpcPacketBufferList.RawContent) {
        super(rawContent);
        if (rawContent) {
            // buffer is faster, take it when available
            if (rawContent.buffer) {
                this._buffers = [rawContent.buffer];
            }
            else if (rawContent.buffers) {
                this._buffers = rawContent.buffers;
            }
        }
        this._buffers = this._buffers || [];
    }

    reset(): void {
        super.reset();
        this._buffers = [];
    }

    get buffers(): Buffer[] {
        return this._buffers;
    }

    get buffer(): Buffer {
        const buffer = this._singleBufferAvailable();
        if (buffer) {
            return buffer;
        }
        this._buffers = [Buffer.concat(this._buffers)];
        return this._buffers[0];
    }

    protected _singleBufferAvailable(): Buffer | null {
        if (this._buffers.length === 1) {
            return this._buffers[0];
        }
        if (this._buffers.length === 0) {
            return IpcPacketBufferCore.EmptyBuffer;
        }
        return null;
    }

    setRawContent(rawContent: IpcPacketBufferList.RawContent): void {
        super.setRawContent(rawContent);
        if (rawContent) {
            // Parsing a single buffer is faster, take it when available
            if (rawContent.buffer) {
                this._buffers = [rawContent.buffer];
            }
            else if (rawContent.buffers) {
                this._buffers = rawContent.buffers;
            }
        }
        this._buffers = this._buffers || [];
    }

    getRawContent(): IpcPacketBufferList.RawContent {
        const rawContent : IpcPacketBufferList.RawContent = {
            ...this._rawContent
        };
        const buffer = this._singleBufferAvailable();
        if (buffer) {
            rawContent.buffer = buffer;
        }
        else {
            rawContent.buffers = this._buffers;
        }
        return rawContent;
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        this._rawContent = IpcPacketHeader.ReadHeader(bufferReader);
        bufferReader.setContext(context);
        if (this._rawContent.contentSize >= 0) {
            this._buffers = bufferReader.subarrayList(this.packetSize);
            return true;
        }
        else {
            this._buffers = [];
            return false;
        }
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        this._rawContent = IpcPacketHeader.ReadHeader(new BufferReader(buffer));
        if (this._rawContent.contentSize >= 0) {
            this._buffers = [buffer];
            return true;
        }
        else {
            this._buffers = [];
            return false;
        }
    }

    protected _parseReader(): Reader {
        const buffer = this._singleBufferAvailable();
        const bufferReader = buffer ? new BufferReader(buffer, this._rawContent.headerSize) : new BufferListReader(this._buffers, this._rawContent.headerSize);
        return bufferReader;
    }

    serialize(data: any): void {
        const writer = new BufferListWriter();
        this.write(writer, data);
        this._buffers = writer.buffers;
    }
}