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

    protected abstract _parseReader(): Reader;

    parse<T = any>(checker?: () => boolean): T | undefined {
        if (checker && (checker.call(this) === false)) {
            return undefined;
        }
        return this._readContent(0, this._parseReader());
    }

    // FOR PERFORMANCE PURPOSE, do not check the inner type, trust the caller
    parseBoolean(): boolean | undefined {
        return this._readContent(0, this._parseReader());
    }

    parseNumber(): number | undefined {
        return this._readContent(0, this._parseReader());
    }

    parseDate(): Date | undefined {
        return this._readContent(0, this._parseReader());
    }

    parseObject(): any | undefined {
        return this._readContent(0, this._parseReader());
    }

    parseBuffer(): Buffer | undefined {
        return this._readContent(0, this._parseReader());
    }

    parseArray(): any[] | undefined {
        return this._readArray(0, this._parseReader());
    }

    parseString(): string | undefined {
        return this._readString(this._parseReader(), this._contentSize);
    }

    parseArrayLength(): number | undefined{
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
    }}