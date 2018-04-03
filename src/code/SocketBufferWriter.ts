import * as net from 'net';

import { BufferListWriter } from './BufferListWriter';

export class DelayedSocketWriter extends BufferListWriter {
    private _socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this._socket = socket;
    }

    complete(): void {
        let buffer = this.buffer;
        this._buffers = [];
        this._length = 0;
        this._socket.write(buffer);
    }
}

export class BufferedSocketWriter extends DelayedSocketWriter {
    private _bufferSize: number;

    constructor(socket: net.Socket, bufferSize?: number) {
        super(socket);
        this._bufferSize = bufferSize || 0;
    }

    complete(): void {
        if (this._bufferSize >= this._length) {
            this.complete();
        }
    }
}


