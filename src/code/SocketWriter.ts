import * as net from 'net';

import { BufferListWriterBase } from './bufferListWriter';

export class SocketWriter extends BufferListWriterBase {
    private _socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this._socket = socket;
    }

    get buffer(): Buffer {
        return null;
    }

    get buffers(): Buffer[] {
        return [];
    }

    protected _appendBuffer(buffer: Buffer) {
        this._socket.write(buffer);
        return super._appendBuffer(buffer);
    }

}

