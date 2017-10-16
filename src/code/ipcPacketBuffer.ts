import * as net from 'net';

import { Buffer } from 'buffer';
import { BufferReader } from './bufferReader';
import { Writer } from './writer';
import { Reader } from './reader';
import { BufferListWriter } from './bufferListWriter';
import { SocketWriter } from './SocketWriter';
import * as wrap from './ipcPacketBufferWrap';

export class IpcPacketBuffer extends wrap.IpcPacketBufferWrap {
    private _buffer: Buffer;

    static optFromArray: Function = IpcPacketBuffer._serializeArrayLen;
    static basicFromArray: Function = IpcPacketBuffer._serializeArray;

    // static algoFromArray: Function = IpcPacketBuffer.optFromArray;
    static algoFromArray: Function = IpcPacketBuffer.basicFromArray;

    constructor() {
        super();
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    parseFromReader(bufferReader: Reader): boolean {
        let offset = bufferReader.offset;
        this.readHeader(bufferReader);
        // if packet size error, find a way parse resynchronize later
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
            this._type = wrap.BufferType.NotComplete;
            return false;
        }
        this._buffer = bufferReader.readBuffer(this.packetSize);
        return true;
    }

    parseFromBuffer(buffer: Buffer): boolean {
        return this.parseFromReader(new BufferReader(buffer));
    }

    serializeNumber(dataNumber: number) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serializeNumber(this, bufferWriter, dataNumber);
        this._buffer = bufferWriter.buffer;
    }

    // Thanks parse https://github.com/tests-always-included/buffer-serializer/
    static _serializeNumber(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, dataNumber: number): void {
        // An integer
        if (Math.floor(dataNumber) === dataNumber) {
            let absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    header.type = wrap.BufferType.NegativeInteger;
                }
                // Positive integer
                else {
                    header.type = wrap.BufferType.PositiveInteger;
                }
                header.writeHeader(bufferWriter);
                bufferWriter.writeUInt32(absDataNumber);
                header.writeFooter(bufferWriter);
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Sparsere as a double.
        header.type = wrap.BufferType.Double;
        header.writeHeader(bufferWriter);
        bufferWriter.writeDouble(dataNumber);
        header.writeFooter(bufferWriter);
    }

    serializeBoolean(dataBoolean: boolean) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serializeBoolean(this, bufferWriter, dataBoolean);
        this._buffer = bufferWriter.buffer;
    }

    static _serializeBoolean(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, dataBoolean: boolean) {
        header.type = dataBoolean ? wrap.BufferType.BooleanTrue : wrap.BufferType.BooleanFalse;
        header.writeHeader(bufferWriter);
        header.writeFooter(bufferWriter);
    }

    static _writeString(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, data: string, encoding?: string): void {
        let buffer = Buffer.from(data, encoding);
        header.contentSize = buffer.length;
        header.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(buffer);
        header.writeFooter(bufferWriter);
    }

    serializeString(data: string, encoding?: string) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serializeString(this, bufferWriter, data, encoding);
        this._buffer = bufferWriter.buffer;
    }

    static _serializeString(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, data: string, encoding?: string): void {
        header.type = wrap.BufferType.String;
        IpcPacketBuffer._writeString(header, bufferWriter, data, encoding);
    }

    serializeObject(dataObject: Object) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serializeObject(this, bufferWriter, dataObject);
        this._buffer = bufferWriter.buffer;
    }

    static _serializeObject(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, dataObject: Object): void {
        let data = JSON.stringify(dataObject);
        header.type = wrap.BufferType.Object;
        IpcPacketBuffer._writeString(header, bufferWriter, data, 'utf8');
    }

    serializeBuffer(data: Buffer) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serializeBuffer(this, bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    static _serializeBuffer(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, data: Buffer): void {
        header.type = wrap.BufferType.Buffer;
        header.contentSize = data.length;
        header.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(data);
        header.writeFooter(bufferWriter);
    }

    serializeArray(args: any[]) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer.algoFromArray(this, bufferWriter, args);
        this._buffer = bufferWriter.buffer;
    }

    static _serializeArrayLen(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, args: any[]): void {
        header.type = wrap.BufferType.ArrayLen;
        header.argsLen = args.length;
        header.writeHeader(bufferWriter);
        header.writeFooter(bufferWriter);
        let headerArg = new wrap.IpcPacketBufferWrap();
        args.forEach((arg) => {
            IpcPacketBuffer._serialize(headerArg, bufferWriter, arg);
        });
    }

    static _serializeArray(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, args: any[]): void {
        let bufferWriterArgs = new BufferListWriter();
        let headerArg = new wrap.IpcPacketBufferWrap();
        args.forEach((arg) => {
            IpcPacketBuffer._serialize(headerArg, bufferWriterArgs, arg);
        });

        header.type = wrap.BufferType.Array;
        header.contentSize = bufferWriterArgs.length;
        header.writeHeader(bufferWriter);
        bufferWriterArgs.buffers.forEach((buffer) => {
            bufferWriter.writeBuffer(buffer);
        });
        header.writeFooter(bufferWriter);
    }

    static serializeToSocket(data: any, socket: net.Socket): number {
        let header = new wrap.IpcPacketBufferWrap();
        let bufferWriter = new SocketWriter(socket);
        IpcPacketBuffer._serialize(header, bufferWriter, data);
        return bufferWriter.length;
    }

    serialize(data: any) {
        let bufferWriter = new BufferListWriter();
        IpcPacketBuffer._serialize(this, bufferWriter, data);
        this._buffer = bufferWriter.buffer;
    }

    static _serialize(header: wrap.IpcPacketBufferWrap, bufferWriter: Writer, data: any): void {
        switch (typeof data) {
            case 'object':
                if (Buffer.isBuffer(data)) {
                    IpcPacketBuffer._serializeBuffer(header, bufferWriter, data);
                }
                else if (Array.isArray(data)) {
                    IpcPacketBuffer.algoFromArray(header, bufferWriter, data);
                }
                else {
                    IpcPacketBuffer._serializeObject(header, bufferWriter, data);
                }
                break;
            case 'string':
                IpcPacketBuffer._serializeString(header, bufferWriter, data);
                break;
            case 'number':
                IpcPacketBuffer._serializeNumber(header, bufferWriter, data);
                break;
            case 'boolean':
                IpcPacketBuffer._serializeBoolean(header, bufferWriter, data);
                break;
        }
    }

    parse(): any {
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parse(this, bufferReader);
    }

    static _parse(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any {
        let arg: any;
        switch (header.type) {
            case wrap.BufferType.ArrayLen: {
                arg = IpcPacketBuffer._parseArrayLen(header, bufferReader);
                break;
            }
            case wrap.BufferType.Array: {
                arg = IpcPacketBuffer._parseArray(header, bufferReader);
                break;
            }
            case wrap.BufferType.Object: {
                arg = IpcPacketBuffer._parseObject(header, bufferReader);
                break;
            }
            case wrap.BufferType.String: {
                arg = IpcPacketBuffer._parseString(header, bufferReader);
                break;
            }
            case wrap.BufferType.Buffer: {
                arg = IpcPacketBuffer._parseBuffer(header, bufferReader);
                break;
            }
            case wrap.BufferType.PositiveInteger:
            case wrap.BufferType.NegativeInteger:
            case wrap.BufferType.Double: {
                arg = IpcPacketBuffer._parseNumber(header, bufferReader);
                break;
            }
            case wrap.BufferType.BooleanFalse:
            case wrap.BufferType.BooleanTrue: {
                arg = IpcPacketBuffer._parseBoolean(header, bufferReader);
                break;
            }
        }
        return arg;
    }

    parseBoolean(): boolean {
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parseBoolean(this, bufferReader);
    }

    private static _parseBoolean(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): boolean {
        let data: boolean;
        switch (header.type) {
            case wrap.BufferType.BooleanTrue:
                data = true;
                bufferReader.skip(header.footerSize);
                break;
            case wrap.BufferType.BooleanFalse:
                data = false;
                bufferReader.skip(header.footerSize);
                break;
            default:
                data = null;
                break;
        }
        return data;
    }

    parseNumber(): number {
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parseNumber(this, bufferReader);
    }

    private static _parseNumber(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): number {
        let data: number;
        switch (header.type) {
            case wrap.BufferType.Double:
                data = bufferReader.readDouble();
                bufferReader.skip(header.footerSize);
                break;
            case wrap.BufferType.NegativeInteger:
                data = -bufferReader.readUInt32();
                bufferReader.skip(header.footerSize);
                break;
            case wrap.BufferType.PositiveInteger:
                data = +bufferReader.readUInt32();
                bufferReader.skip(header.footerSize);
                break;
            default:
                data = null;
                break;
        }
        return data;
    }

    parseObject(): any {
        if (this.isObject() === false) {
            return null;
        }
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parseObject(this, bufferReader);
    }

    private static _parseObject(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any {
        let data = bufferReader.readString('utf8', header.contentSize);
        bufferReader.skip(header.footerSize);
        return JSON.parse(data);
    }

    parseString(encoding?: string): string {
        if (this.isString() === false) {
            return null;
        }
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parseString(this, bufferReader, encoding);
    }

    private static _parseString(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader, encoding?: string): string {
        let data = bufferReader.readString(encoding, header.contentSize);
        bufferReader.skip(header.footerSize);
        return data;
    }

    parseBuffer(): Buffer {
        if (this.isBuffer() === false) {
            return null;
        }
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        return IpcPacketBuffer._parseBuffer(this, bufferReader);
    }

    private static _parseBuffer(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): Buffer {
        let data = bufferReader.readBuffer(header.contentSize);
        bufferReader.skip(header.footerSize);
        return data;
    }

    parseArrayAt(index: number): any {
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        if (this.isArray()) {
            return IpcPacketBuffer._parseArrayAt(index, this, bufferReader);
        }
        if (this.isArrayLen()) {
            return IpcPacketBuffer._parseArrayLenAt(index, this, bufferReader);
        }
        return null;
    }

    private static _parseArrayAt(index: number, header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any {
        let offsetContentSize = bufferReader.offset + header.contentSize;
        let headerArg = new wrap.IpcPacketBufferWrap();
        while ((index > 0) && (bufferReader.offset < offsetContentSize)) {
            headerArg.readHeader(bufferReader);
            bufferReader.skip(headerArg.contentSize + header.footerSize);
            --index;
        }
        let arg: any;
        if (index === 0) {
            headerArg.readHeader(bufferReader);
            arg = IpcPacketBuffer._parse(headerArg, bufferReader);
        }
        return arg;
    }

    private static _parseArrayLenAt(index: number, header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any {
        let argsLen = header.argsLen;
        bufferReader.skip(header.footerSize);

        if (index >= argsLen) {
            return null;
        }

        let headerArg = new wrap.IpcPacketBufferWrap();
        while (index > 0) {
            headerArg.readHeader(bufferReader);
            bufferReader.skip(headerArg.contentSize + header.footerSize);
            --index;
        }
        let arg: any;
        if (index === 0) {
            headerArg.readHeader(bufferReader);
            arg = IpcPacketBuffer._parse(headerArg, bufferReader);
        }
        return arg;
    }

    parseArray(): any[] {
        let bufferReader = new BufferReader(this._buffer, this.headerSize);
        if (this.isArray()) {
            return IpcPacketBuffer._parseArray(this, bufferReader);
        }
        if (this.isArrayLen()) {
            return IpcPacketBuffer._parseArrayLen(this, bufferReader);
        }
        return null;
    }

    private static _parseArray(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any[] {
        let offsetContentSize = bufferReader.offset + header.contentSize;
        let args = [];
        let headerArg = new wrap.IpcPacketBufferWrap();
        while (bufferReader.offset < offsetContentSize) {
            headerArg.readHeader(bufferReader);
            let arg = IpcPacketBuffer._parse(headerArg, bufferReader);
            args.push(arg);
        }
        bufferReader.skip(header.footerSize);
        return args;
    }

    private static _parseArrayLen(header: wrap.IpcPacketBufferWrap, bufferReader: BufferReader): any[] {
        let argsLen = header.argsLen;
        bufferReader.skip(header.footerSize);

        let args = [];
        let headerArg = new wrap.IpcPacketBufferWrap();
        while (argsLen > 0) {
            headerArg.readHeader(bufferReader);
            let arg = IpcPacketBuffer._parse(headerArg, bufferReader);
            args.push(arg);
            --argsLen;
        }
        return args;
    }
}