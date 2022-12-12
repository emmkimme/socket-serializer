import { Buffer } from 'buffer';
import { Reader } from '../buffer/reader';
import { BufferWriterSize } from '../buffer/bufferWriterSize';

import { IpcPacketCore } from './ipcPacketCore';
import { IpcPacketHeader } from './ipcPacketHeader';
import { IpcPacketWriterSize } from './ipcPacketWriterSize';

export namespace IpcPacketBufferCore {
    export interface RawData extends IpcPacketHeader.RawData {
        buffer?: Buffer;
        buffers?: Buffer[];
    }
}

export abstract class IpcPacketBufferCore extends IpcPacketCore {
    static readonly EmptyBuffer = Buffer.allocUnsafe(0);

    constructor(rawHeader?: IpcPacketBufferCore.RawData) {
        super(rawHeader);
    }
    
    abstract get buffer(): Buffer;
    abstract get buffers(): Buffer[];

    protected abstract _parseReader(): Reader;

    bytelength(data: any): number {
        const writer = new BufferWriterSize();
        const packetBufferSize = new IpcPacketWriterSize();
        packetBufferSize.write(writer, data)
        return writer.length;
    }

    parse<T = any>(): T | undefined {
        return this._reader.readContent(this._parseReader(), this._rawHeader.type, this._rawHeader.contentSize);
    }

    // Caller must be sure and must ensure this is an array, else result would be unpredictable
    parseArrayLength(): number | undefined {
        const bufferReader = this._parseReader();
        return this._reader.readContentArrayLength(bufferReader);
    }

    parseArrayAt(index: number): any | undefined {
        const bufferReader = this._parseReader();
        return this._reader.readContentArrayAt(bufferReader, index);
    }

    parseArraySlice(start?: number, end?: number): any | undefined {
        const bufferReader = this._parseReader();
        return this._reader.readContentArraySlice(bufferReader, start, end);
    }
}