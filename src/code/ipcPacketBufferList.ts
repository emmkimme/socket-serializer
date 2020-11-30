import { IpcPacketBufferCore } from './ipcPacketBufferCore';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { BufferListReader } from './bufferListReader';

export namespace IpcPacketBufferList {
    export type RawContent = IpcPacketBufferCore.RawContent;
}

export class IpcPacketBufferList extends IpcPacketBufferCore {
    private _buffers: Buffer[];

    constructor(rawContent?: IpcPacketBufferList.RawContent) {
        super(rawContent);
        this._buffers = rawContent ? [rawContent.buffer] : [];
    }

    reset(): void {
        super.reset();
        this._buffers = [];
    }

    get buffers(): Buffer[] {
        return this._buffers;
    }

    get buffer(): Buffer {
        if (this._buffers.length === 0) {
            return Buffer.allocUnsafe(0);
        }
        if (this._buffers.length > 1) {
            this._buffers = [ Buffer.concat(this._buffers)];
        }
        return this._buffers[0];
    }

    setRawContent(rawContent: IpcPacketBufferList.RawContent): void {
        super.setRawContent(rawContent);
        this._buffers = [rawContent.buffer];
    }

    getRawContent(): IpcPacketBufferList.RawContent {
        const rawContent : IpcPacketBufferList.RawContent = {
            type: this._type,
            contentSize: this._contentSize,
            partial: this._partial,
            buffer: this.buffer
        };
        return rawContent;
    }

    keepDecodingFromReader(bufferReader: Reader): boolean {
        if (this._partial) {
            const packetSize = this.packetSize;
            if (bufferReader.checkEOF(packetSize)) {
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
        const result = this._readHeader(new BufferReader(buffer));
        if (result) {
            this._buffers = [buffer];
        }
        else {
            this._buffers = [];
        }
        return result;
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
            const bufferReader = new BufferListReader(this._buffers, this._headerSize);
            return this._readContent(0, bufferReader);
        }
        return null;
    }

    parseArrayLength(): number | null {
        if (this.isArray()) {
            const bufferReader = new BufferListReader(this._buffers, this._headerSize);
            return this._readArrayLength(bufferReader);
        }
        return null;
    }

    parseArrayAt(index: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferListReader(this._buffers, this._headerSize);
            return this._readArrayAt(bufferReader, index);
        }
        return null;
    }

    parseArraySlice(start?: number, end?: number): any | null {
        if (this.isArray()) {
            const bufferReader = new BufferListReader(this._buffers, this._headerSize);
            return this._readArraySlice(bufferReader, start, end);
        }
        return null;
    }
}