// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { IpcPacketContent } from './ipcPacketContent';
import { IpcPacketHeader } from './ipcPacketHeader';

export class IpcPacketCore extends IpcPacketHeader {
    protected static _content = new IpcPacketContent();

    write(bufferWriter: Writer, data: any): void {
        IpcPacketCore._content.write(bufferWriter, data, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }

    read(bufferReader: Reader): any | undefined {
        return IpcPacketCore._content.read(bufferReader, (rawHeader) => {
            this._rawHeader = rawHeader;
        });
    }
}
