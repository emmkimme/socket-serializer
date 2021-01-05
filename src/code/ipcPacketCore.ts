// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { IpcPacketContent } from './ipcPacketContent';
import { IpcPacketHeader } from './ipcPacketHeader';

export class IpcPacketCore extends IpcPacketHeader {
    protected static _content = new IpcPacketContent();

    write(bufferWriter: Writer, data: any): void {
        IpcPacketCore._content.write(bufferWriter, data, (rawContent) => {
            this._rawContent = rawContent;
        });
    }

    read(bufferReader: Reader): any | undefined {
        return IpcPacketCore._content.read(bufferReader, (rawContent) => {
            this._rawContent = rawContent;
        });
    }
}
