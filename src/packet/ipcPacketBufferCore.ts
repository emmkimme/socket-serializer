import { Reader } from '../buffer/reader';

import { IpcPacketCore } from './ipcPacketCore';
import { IpcPacketHeader } from './ipcPacketHeader';

export namespace IpcPacketBufferCore {
    export interface RawData extends IpcPacketHeader.RawData {
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
        return IpcPacketCore._reader.readContent(this._parseReader(), this._rawHeader.type, this._rawHeader.contentSize);
    }

    // Caller must be sure and must ensure this is an array, else result would be unpredictable
    parseArrayLength(): number | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._reader.readContentArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._reader.readContentArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | undefined {
        const bufferReader = this._parseReader();
        return IpcPacketCore._reader.readContentArraySlice(bufferReader, start, end);
    }
}