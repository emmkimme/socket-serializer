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

    parse(checker?: () => boolean): any | null {
        if (checker && (checker.call(this) === false)) {
            return null;
        }
        return this._readContent(0, this._parseReader());
    }

    // FOR PERFORMANCE PURPOSE, do not check the inner type, trust the caller
    parseBoolean(): boolean | null {
        return this._readContent(0, this._parseReader());
    }

    parseNumber(): number | null {
        return this._readContent(0, this._parseReader());
    }

    parseDate(): Date | null {
        return this._readContent(0, this._parseReader());
    }

    parseObject(): any | null {
        return this._readContent(0, this._parseReader());
    }

    parseBuffer(): Buffer | null {
        return this._readContent(0, this._parseReader());
    }

    parseArray(): any[] | null {
        return this._readArray(0, this._parseReader());
    }

    parseString(): string | null {
        return this._readString(this._parseReader(), this._contentSize);
    }

    parseArrayLength(): number {
        const bufferReader = this._parseReader();
        return this._readArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | null {
        const bufferReader = this._parseReader();
        return this._readArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | null {
        const bufferReader = this._parseReader();
        return this._readArraySlice(bufferReader, start, end);
    }}