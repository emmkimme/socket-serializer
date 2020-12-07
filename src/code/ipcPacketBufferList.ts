import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { BufferListReader } from './bufferListReader';
import { BufferType } from './ipcPacketContent';

export namespace IpcPacketBufferList {
    export type RawContent = IpcPacketBufferCore.RawContent;
}

export class IpcPacketBufferList extends IpcPacketBufferCore {
    private _buffers: Buffer[];

    constructor(rawContent?: IpcPacketBufferList.RawContent) {
        super(rawContent);
        if (rawContent) {
            // buffer is faster take it when available
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

    private _singleBufferAvailable(): Buffer | null {
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
            if (bufferReader.checkEOF(packetSize)) {
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
        const isComplete = this._readHeader(bufferReader);
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
        const isComplete = this._readHeader(new BufferReader(buffer));
        if (isComplete) {
            this._buffers = [buffer];
        }
        else {
            this._buffers = [];
        }
        return isComplete;
    }

    protected _serializeAndCheck(checker: () => boolean, data: any): boolean {
        const bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffers = bufferWriter.buffers;
        return checker.call(this);
    }

    serializeString(data: string, encoding?: BufferEncoding): boolean {
        const bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffers = bufferWriter.buffers;
        return this.isString();
    }

    protected _parseAndCheck(checker: () => boolean): any {
        if (checker.call(this)) {
            const buffer = this._singleBufferAvailable();
            const bufferReader = buffer ? new BufferReader(buffer) : new BufferListReader(this._buffers);
            bufferReader.seek(this._headerSize);
            return this._readContent(0, bufferReader);
        }
        return null;
    }

    parseArrayLength(): number | null {
        if (this.isArray()) {
            const buffer = this._singleBufferAvailable();
            const bufferReader = buffer ? new BufferReader(buffer) : new BufferListReader(this._buffers);
            bufferReader.seek(this._headerSize);
            return this._readArrayLength(bufferReader);
        }
        return null;
    }

    parseArrayAt(index: number): any | null {
        if (this.isArray()) {
            const buffer = this._singleBufferAvailable();
            const bufferReader = buffer ? new BufferReader(buffer) : new BufferListReader(this._buffers);
            bufferReader.seek(this._headerSize);
            return this._readArrayAt(bufferReader, index);
        }
        return null;
    }

    parseArraySlice(start?: number, end?: number): any | null {
        if (this.isArray()) {
            const buffer = this._singleBufferAvailable();
            const bufferReader = buffer ? new BufferReader(buffer) : new BufferListReader(this._buffers);
            bufferReader.seek(this._headerSize);
            return this._readArraySlice(bufferReader, start, end);
        }
        return null;
    }
}