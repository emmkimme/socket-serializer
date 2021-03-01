import { JSONLike } from 'json-helpers';

import { Reader } from '../buffer/reader';
import { Writer } from '../buffer/writer';

import { IpcPacketReader } from './ipcPacketReader';
import { IpcPacketWriter } from './ipcPacketWriter';
import { IpcPacketHeader } from './ipcPacketHeader';

export class IpcPacketCore extends IpcPacketHeader {
    protected _reader: IpcPacketReader;
    protected _writer: IpcPacketWriter;

    get JSON(): JSONLike {
        return this._reader.JSON;
    }

    set JSON(json: JSONLike) {
        this._reader.JSON = json;
    }

    constructor(rawHeader?: IpcPacketHeader.RawData) {
        super(rawHeader);
        this._reader = new IpcPacketReader();
        this._writer = new IpcPacketWriter();
    }

    read(bufferReader: Reader): any | undefined {
        return this._reader.read(bufferReader, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }

    write(bufferWriter: Writer, data: any): void {
        this._writer.write(bufferWriter, data, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }
}
