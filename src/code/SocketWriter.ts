import * as net from 'net';

import { Writer } from './writer';

export class SocketWriter implements Writer {
    private _socket: net.Socket;
    private _length: number;
    private _buffer1: Buffer;
    private _buffer4: Buffer;
    private _buffer8: Buffer;
    // private _buffers: Buffer[];

    constructor(socket: net.Socket) {
        this._socket = socket;
        // this._buffers = [];
        this._length = 0;
        this._buffer1 = Buffer.alloc(1);
        this._buffer8 = Buffer.alloc(8);
        this._buffer4 = Buffer.alloc(4);
    }

    get buffer(): Buffer {
        return null;
    }

    get buffers(): Buffer[] {
        return null;
    }

    get length(): number {
        return this._length;
    }

    writeByte(data: number): number {
        this._buffer1[0] = data;
        this._length += 1;
        this._socket.write(this._buffer1);
        return this.length;
    }

    writeBytes(dataArray: number[]): number {
        let buff = Buffer.from(dataArray);
        this._length += buff.length;
        this._socket.write(buff);
        return this.length;
    }

    writeUInt32(data: number): number {
        this._buffer4.writeUInt32LE(data, 0);
        this._length += 4;
        this._socket.write(this._buffer4);
        return this.length;
    }

    writeDouble(data: number): number {
        this._buffer8.writeDoubleLE(data, 0);
        this._length += 8;
        this._socket.write(this._buffer8);
        return this.length;
    }

    writeString(data: string, encoding?: string, len?: number): number {
        if ((len != null) && (len < data.length)) {
            data = data.substring(0, len);
        }
        let buff = Buffer.from(data, encoding);
        this._length += buff.length;
        this._socket.write(buff);
        return this.length;
    }

    writeBuffer(buff: Buffer, sourceStart?: number, sourceEnd?: number): number {
        sourceStart = sourceStart || 0;
        sourceEnd = sourceEnd || buff.length;

        if ((sourceStart > 0) || (sourceEnd < buff.length)) {
            buff = buff.slice(sourceStart, sourceEnd);
        }
        this._length += buff.length;
        this._socket.write(buff);
        return this.length;
    }

    pushContext(): void {
    }

    popContext(): void {
    }
}

