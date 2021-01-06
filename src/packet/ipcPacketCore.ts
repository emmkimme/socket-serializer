import { Reader } from '../buffer/reader';
import { Writer } from '../buffer/writer';

import { IpcPacketReader } from './ipcPacketReader';
import { IpcPacketWriter } from './ipcPacketWriter';
import { IpcPacketHeader } from './ipcPacketHeader';

export class IpcPacketCore extends IpcPacketHeader {
    protected static _writer = new IpcPacketWriter();
    protected static _reader = new IpcPacketReader();

    write(bufferWriter: Writer, data: any): void {
        IpcPacketCore._writer.write(bufferWriter, data, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }

    read(bufferReader: Reader): any | undefined {
        return IpcPacketCore._reader.read(bufferReader, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }
}
