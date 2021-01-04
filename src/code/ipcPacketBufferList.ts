import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListReader } from './bufferListReader';
import { Writer } from './writer';

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
            type: this._type,
            contentSize: this._contentSize,
            partialContent: this._partialContent,
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

    keepDecodingFromReader(bufferReader: Reader): boolean {
        if (this._partialContent) {
            const packetSize = this.packetSize;
            if (bufferReader.checkEOF(packetSize) === false) {
                this._partialContent = false;
                this._buffers = bufferReader.subarrayList(packetSize);
                return true;
            }
            else {
                this._buffers = [];
                return false;
            }
        }
        return this.decodeFromReader(bufferReader);
    }

    // Allocate its own buffer
    decodeFromReader(bufferReader: Reader): boolean {
        // Do not modify offset
        const context = bufferReader.getContext();
        const isComplete = this.readHeader(bufferReader);
        bufferReader.setContext(context);
        if (isComplete) {
            this._buffers = bufferReader.subarrayList(this.packetSize);
        }
        else {
            this._buffers = [];
        }
        return isComplete;
    }

    // Add ref to the buffer
    decodeFromBuffer(buffer: Buffer): boolean {
        const isComplete = this.readHeader(new BufferReader(buffer));
        if (isComplete) {
            this._buffers = [buffer];
        }
        else {
            this._buffers = [];
        }
        return isComplete;
    }

    protected _parseReader(): Reader {
        const buffer = this._singleBufferAvailable();
        const bufferReader = buffer ? new BufferReader(buffer, this._headerSize) : new BufferListReader(this._buffers, this._headerSize);
        return bufferReader;
    }

    protected _serializeDone(writer: Writer) {
        this._buffers = writer.buffers;
    }
}