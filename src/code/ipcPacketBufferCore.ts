import { IpcPacketContent } from './ipcPacketContent';
import { Reader } from './reader';

export namespace IpcPacketBufferCore {
    export interface RawContent extends IpcPacketContent.RawContent {
        buffer?: Buffer;
        buffers?: Buffer[];
    }
}

export abstract class IpcPacketBufferCore extends IpcPacketContent {
    static readonly EmptyBuffer = Buffer.allocUnsafe(0);

    constructor(rawContent?: IpcPacketBufferCore.RawContent) {
        super(rawContent);
    }

    abstract get buffer(): Buffer;
    abstract get buffers(): Buffer[];

    protected abstract _serialize(serializer: (...args: any[]) => void, ...args: any[]): void;

    serialize(data: any): void {
        this._serialize(this.write, data);
    }

    // Caller must be sure and must ensure this is the expected type, else result would be unpredictable
    serializeNumber(data: number): void {
        this._serialize(this.writeNumber, data);
    }

    serializeBoolean(data: boolean): void {
        this._serialize(this.writeBoolean, data);
    }

    serializeDate(data: Date):  void {
        this._serialize(this.writeDate, data);
    }

    serializeString(data: string, encoding?: BufferEncoding): void {
        this._serialize(this.writeString, data, encoding);
    }

    serializeObject(data: Object):  void {
        this._serialize(this.writeObject, data);
    }

    serializeBuffer(data: Buffer):  void {
        this._serialize(this.writeBuffer, data);
    }

    serializeArray(data: any[]):  void {
        this._serialize(this.writeArray, data);
    }

    protected abstract _parseReader(): Reader;

    parse<T = any>(): T | undefined {
        return this._readContent(0, this._parseReader());
    }

    // Caller must be sure and must ensure this is an array, else result would be unpredictable
    parseArrayLength(): number | undefined {
        const bufferReader = this._parseReader();
        return this._readArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | undefined {
        const bufferReader = this._parseReader();
        return this._readArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | undefined {
        const bufferReader = this._parseReader();
        return this._readArraySlice(bufferReader, start, end);
    }
}