// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { BufferWriter } from './bufferWriter';

const headerSeparator: number = '['.charCodeAt(0);
const footerSeparator: number = ']'.charCodeAt(0);

const MinHeaderLength: number = 2;
// const MaxHeaderLength: number = MinHeaderLength + 4;

const FooterLength: number = 1;
// const StringHeaderLength: number = MinHeaderLength + 4;
// const BufferHeaderLength: number = MinHeaderLength + 4;
// const ArrayHeaderLength: number = MinHeaderLength + 4;
const ObjectHeaderLength: number = MinHeaderLength + 4;
const ArrayHeaderLength: number = MinHeaderLength + 8;

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
    Object = 'O'.charCodeAt(0),
    // 79
    Null = 'N'.charCodeAt(0),
    // 79
    Undefined = 'U'.charCodeAt(0)
};

export class IpcPacketBufferWrap {
    protected _type: BufferType;
    protected _contentSize: number;
    protected _headerSize: number;
    protected _argsLen: number;

    // writeArrayOpt: Function = this.writeArrayWithLen;
    protected writeArray: Function = this.writeArrayWithSize;

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
        switch (this._type) {
            case BufferType.Double:
                this._headerSize = MinHeaderLength;
                this._contentSize = 8;
                break;
            case BufferType.NegativeInteger:
            case BufferType.PositiveInteger:
                this._headerSize = MinHeaderLength;
                this._contentSize = 4;
                break;
            case BufferType.ArrayWithLen:
            case BufferType.ArrayWithSize:
                this._headerSize = ArrayHeaderLength;
                // Empty by default
                this._argsLen = 0;
                this._contentSize = 0;
                break;
            case BufferType.Object:
            case BufferType.String:
            case BufferType.Buffer:
                this._headerSize = ObjectHeaderLength;
                // Empty by default
                this._contentSize = 0;
                break;
            case BufferType.BooleanTrue:
            case BufferType.BooleanFalse:
            case BufferType.Null:
            case BufferType.Undefined:
                this._headerSize = MinHeaderLength;
                this._contentSize = 0;
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
        return this._contentSize + (this._headerSize + FooterLength);
    }

    set packetSize(packetSize: number) {
        this._contentSize = packetSize - (this._headerSize + FooterLength);
    }

    get contentSize(): number {
        return this._contentSize;
    }

    set contentSize(contentSize: number) {
        this._contentSize = contentSize;
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

    isNull(): boolean {
        return (this._type === BufferType.Null);
    }

    isUndefined(): boolean {
        return (this._type === BufferType.Undefined);
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
        return (this._type === BufferType.Object);
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

    protected readHeader(bufferReader: Reader): number {
        if (bufferReader.checkEOF(2)) {
            this._type = BufferType.NotComplete;
            return bufferReader.offset;
        }
        if (bufferReader.readByte() !== headerSeparator) {
            this._type = BufferType.NotValid;
            return bufferReader.offset;
        }
        this.type = bufferReader.readByte();
        if (bufferReader.checkEOF(this._headerSize - 2)) {
            this._type = BufferType.NotComplete;
        }
        else {
            switch (this.type) {
                case BufferType.ArrayWithLen:
                case BufferType.ArrayWithSize:
                    this.packetSize = bufferReader.readUInt32();
                    this._argsLen = bufferReader.readUInt32();
                    break;
                case BufferType.Object:
                case BufferType.String:
                case BufferType.Buffer:
                    this.packetSize = bufferReader.readUInt32();
                    break;
            }
        }
        return bufferReader.offset;
    }

    protected _writeHeader(bufferWriter: Writer): void {
        bufferWriter.writeByte(headerSeparator);
        bufferWriter.writeByte(this._type);
        switch (this._type) {
            case BufferType.ArrayWithLen:
            case BufferType.ArrayWithSize:
                bufferWriter.writeUInt32(this.packetSize);
                bufferWriter.writeUInt32(this._argsLen);
                break;
            case BufferType.Object:
            case BufferType.String:
            case BufferType.Buffer:
                bufferWriter.writeUInt32(this.packetSize);
                break;
        }
    }

    protected writeHeader(bufferWriter: Writer): void {
        // Write header in one block
        let bufferWriterHeader = new BufferWriter(Buffer.alloc(this._headerSize));
        this._writeHeader(bufferWriterHeader);
        bufferWriter.pushContext();
        bufferWriter.writeBuffer(bufferWriterHeader.buffer);
    }

    protected writeFooter(bufferWriter: Writer): void {
        bufferWriter.writeByte(footerSeparator);
        bufferWriter.popContext();
    }

    protected writeHeaderAndFooter(bufferWriter: Writer): void {
        // Write header and footer in one block
        let bufferWriterHeaderAndFooter = new BufferWriter(Buffer.alloc(this._headerSize + FooterLength));
        this._writeHeader(bufferWriterHeaderAndFooter);
        bufferWriter.pushContext();
        bufferWriterHeaderAndFooter.writeByte(footerSeparator);
        bufferWriter.writeBuffer(bufferWriterHeaderAndFooter.buffer);
        bufferWriter.popContext();
    }


    // http://www.ecma-international.org/ecma-262/5.1/#sec-11.4.3
    // Type of val              Result
    // ------------------------------------
    // Undefined                "undefined"
    // Null                     "object"
    // Boolean                  "boolean"
    // Number                   "number"
    // String                   "string"
    // Object (native and does not implement [[Call]])      "object"
    // Object (native or host and does implement [[Call]])  "function"
    // Object (host and does not implement [[Call]])        Implementation-defined except may not be "undefined", "boolean", "number", or "string".
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
            case 'undefined':
                this.writeUndefined(bufferWriter);
                break;
        }
    }

    // Thanks parse https://github.com/tests-always-included/buffer-serializer/
    protected writeNumber(bufferWriter: Writer, dataNumber: number): void {
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

    protected writeBoolean(bufferWriter: Writer, dataBoolean: boolean) {
        this.type = dataBoolean ? BufferType.BooleanTrue : BufferType.BooleanFalse;
        this.writeHeaderAndFooter(bufferWriter);
       }

    protected writeString(bufferWriter: Writer, data: string, encoding?: string): void {
        let buffer = Buffer.from(data, encoding);
        this.type = BufferType.String;
        this.contentSize = buffer.length;
        this.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(buffer);
        this.writeFooter(bufferWriter);
    }

    protected writeBuffer(bufferWriter: Writer, buffer: Buffer): void {
        this.type = BufferType.Buffer;
        this.contentSize = buffer.length;
        this.writeHeader(bufferWriter);
        bufferWriter.writeBuffer(buffer);
        this.writeFooter(bufferWriter);
    }

    protected writeUndefined(bufferWriter: Writer) {
        this.type = BufferType.Undefined;
        this.writeHeaderAndFooter(bufferWriter);
    }

    protected writeNull(bufferWriter: Writer) {
        this.type = BufferType.Null;
        this.writeHeaderAndFooter(bufferWriter);
    }

    protected writeObject(bufferWriter: Writer, dataObject: any): void {
        if (dataObject === null) {
            this.writeNull(bufferWriter);
        }
        else {
            let contentBufferWriter = new BufferListWriter();
            let keys = Object.keys(dataObject);
            for(let i = 0, l = keys.length; i < l; ++i) {
                let key = keys[i];
                let buffer = Buffer.from(key, 'utf8');
                contentBufferWriter.writeUInt32(buffer.length);
                contentBufferWriter.writeBuffer(buffer);
                this.write(contentBufferWriter, dataObject[key]);
            }
            this.type = BufferType.Object;
            this.contentSize = contentBufferWriter.length;
            this.writeHeader(bufferWriter);
            bufferWriter.write(contentBufferWriter);
            this.writeFooter(bufferWriter);
        }
    }

    protected writeArrayWithLen(bufferWriter: Writer, args: any[]): void {
        this.type = BufferType.ArrayWithLen;
        this.argsLen = args.length;
        this.writeHeaderAndFooter(bufferWriter);
        // Create a tempory wrapper for keeping the original header info
        let headerArg = new IpcPacketBufferWrap();
        for (let i = 0, l = args.length; i < l; ++i) {
            headerArg.write(bufferWriter, args[i]);
        }
    }

    protected writeArrayWithSize(bufferWriter: Writer, args: any[]): void {
        let contentBufferWriter = new BufferListWriter();
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(contentBufferWriter, args[i]);
        }
        this.type = BufferType.ArrayWithSize;
        this.argsLen = args.length;
        this.contentSize = contentBufferWriter.length;
        this.writeHeader(bufferWriter);
        bufferWriter.write(contentBufferWriter);
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
            case BufferType.ArrayWithSize:
                arg = this._readArrayWithSize(bufferReader);
                break;

            case BufferType.Object:
                arg = this._readObject(bufferReader);
                break;

            case BufferType.Null:
                arg = null;
                break;

            case BufferType.Undefined:
                arg = undefined;
                break;

            case BufferType.String:
                arg = this._readString(bufferReader);
                break;

            case BufferType.Buffer:
                arg = bufferReader.readBuffer(this.contentSize);
                break;

            case BufferType.Double:
                arg = bufferReader.readDouble();
                break;
            case BufferType.NegativeInteger:
                arg = -bufferReader.readUInt32();
                break;
            case BufferType.PositiveInteger:
                arg = +bufferReader.readUInt32();
                break;

            case BufferType.BooleanTrue:
                arg = true;
                break;
            case BufferType.BooleanFalse:
                arg = false;
                break;
        }
        bufferReader.skip(this.footerSize);
        return arg;
    }

    protected readString(bufferReader: Reader, encoding?: string): string | null {
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

    private _readObject(bufferReader: Reader): any {
        let offsetContentSize = bufferReader.offset + this.contentSize;
        let dataObject: any = {};
        // Create a tempory wrapper for keeping the original header info
        let headerArg = new IpcPacketBufferWrap();
        while (bufferReader.offset < offsetContentSize) {
            let keyLen = bufferReader.readUInt32();
            let key = bufferReader.readString('utf8', keyLen);
            dataObject[key] = headerArg.read(bufferReader);
        }
        return dataObject;
    }

    private _readArrayWithSize(bufferReader: Reader): any[] {
        let offsetContentSize = bufferReader.offset + this.contentSize;
        let args = [];
        // Create a tempory wrapper for keeping the original header info
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
        // Create a tempory wrapper for keeping the original header info
        let headerArg = new IpcPacketBufferWrap();
        while (argsLen > 0) {
            let arg = headerArg.read(bufferReader);
            args.push(arg);
            --argsLen;
        }
        return args;
    }

    protected readArrayLength(bufferReader: Reader): number | null {
        this.readHeader(bufferReader);
        switch (this.type) {
            case BufferType.ArrayWithLen:
            case BufferType.ArrayWithSize:
                return this.argsLen;
        }
        return null;
    }

    protected readArrayAt(bufferReader: Reader, index: number): any | null {
        this.readHeader(bufferReader);
        switch (this.type) {
            case BufferType.ArrayWithLen:
                return this._readArrayWithLenAt(bufferReader, index);
            case BufferType.ArrayWithSize:
                return this._readArrayWithSizeAt(bufferReader, index);
        }
        return null;
    }

    private _readArrayWithSizeAt(bufferReader: Reader, index: number): any {
        let offsetContentSize = bufferReader.offset + this.contentSize;
        // Create a tempory wrapper for keeping the original header info
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

        // Create a tempory wrapper for keeping the original header info
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
