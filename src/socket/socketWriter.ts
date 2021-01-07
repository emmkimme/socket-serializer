import * as net from 'net';

import { BufferListWriterBase } from '../buffer/bufferListWriter';

export function WriteBuffersToSocket(socket: net.Socket, buffers: Buffer[]) {
    // Taking idea from Node.js - EventEmitter.emit
    const len = buffers.length;
    switch (len) {
        case 0:
            break;
        case 1:
            socket.write(buffers[0]);
            break;
        case 2:
            socket.write(buffers[0]);
            socket.write(buffers[1]);
            break;
        case 3:
            socket.write(buffers[0]);
            socket.write(buffers[1]);
            socket.write(buffers[2]);
            break;
        default:
            for (let i = 0; i < len; ++i) {
                socket.write(buffers[i]);
            }
            break;
    }
}

export interface SocketWriterBase {
    readonly socket: net.Socket;
}

export class SocketWriter extends BufferListWriterBase implements SocketWriterBase {
    private _socket: net.Socket;

    constructor(socket: net.Socket) {
        super();
        this._socket = socket;
    }

    get socket(): net.Socket {
        return this._socket;
    }

    get buffer(): Buffer {
        return null;
    }

    get buffers(): Buffer[] {
        return [];
    }

    writeBuffers(buffers: Buffer[], totalLength?: number): number {
        // don't care of totalLength !!
        return this._appendBuffers(buffers, undefined);
    }

    protected _appendBuffer(buffer: Buffer, length: number): number {
        this._socket.write(buffer);
        // length never changed
        return 0;
    }

    protected _appendBuffers(buffers: Buffer[], totalLength: number): number {
        // Taking idea from Node.js - EventEmitter.emit
        const len = buffers.length;
        switch (len) {
            // fast cases
            case 0 :
                break;
            case 1 :
                this._socket.write(buffers[0]);
                break;
            case 2 :
                this._socket.write(buffers[0]);
                this._socket.write(buffers[1]);
                break;
            case 3 :
                this._socket.write(buffers[0]);
                this._socket.write(buffers[1]);
                this._socket.write(buffers[2]);
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

