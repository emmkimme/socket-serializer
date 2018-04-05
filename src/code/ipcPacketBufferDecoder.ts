import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import { IpcPacketBuffer } from './ipcPacketBuffer';
import { BufferListReader } from './bufferListReader';

export class IpcPacketBufferDecoder extends EventEmitter {
    private _bufferListReader: BufferListReader;
    private _packet: IpcPacketBuffer;

    expectedArgs: number;
    packetArgs: IpcPacketBuffer[];

    constructor() {
        super();
        this._bufferListReader = new BufferListReader([]);
        this._packet = new IpcPacketBuffer();

        this.packetArgs = [];
        this.expectedArgs = 0;
    }

    on(event: 'packet', handler: (buffer: IpcPacketBuffer) => void): this;
    on(event: 'packet[]', handler: (buffer: IpcPacketBuffer[]) => void): this;
    on(event: 'error', handler: (err: Error) => void): this;
    on(event: string, handler: Function): this {
        return super.on(event, handler);
    }

    handlePacket(packet: IpcPacketBuffer): IpcPacketBuffer | null {
        if (this.packetArgs.length > 0) {
            this.packetArgs.push(packet);
            if (packet.isArrayWithLen()) {
                this.expectedArgs += packet.argsLen;
            }
            if (--this.expectedArgs === 0) {
                let buffersLen = 0;
                let buffers = this.packetArgs.map(packet => {
                    buffersLen += packet.buffer.length;
                    return packet.buffer;
                });
                let packet = new IpcPacketBuffer();
                packet.decodeFromBuffer(Buffer.concat(buffers, buffersLen));
                this.packetArgs = [];
                this.expectedArgs = 0;
                return packet;
            }
            return null;
        }
        if (packet.isArrayWithLen()) {
            this.packetArgs.push(packet);
            this.expectedArgs = packet.argsLen;
            return null;
        }
        return packet;
    }

    handleData(data: Buffer): void {
        this._bufferListReader.appendBuffer(data);

        let packets: IpcPacketBuffer[] = [];
        while (this._packet.decodeFromReader(this._bufferListReader)) {
            // Prepare the new packet before sending the event
            let packet = this._packet;
            this._packet = new IpcPacketBuffer();
            packets.push(packet);
            this.emit('packet', packet);
            // let packet = this.handlePacket(packet);
            // if (packet) {
            //     packets.push(packet);
            //     this.emit('packet', packet);
            // }
        }
        if (this._packet.isNotValid()) {
            this.emit('error', new Error('Get invalid packet header'));
        }
        if (packets.length) {
            this._bufferListReader.reduce();
            this.emit('packet[]', packets);
        }
    }
}
