import { IpcPacketCore } from './ipcPacketCore';
import { IpcPacketContent } from './ipcPacketContent';
import { Reader } from './reader';

export namespace IpcPacketBufferCore {
    export interface RawContent extends IpcPacketContent.RawContent {
        buffer?: Buffer;
        buffers?: Buffer[];
    }
}

export abstract class IpcPacketBufferCore extends IpcPacketCore {
    static readonly EmptyBuffer = Buffer.allocUnsafe(0);

    abstract get buffer(): Buffer;
    abstract get buffers(): Buffer[];

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