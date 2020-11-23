// import { Buffer } from 'buffer';
import type { EventEmitter } from 'events';
import type * as net from 'net';

import { IpcPacketBuffer } from './ipcPacketBuffer';
import { BufferListReader } from './bufferListReader';

export class IpcPacketBufferDecoder {
    private _bufferListReader: BufferListReader;
    private _packet: IpcPacketBuffer;

    private _socket: net.Socket;
    private _server: net.Server;
    private _eventEmitterDelegate: EventEmitter;

    constructor(eventEmitterDelegate: EventEmitter, socket: net.Socket, server?: net.Server) {
        this._eventEmitterDelegate = eventEmitterDelegate;
        this._socket = socket;
        this._server = server;

        this._bufferListReader = new BufferListReader();
        this._packet = new IpcPacketBuffer();
    }

    handleData(data: Buffer): void {
        this._bufferListReader.appendBuffer(data);

        const packets: IpcPacketBuffer[] = [];
        while (this._packet.decodeFromReader(this._bufferListReader)) {
            packets.push(this._packet);
            // Prepare the new packet before sending the event
            const packet = this._packet;
            this._packet = new IpcPacketBuffer();
            this._eventEmitterDelegate.emit('packet', packet, this._socket, this._server);
        }

        if (this._packet.isNotValid()) {
            this._eventEmitterDelegate.emit('error', this._socket, this._server, new Error('Get invalid packet header'));
        }
        if (packets.length) {
            this._bufferListReader.reduce();
            this._eventEmitterDelegate.emit('packet[]', packets, this._socket, this._server);
        }
    }
}
