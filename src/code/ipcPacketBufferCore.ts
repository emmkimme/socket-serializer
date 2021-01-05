import { IpcPacketCore } from './ipcPacketCore';
import { Reader } from './reader';
import { IpcPacketHeader } from './ipcPacketHeader';

export namespace IpcPacketBufferCore {
    export interface RawContent extends IpcPacketHeader.RawContent {
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
        return IpcPacketCore._content.readContent(this._parseReader(), this._rawContent.type, this._rawContent.contentSize);
    }

    // Caller must be sure and must ensure this is an array, else result would be unpredictable
    parseArrayLength(): number | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._content.readContentArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._content.readContentArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._content.readContentArraySlice(bufferReader, start, end);
    }
}