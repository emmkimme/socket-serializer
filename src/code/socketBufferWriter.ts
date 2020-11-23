import type * as net from 'net';

import { BufferListWriter } from './bufferListWriter';

export class DelayedSocketWriter extends BufferListWriter {
    private _socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this._socket = socket;
    }

    pushContext(): void {
    }

    popContext(): void {
        this.flushBuffer();
    }

    protected flushBuffer() {
        for (let i = 0, l = this._buffers.length; i < l; ++i) {
            this._socket.write(this._buffers[i]);
        }
        this._buffers = [];
        this._length = 0;
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
            this.flushBuffer();
        }
        else if (this._length >= this._bufferSize) {
            this.flushBuffer();
        }
    }
}


