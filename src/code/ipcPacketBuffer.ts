import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { BufferType } from './ipcPacketContent';

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

    protected _serializeAndCheck(checker: () => boolean, data: any): boolean {
        const bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
        return checker.call(this);
    }

    serializeString(data: string, encoding?: BufferEncoding): boolean {
        const bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
        return this.isString();
    }

    protected _parseAndCheck(checker: () => boolean): any {
        if (checker.call(this)) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readContent(0, bufferReader);
        }
        return null;
    }

    parseArrayLength(): number | null {
        if (this.isArray()) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArrayLength(bufferReader);
        }
        return null;
    }

    parseArrayAt(index: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArrayAt(bufferReader, index);
        }
        return null;
    }

    parseArraySlice(start?: number, end?: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferReader(this._buffer, this._headerSize);
            return this._readArraySlice(bufferReader, start, end);
        }
        return null;
    }
}