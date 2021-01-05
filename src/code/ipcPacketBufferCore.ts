import { IpcPacketCore } from './ipcPacketCore';
import { IpcPacketContent } from './ipcPacketContent';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { Writer } from './writer';

export namespace IpcPacketBufferCore {
    export interface RawContent extends IpcPacketContent.RawContent {
        buffer?: Buffer;
        buffers?: Buffer[];
    }
}

export abstract class IpcPacketBufferCore extends IpcPacketCore {
    static readonly EmptyBuffer = Buffer.allocUnsafe(0);

    constructor(rawContent?: IpcPacketBufferCore.RawContent) {
        super(rawContent);
    }

    abstract get buffer(): Buffer;
    abstract get buffers(): Buffer[];

    protected abstract _serializeDone(writer: Writer): void;

    serialize(data: any): void {
        const writer = new BufferListWriter();
        this.write(writer, data);
        this._serializeDone(writer);
    }

    // Caller must be sure and must ensure this is the expected type, else result would be unpredictable
    serializeNumber(data: number): void {
        const writer = new BufferListWriter();
        this.writeNumber(writer, data);
        this._serializeDone(writer);
    }

    serializeBoolean(data: boolean): void {
        const writer = new BufferListWriter();
        this.writeBoolean(writer, data);
        this._serializeDone(writer);
    }

    serializeDate(data: Date):  void {
        const writer = new BufferListWriter();
        this.writeDate(writer, data);
        this._serializeDone(writer);
    }

    serializeString(data: string, encoding?: BufferEncoding): void {
        const writer = new BufferListWriter();
        this.writeString(writer, data, encoding);
        this._serializeDone(writer);
    }

    serializeObject(data: Object):  void {
        const writer = new BufferListWriter();
        this.writeObject(writer, data);
        this._serializeDone(writer);
    }

    serializeBuffer(data: Buffer):  void {
        const writer = new BufferListWriter();
        this.writeBuffer(writer, data);
        this._serializeDone(writer);
    }

    serializeArray(data: any[]):  void {
        const writer = new BufferListWriter();
        this.writeArray(writer, data);
        this._serializeDone(writer);
    }

    protected abstract _parseReader(): Reader;

    parse<T = any>(): T | undefined {
        return this._readContent(this._parseReader(), this._rawContent.type, this._rawContent.contentSize);
    }

    // Caller must be sure and must ensure this is an array, else result would be unpredictable
    parseArrayLength(): number | undefined {
        const bufferReader = this._parseReader();
        return this.readContentArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | undefined {
        const bufferReader = this._parseReader();
        return this.readContentArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | undefined {
        const bufferReader = this._parseReader();
        return this.readContentArraySlice(bufferReader, start, end);
    }
}