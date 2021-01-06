// import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import * as net from 'net';

import { BufferListReader } from '../buffer/bufferListReader';

import { IpcPacketBufferList } from '../packet/ipcPacketBufferList';

export class IpcPacketSocketDecoder {
    private _bufferListReader: BufferListReader;
    private _packet: IpcPacketBufferList;

    private _socket: net.Socket;
    private _server: net.Server;
    private _eventEmitterDelegate: EventEmitter;

    constructor(eventEmitterDelegate: EventEmitter, socket: net.Socket, server?: net.Server) {
        this._eventEmitterDelegate = eventEmitterDelegate;
        this._socket = socket;
        this._server = server;

        this._bufferListReader = new BufferListReader();
        this._packet = new IpcPacketBufferList();
    }

    handleData(data: Buffer): void {
        this._bufferListReader.appendBuffer(data);

        const packets: IpcPacketBufferList[] = [];
        while (this._packet.decodeFromReader(this._bufferListReader)) {
            packets.push(this._packet);
            // Prepare the new packet before sending the event
            const packet = this._packet;
            this._packet = new IpcPacketBufferList();
            this._eventEmitterDelegate.emit('packet', packet, this._socket, this._server);
        }

        if (this._packet.isNotValid()) {
            this._eventEmitterDelegate.emit('error', this._socket, this._server, new Error('Get invalid packet header'));
        }
        if (packets.length) {
            this._eventEmitterDelegate.emit('packet[]', packets, this._socket, this._server);
            this._bufferListReader.reduce();
        }
    }
}
