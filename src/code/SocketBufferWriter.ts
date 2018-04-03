import * as net from 'net';

import { BufferListWriter } from './BufferListWriter';

export class DelayedSocketWriter extends BufferListWriter {
    private _socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this._socket = socket;
    }

    pushContext(): void {
    }

    popContext(): void {
        let buffer = this.buffer;
        this._buffers = [];
        this._length = 0;
        this._socket.write(buffer);
    }
}

export class BufferedSocketWriter extends DelayedSocketWriter {
    private _bufferSize: number;
    private _context: number;

    constructor(socket: net.Socket, bufferSize?: number) {
        super(socket);
        this._bufferSize = bufferSize || 0;
        this._context = 0;
    }

    pushContext(): void {
        ++this._context;
    }

    popContext(): void {
        if (--this._context === 0) {
            this.popContext();
        }
        else if (this._bufferSize >= this._length) {
            this.popContext();
        }
    }
}


