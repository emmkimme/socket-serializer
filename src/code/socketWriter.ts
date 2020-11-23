import type * as net from 'net';

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
        // length never changed
        return 0;
    }

    protected _appendBuffers(length: number, buffers: Buffer[]): number {
        const len = buffers.length;
        switch (len) {
            // fast cases
            case 0 :
                break;
            case 1 :
                this._socket.write(buffers[0]);
                break;
            // slower
            default:
                for (let i = 0; i < len; ++i) {
                    this._socket.write(buffers[i]);
                }
                break;
        }
        // length never changed
        return 0;
    }

    reset(): void {
        // no action
    }
}

