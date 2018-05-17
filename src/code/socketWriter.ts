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

    protected _appendBuffer(length: number, buffer: Buffer): number {
        this._socket.write(buffer);
        this._length += length;
        return this._length;
    }

    protected _appendBuffers(length: number, buffers: Buffer[]): number {
        for (let i = 0, l = buffers.length; i < l; ++i) {
            this._socket.write(buffers[i]);
        }
        this._length += length;
        return this._length;
    }
}

