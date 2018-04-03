import * as net from 'net';

import { BufferReader } from './bufferReader';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { SocketWriter } from './SocketWriter';
import { IpcPacketBufferWrap, BufferType } from './ipcPacketBufferWrap';

export class IpcPacketBuffer extends IpcPacketBufferWrap {
    private _buffer: Buffer;

    constructor() {
        super();
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    decodeFromReader(bufferReader: Reader): boolean {
        let offset = bufferReader.offset;
        this.readHeader(bufferReader);
        // if packet size error, find a way to resynchronize later
        if (this.isNotValid()) {
            return false;
        }
        bufferReader.seek(offset);
        // if not enough data accumulated for reading the header, exit
        if (this.isNotComplete()) {
            return false;
        }
        // if not enough data accumulated for reading the packet, exit
        if (bufferReader.checkEOF(this.packetSize)) {
            this._type = BufferType.NotComplete;
            return false;
        }
        this._buffer = bufferReader.readBuffer(this.packetSize);
        return true;
    }

    decodeFromBuffer(buffer: Buffer): boolean {
        return this.decodeFromReader(new BufferReader(buffer));
    }

    serializeNumber(dataNumber: number) {
        let bufferWriter = new BufferListWriter();
        this.writeNumber(bufferWriter, dataNumber);
        this._buffer = bufferWriter.buffer;
    }

    serializeBoolean(dataBoolean: boolean) {
        let bufferWriter = new BufferListWriter();
        this.writeBoolean(bufferWriter, dataBoolean);
        this._buffer = bufferWriter.buffer;
    }

    serializeString(data: string, encoding?: string) {
        let bufferWriter = new BufferListWriter();
        this.writeString(bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
    }

    serializeObject(dataObject: Object) {
        let bufferWriter = new BufferListWriter();
        this.writeObject(bufferWriter, dataObject);
        this._buffer = bufferWriter.buffer;
    }

    serializeBuffer(data: Buffer) {
        let bufferWriter = new BufferListWriter();
        this.writeBuffer(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    serializeArray(args: any[]) {
        let bufferWriter = new BufferListWriter();
        this.writeArray(bufferWriter, args);
        this._buffer = bufferWriter.buffer;
    }

    serialize(data: any) {
        let bufferWriter = new BufferListWriter();
        this.write(bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    static serializeToSocket(data: any, socket: net.Socket): number {
        let header = new IpcPacketBufferWrap();
        let bufferWriter = new SocketWriter(socket);
        header.write(bufferWriter, data);
        return bufferWriter.length;
    }

    parse(): any {
        let bufferReader = new BufferReader(this._buffer);
        return this.read(bufferReader);
    }

    private _parseAndCheck(checker: () => boolean): any {
        let arg = this.parse();
        if (!checker.call(this)) {
            arg = null;
        }
        return arg;
    }

    parseBoolean(): boolean | null {
        return this._parseAndCheck(this.isBoolean);
    }

    parseNumber(): number | null {
        return this._parseAndCheck(this.isNumber);
   }

    parseObject(): any | null {
        return this._parseAndCheck(this.isObject);
    }

    parseString(encoding?: string): string | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.readString(bufferReader, encoding);
    }

    parseBuffer(): Buffer | null {
        return this._parseAndCheck(this.isBuffer);
    }

    parseArrayAt(index: number): any | null {
        let bufferReader = new BufferReader(this._buffer);
        return this.readArrayAt(bufferReader, index);
    }

    parseArray(): any[] | null {
        return this._parseAndCheck(this.isArray);
    }
}