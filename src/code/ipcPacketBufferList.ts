import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListReader } from './bufferListReader';
import { IpcPacketHeader } from './ipcPacketHeader';
import { BufferListWriter } from './bufferListWriter';

export namespace IpcPacketBufferList {
    export type RawContent = IpcPacketBufferCore.RawData;
}

export class IpcPacketBufferList extends IpcPacketBufferCore {
    private _buffers: Buffer[];

    constructor(rawHeader?: IpcPacketBufferList.RawContent) {
        super(rawHeader);
        if (rawHeader) {
            // buffer is faster, take it when available
            if (rawHeader.buffer) {
                this._buffers = [rawHeader.buffer];
            }
            else if (rawHeader.buffers) {
                this._buffers = rawHeader.buffers;
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

    setRawData(rawHeader: IpcPacketBufferList.RawContent): void {
        super.setRawData(rawHeader);
        if (rawHeader) {
            // Parsing a single buffer is faster, take it when available
            if (rawHeader.buffer) {
                this._buffers = [rawHeader.buffer];
            }
            else if (rawHeader.buffers) {
                this._buffers = rawHeader.buffers;
            }
        }
        this._buffers = this._buffers || [];
    }

    getRawData(): IpcPacketBufferList.RawContent {
        const rawHeader : IpcPacketBufferList.RawContent = {
            ...this._rawHeader
        };
        const buffer = this._singleBufferAvailable();
        if (buffer) {
            rawHeader.buffer = buffer;
        }
        else {
            rawHeader.buffers = this._buffers;
        }
        return rawHeader;
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        this._rawHeader = IpcPacketHeader.ReadHeader(bufferReader);
        bufferReader.setContext(context);
        if (this._rawHeader.contentSize >= 0) {
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
        this._rawHeader = IpcPacketHeader.ReadHeader(new BufferReader(buffer));
        if (this._rawHeader.contentSize >= 0) {
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
        const bufferReader = buffer ? new BufferReader(buffer, this._rawHeader.headerSize) : new BufferListReader(this._buffers, this._rawHeader.headerSize);
        return bufferReader;
    }

    serialize(data: any): void {
        const writer = new BufferListWriter();
        this.write(writer, data);
        this._buffers = writer.buffers;
    }
}