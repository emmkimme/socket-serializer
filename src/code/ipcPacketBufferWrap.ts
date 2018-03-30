// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';

const headerSeparator: number = '['.charCodeAt(0);
const footerSeparator: number = ']'.charCodeAt(0);

const MinHeaderLength: number = 2;
// const MaxHeaderLength: number = MinHeaderLength + 4;

const FooterLength: number = 1;
// const StringHeaderLength: number = MinHeaderLength + 4;
// const BufferHeaderLength: number = MinHeaderLength + 4;
// const ArrayWithLenHeaderLength: number = MinHeaderLength + 4;
const ObjectHeaderLength: number = MinHeaderLength + 4;
const ArrayWithLenHeaderLength: number = MinHeaderLength + 4;

export enum BufferType {
    // 88
    NotValid = 'X'.charCodeAt(0),
    // 85
    NotComplete = 'P'.charCodeAt(0),
    // 115
    String = 's'.charCodeAt(0),
    // 66
    Buffer = 'B'.charCodeAt(0),
    BooleanTrue = 'T'.charCodeAt(0),
    BooleanFalse = 'F'.charCodeAt(0),
    // 65
    ArrayWithSize = 'A'.charCodeAt(0),
    // 97
    ArrayWithLen = 'a'.charCodeAt(0),
    // 42
    PositiveInteger = '+'.charCodeAt(0),
    // 45
    NegativeInteger = '-'.charCodeAt(0),
    // 100
    Double = 'd'.charCodeAt(0),
    // 79
    Object = 'O'.charCodeAt(0)
};

export class IpcPacketBufferWrap {
    protected _type: BufferType;
    protected _packetSize: number;
    protected _contentSize: number;
    protected _headerSize: number;
    protected _argsLen: number;

    // writeArrayOpt: Function = this.writeArrayWithLen;
    writeArray: Function = this.writeArrayWithSize;

    constructor() {
        this._type = BufferType.NotValid;
    }

    get type(): BufferType {
        return this._type;
    }

    set type(bufferType: BufferType) {
        if (this._type === bufferType) {
            return;
        }
        this._type = bufferType;
        this._argsLen = 0;
        switch (this._type) {
            case BufferType.Double:
                this._headerSize = MinHeaderLength;
                this.setContentSize(8);
                break;
            case BufferType.NegativeInteger:
            case BufferType.PositiveInteger:
                this._headerSize = MinHeaderLength;
                this.setContentSize(4);
                break;
            case BufferType.ArrayWithLen:
                this._headerSize = ArrayWithLenHeaderLength;
                this.setContentSize(0);
                break;
            case BufferType.ArrayWithSize:
            case BufferType.Object:
            case BufferType.String:
            case BufferType.Buffer:
                this._headerSize = ObjectHeaderLength;
                // Empty by default
                this.setContentSize(0);
                break;
            case BufferType.BooleanTrue:
            case BufferType.BooleanFalse:
                this._headerSize = MinHeaderLength;
                this.setContentSize(0);
                break;
            default:
                this._type = BufferType.NotValid;
                break;
        }
    }

    get argsLen(): number {
        return this._argsLen;
    }

    set argsLen(argsLen: number) {
        this._argsLen = argsLen;
    }

    get packetSize(): number {
        return this._packetSize;
    }

    protected setPacketSize(packetSize: number) {
        this._packetSize = packetSize;
        this._contentSize = this._packetSize - this._headerSize - FooterLength;
    }

    get contentSize(): number {
        return this._contentSize;
    }

    set contentSize(contentSize: number) {
        if (this._contentSize === contentSize) {
            return;
        }
        switch (this._type) {
            case BufferType.ArrayWithSize:
            case BufferType.Object:
            case BufferType.String:
            case BufferType.Buffer:
                this.setContentSize(contentSize);
                break;
        }
    }

    protected setContentSize(contentSize: number) {
        this._contentSize = contentSize;
        this._packetSize = this._contentSize + this._headerSize + FooterLength;
    }

    get footerSize(): number {
        return FooterLength;
    }

    get headerSize(): number {
        return this._headerSize;
    }

    isNotValid(): boolean {
        return this._type === BufferType.NotValid;
    }

    isNotComplete(): boolean {
        return this._type === BufferType.NotComplete;
    }

    isArray(): boolean {
        switch (this._type) {
            case BufferType.ArrayWithSize:
            case BufferType.ArrayWithLen:
                return true;
            default:
                return false;
        }
    }

    isArrayWithSize(): boolean {
        return this._type === BufferType.ArrayWithSize;
    }

    isArrayWithLen(): boolean {
        return this._type === BufferType.ArrayWithLen;
    }

    isObject(): boolean {
        return this._type === BufferType.Object;
    }

    isString(): boolean {
        return this._type === BufferType.String;
    }

    isBuffer(): boolean {
        return this._type === BufferType.Buffer;
    }

    isNumber(): boolean {
        switch (this._type) {
            case BufferType.NegativeInteger:
            case BufferType.PositiveInteger:
            case BufferType.Double:
                return true;
            default:
                return false;
        }
    }

    isBoolean(): boolean {
        switch (this._type) {
            case BufferType.BooleanTrue:
            case BufferType.BooleanFalse:
                return true;
            default:
                return false;
        }
    }

    readHeader(bufferReader: Reader): number {
        if (bufferReader.checkEOF(2)) {
            this._type = BufferType.NotComplete;
            return bufferReader.offset;
        }
        if (bufferReader.readByte() !== headerSeparator) {
            this._type = BufferType.NotValid;
            return bufferReader.offset;
        }
        this.type = bufferReader.readByte();
        if (bufferReader.offset + (this._headerSize - 2) > bufferReader.length) {
            this._type = BufferType.NotComplete;
        }
        else {
            switch (this.type) {
                case BufferType.ArrayWithLen:
                    this._argsLen = bufferReader.readUInt32();
                    break;
                case BufferType.ArrayWithSize:
                case BufferType.Object:
                case BufferType.String:
                case BufferType.Buffer:
                    this.setPacketSize(bufferReader.readUInt32());
                    break;
            }
        }
        return bufferReader.offset;
    }

    writeHeader(bufferWriter: Writer): void {
        bufferWriter.writeBytes([headerSeparator, this._type]);
        switch (this._type) {
            case BufferType.ArrayWithLen:
                bufferWriter.writeUInt32(this._argsLen);
                break;
            case BufferType.ArrayWithSize:
            case BufferType.Object:
            case BufferType.String:
            case BufferType.Buffer:
                bufferWriter.writeUInt32(this._packetSize);
                break;
        }
    }

    writeFooter(bufferWriter: Writer): void {
        bufferWriter.writeByte(footerSeparator);
    }

    write(bufferWriter: Writer, data: any): void {
        switch (typeof data) {
            case 'object':
                if (Buffer.isBuffer(data)) {
                    this.writeBuffer(bufferWriter, data);
                }
                else if (Array.isArray(data)) {
                    this.writeArray(bufferWriter, data);
                }
                else {
                    this.writeObject(bufferWriter, data);
                }
                break;
            case 'string':
                this.writeString(bufferWriter, data);
                break;
            case 'number':
                this.writeNumber(bufferWriter, data);
                break;
            case 'boolean':
                this.writeBoolean(bufferWriter, data);
                break;
        }
    }

    // Thanks parse https://github.com/tests-always-included/buffer-serializer/
    writeNumber(bufferWriter: Writer, dataNumber: number): void {
        // An integer
        if (Math.floor(dataNumber) === dataNumber) {
            let absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    this.type = BufferType.NegativeInteger;
                }
                // Positive integer
                else {
                    this.type = BufferType.PositiveInteger;
                }
                this.writeHeader(bufferWriter);
                bufferWriter.writeUInt32(absDataNumber);
                this.writeFooter(bufferWriter);
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Save as a double.
        this.type = BufferType.Double;
        this.writeHeader(bufferWriter);
        bufferWriter.writeDouble(dataNumber);
        this.writeFooter(bufferWriter);
    }

    writeBoolean(bufferWriter: Writer, dataBoolean: boolean) {
        this.type = dataBoolean ? BufferType.BooleanTrue : BufferType.BooleanFalse;
        this.writeHeader(bufferWriter);
        this.writeFooter(bufferWriter);
    }

    private _writeString(bufferWriter: Writer, data: string, encoding?: string): void {
        let buffer = Buffer.from(data, encoding);
        this.contentSize = buffer.length;
        this.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(buffer);
        this.writeFooter(bufferWriter);
    }

    writeString(bufferWriter: Writer, data: string, encoding?: string): void {
        this.type = BufferType.String;
        this._writeString(bufferWriter, data, encoding);
    }

    writeObject(bufferWriter: Writer, dataObject: Object): void {
        let data = JSON.stringify(dataObject);
        this.type = BufferType.Object;
        this._writeString(bufferWriter, data, 'utf8');
    }

    writeBuffer(bufferWriter: Writer, data: Buffer): void {
        this.type = BufferType.Buffer;
        this.contentSize = data.length;
        this.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(data);
        this.writeFooter(bufferWriter);
    }

    writeArrayWithLen(bufferWriter: Writer, args: any[]): void {
        this.type = BufferType.ArrayWithLen;
        this.argsLen = args.length;
        this.writeHeader(bufferWriter);
        this.writeFooter(bufferWriter);
        let headerArg = new IpcPacketBufferWrap();
        args.forEach((arg) => {
            headerArg.write(bufferWriter, arg);
        });
    }

    writeArrayWithSize(bufferWriter: Writer, args: any[]): void {
        let bufferWriterArgs = new BufferListWriter();
        let headerArg = new IpcPacketBufferWrap();
        args.forEach((arg) => {
            headerArg.write(bufferWriterArgs, arg);
        });

        this.type = BufferType.ArrayWithSize;
        this.contentSize = bufferWriterArgs.length;
        this.writeHeader(bufferWriter);
        bufferWriterArgs.buffers.forEach((buffer) => {
            bufferWriter.writeBuffer(buffer);
        });
        this.writeFooter(bufferWriter);
    }

    read(bufferReader: Reader): any {
        this.readHeader(bufferReader);
        let arg: any;
        switch (this.type) {
            case BufferType.ArrayWithLen: {
                // Special case !!!
                bufferReader.skip(this.footerSize);
                return this._readArrayWithLen(bufferReader);
            }
            case BufferType.ArrayWithSize: {
                arg = this._readArrayWithSize(bufferReader);
                break;
            }
            case BufferType.Object: {
                arg = this._readObject(bufferReader);
                break;
            }
            case BufferType.String: {
                arg = this._readString(bufferReader);
                break;
            }
            case BufferType.Buffer: {
                arg = this._readBuffer(bufferReader);
                break;
            }
            case BufferType.PositiveInteger:
            case BufferType.NegativeInteger:
            case BufferType.Double: {
                arg = this._readNumber(bufferReader);
                break;
            }
            case BufferType.BooleanFalse:
            case BufferType.BooleanTrue: {
                arg = this._readBoolean(bufferReader);
                break;
            }
        }
        bufferReader.skip(this.footerSize);
        return arg;
    }

    readBoolean(bufferReader: Reader): boolean {
        this.readHeader(bufferReader);
        let data = this._readBoolean(bufferReader);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readBoolean(bufferReader: Reader): boolean {
        switch (this.type) {
            case BufferType.BooleanTrue:
                return true;
            case BufferType.BooleanFalse:
                return false;
            default:
                return null;
        }
    }

    readNumber(bufferReader: Reader): number {
        this.readHeader(bufferReader);
        let data = this._readNumber(bufferReader);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readNumber(bufferReader: Reader): number {
        switch (this.type) {
            case BufferType.Double:
                return bufferReader.readDouble();
            case BufferType.NegativeInteger:
                return -bufferReader.readUInt32();
            case BufferType.PositiveInteger:
                return +bufferReader.readUInt32();
            default:
                return null;
        }
    }

    readObject(bufferReader: Reader): any {
        this.readHeader(bufferReader);
        if (this.isObject() === false) {
            return null;
        }
        let data = this._readObject(bufferReader);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readObject(bufferReader: Reader): any {
        let data = bufferReader.readString('utf8', this.contentSize);
        return JSON.parse(data);
    }

    readString(bufferReader: Reader, encoding?: string): any {
        this.readHeader(bufferReader);
        if (this.isString() === false) {
            return null;
        }
        let data = this._readString(bufferReader, encoding);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readString(bufferReader: Reader, encoding?: string): string {
        return bufferReader.readString(encoding, this.contentSize);
    }

    readBuffer(bufferReader: Reader): Buffer {
        this.readHeader(bufferReader);
        if (this.isBuffer() === false) {
            return null;
        }
        let data = this._readBuffer(bufferReader);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readBuffer(bufferReader: Reader): Buffer {
        return bufferReader.readBuffer(this.contentSize);
    }

    readArray(bufferReader: Reader): any[] {
        this.readHeader(bufferReader);
        let data = this._readArray(bufferReader);
        bufferReader.skip(this.footerSize);
        return data;
    }

    private _readArray(bufferReader: Reader): any[] {
        switch (this.type) {
            case BufferType.ArrayWithLen: {
                return this._readArrayWithLen(bufferReader);
            }
            case BufferType.ArrayWithSize: {
                return this._readArrayWithSize(bufferReader);
            }
        }
        return null;
    }

    private _readArrayWithSize(bufferReader: Reader): any[] {
        let offsetContentSize = bufferReader.offset + this.contentSize;
        let args = [];
        let headerArg = new IpcPacketBufferWrap();
        while (bufferReader.offset < offsetContentSize) {
            let arg = headerArg.read(bufferReader);
            args.push(arg);
        }
        return args;
    }

    private _readArrayWithLen(bufferReader: Reader): any[] {
        let argsLen = this.argsLen;
        let args = [];
        let headerArg = new IpcPacketBufferWrap();
        while (argsLen > 0) {
            let arg = headerArg.read(bufferReader);
            args.push(arg);
            --argsLen;
        }
        return args;
    }

    readArrayAt(bufferReader: Reader, index: number): any[] {
        this.readHeader(bufferReader);
        switch (this.type) {
            case BufferType.ArrayWithLen: {
                return this._readArrayWithLenAt(bufferReader, index);
            }
            case BufferType.ArrayWithSize: {
                return this._readArrayWithSizeAt(bufferReader, index);
            }
        }
        return null;
    }

    private _readArrayWithSizeAt(bufferReader: Reader, index: number): any {
        let offsetContentSize = bufferReader.offset + this.contentSize;
        let headerArg = new IpcPacketBufferWrap();
        while ((index > 0) && (bufferReader.offset < offsetContentSize)) {
            // Do not decode data just skip
            headerArg.readHeader(bufferReader);
            bufferReader.skip(headerArg.contentSize + headerArg.footerSize);
            --index;
        }
        let arg: any;
        if (index === 0) {
            arg = headerArg.read(bufferReader);
        }
        return arg;
    }

    private _readArrayWithLenAt(bufferReader: Reader, index: number): any {
        let argsLen = this.argsLen;
        if (index >= argsLen) {
            return null;
        }

        let headerArg = new IpcPacketBufferWrap();
        while (index > 0) {
            // Do not decode data just skip
            headerArg.readHeader(bufferReader);
            bufferReader.skip(headerArg.contentSize + headerArg.footerSize);
            --index;
        }
        let arg: any;
        if (index === 0) {
            arg = headerArg.read(bufferReader);
        }
        return arg;
    }
}
