import { Reader } from '../buffer/reader';
import { Writer } from '../buffer/writer';

import { IpcPacketReader } from './ipcPacketReader';
import { IpcPacketWriter } from './ipcPacketWriter';
import { IpcPacketHeader } from './ipcPacketHeader';
import { JSONLike, JSONParser } from 'json-helpers';

export class IpcPacketCore extends IpcPacketHeader {
    protected _reader: IpcPacketReader;
    protected _writer: IpcPacketWriter;

    constructor(rawHeader?: IpcPacketHeader.RawData, json?: JSONLike) {
        super(rawHeader);
        this._reader = new IpcPacketReader(json);
        this._writer = new IpcPacketWriter(json);
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
