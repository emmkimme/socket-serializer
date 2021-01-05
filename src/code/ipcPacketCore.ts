// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { IpcPacketContent } from './ipcPacketContent';

export class IpcPacketCore extends IpcPacketContent {
    write(bufferWriter: Writer, data: any): void {
        super.write(bufferWriter, data, (rawContent) => {
            this._rawContent = rawContent;
        });
    }

    read(bufferReader: Reader): any | undefined {
        return super.read(bufferReader, (rawContent) => {
            this._rawContent = rawContent;
        });
    }
}
