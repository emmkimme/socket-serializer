// import { Buffer } from 'buffer';
import { Reader } from './reader';
import { Writer } from './writer';
import { BufferListWriter } from './bufferListWriter';
import { BufferWriter } from './bufferWriter';
import { JSONParser } from 'json-helpers';

const headerSeparator = '['.charCodeAt(0);
const footerSeparator = ']'.charCodeAt(0);
export const FooterLength = 1;

export const FixedHeaderSize = 2;
export const ContentFieldSize = 4;
export const ArrayFieldSize = 4;
export const DynamicHeaderSize = FixedHeaderSize + ContentFieldSize;
// const ArrayHeaderSize = DynamicHeaderSize + ArrayFieldSize;

export const DoubleContentSize = 8;
export const DateContentSize = 8;
export const IntegerContentSize = 4;
export const BooleanContentSize = 0;
export const NullUndefinedContentSize = 0;

function BufferTypeHeader(type: string): number {
    return (type.charCodeAt(0) << 8) + headerSeparator;
}

export enum BufferType {
    // 88
    NotValid = BufferTypeHeader('X'),
    // 70
    PartialHeader = BufferTypeHeader('p'),
    // // 85
    // Partial = BufferTypeHeader('P'),
    // 115
    String = BufferTypeHeader('s'),
    // 66
    Buffer = BufferTypeHeader('B'),
    // 84
    BooleanTrue = BufferTypeHeader('T'),
    // 70
    BooleanFalse = BufferTypeHeader('F'),
    // 65
    ArrayWithSize = BufferTypeHeader('A'),
    // 97 --- EXPERIMENTAL, avoid to read in advance the full array
    // ArrayWithLen = BufferTypeHeader('a'),
    // 42
    PositiveInteger = BufferTypeHeader('+'),
    // 45
    NegativeInteger = BufferTypeHeader('-'),
    // 100
    Double = BufferTypeHeader('d'),
    // 79
    Object = BufferTypeHeader('O'),
    // 111
    ObjectSTRINGIFY = BufferTypeHeader('o'),
    // 78
    Null = BufferTypeHeader('N'),
    // 85
    Undefined = BufferTypeHeader('U'),
    // 68
    Date = BufferTypeHeader('D'),
};

const BufferFooter = Buffer.allocUnsafe(1).fill(footerSeparator);

function CreateBufferFor(bufferType: BufferType, contentSize: number, num: number): Buffer {
    // assert(this.isFixedSize() === true);
    // Write the whole in one block buffer, to avoid multiple small buffers
    const packetSize = FixedHeaderSize + contentSize + FooterLength;
    const bufferWriteAllInOne = new BufferWriter(Buffer.allocUnsafe(packetSize));
    bufferWriteAllInOne.writeUInt16(bufferType);
    // Write content
    switch (bufferType) {
        case BufferType.NegativeInteger:
        case BufferType.PositiveInteger:
            bufferWriteAllInOne.writeUInt32(num);
            break;
        case BufferType.Double:
        case BufferType.Date:
            bufferWriteAllInOne.writeDouble(num);
            break;
        // case BufferType.Null:
        // case BufferType.Undefined:
        // case BufferType.BooleanFalse:
        // case BufferType.BooleanTrue:
        //     break;
        // default :
        //     throw new Error('socket-serializer - write: not expected data');
    }
    // Write footer
    bufferWriteAllInOne.writeByte(footerSeparator);
    return bufferWriteAllInOne.buffer;
}

const BufferBooleanTrue = CreateBufferFor(BufferType.BooleanTrue, BooleanContentSize, -1);
const BufferBooleanFalse = CreateBufferFor(BufferType.BooleanFalse, BooleanContentSize, -1);
const BufferUndefined = CreateBufferFor(BufferType.Undefined, NullUndefinedContentSize, -1);
const BufferNull = CreateBufferFor(BufferType.Null, NullUndefinedContentSize, -1);

export namespace IpcPacketCore {
    export interface RawContent {
        type: BufferType;
        contentSize: number;
        partialContent: boolean;
    }
}

export class IpcPacketCore {
    protected _type: BufferType;
    protected _headerSize: number;
    protected _contentSize: number;
    protected _partialContent: boolean;

    constructor(rawContent?: IpcPacketCore.RawContent) {
        if (rawContent) {
            this.setTypeAndContentSize(rawContent.type, rawContent.contentSize);
        }
        else {
            this.setTypeAndContentSize(BufferType.NotValid, -1);
        }
    }

    reset(): void {
        this.setTypeAndContentSize(BufferType.NotValid, -1);
    }

    setRawContent(rawContent: IpcPacketCore.RawContent): void {
        this.setTypeAndContentSize(rawContent.type, rawContent.contentSize);
        this._partialContent = rawContent.partialContent;
    }

    getRawContent(): IpcPacketCore.RawContent {
        const rawContent: IpcPacketCore.RawContent = {
            type: this._type,
            contentSize: this._contentSize,
            partialContent: this._partialContent
        };
        return rawContent;
    }

    get type(): BufferType {
        return this._type;
    }

    get packetSize(): number {
        return this._contentSize + (this._headerSize + FooterLength);
    }

    get contentSize(): number {
        return this._contentSize;
    }

    get footerSize(): number {
        return FooterLength;
    }

    get headerSize(): number {
        return this._headerSize;
    }

    protected setTypeAndContentSize(bufferType: BufferType, contentSize: number) {
        this._partialContent = false;
        this._type = bufferType;
        switch (bufferType) {
            case BufferType.Date:
                this._headerSize = FixedHeaderSize;
                this._contentSize = DateContentSize;
                break;
            case BufferType.Double:
                this._headerSize = FixedHeaderSize;
                this._contentSize = DoubleContentSize;
                break;
            case BufferType.NegativeInteger:
            case BufferType.PositiveInteger:
                this._headerSize = FixedHeaderSize;
                this._contentSize = IntegerContentSize;
                break;
            case BufferType.BooleanTrue:
            case BufferType.BooleanFalse:
                this._headerSize = FixedHeaderSize;
                this._contentSize = BooleanContentSize;
                break;
            case BufferType.Null:
            case BufferType.Undefined:
                this._headerSize = FixedHeaderSize;
                this._contentSize = NullUndefinedContentSize;
                break;
            // case BufferType.ArrayWithLen:
            //     this._headerSize = MinHeaderLength;
            //     this._contentSize = 0;
            //     break;
            case BufferType.Object:
            case BufferType.ObjectSTRINGIFY:
            case BufferType.String:
            case BufferType.Buffer:
            case BufferType.ArrayWithSize:
                this._headerSize = DynamicHeaderSize;
                this._contentSize = contentSize;
                break;
            default:
                this._type = BufferType.NotValid;
                this._headerSize = -1;
                this._contentSize = -1;
                break;
        }
    }

    isNotValid(): boolean {
        return (this._type === BufferType.NotValid);
    }

    isComplete(): boolean {
        return (this._partialContent === false) && (this._type !== BufferType.NotValid) && (this._type !== BufferType.PartialHeader);
    }

    isNull(): boolean {
        return (this._type === BufferType.Null);
    }

    isUndefined(): boolean {
        return (this._type === BufferType.Undefined);
    }

    isArray(): boolean {
        return (this._type === BufferType.ArrayWithSize);
        // switch (this._type) {
        //     case BufferType.ArrayWithSize:
        //     case BufferType.ArrayWithLen:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    // isArrayWithSize(): boolean {
    //     return this._type === BufferType.ArrayWithSize;
    // }

    // isArrayWithLen(): boolean {
    //     return this._type === BufferType.ArrayWithLen;
    // }

    isObject(): boolean {
        switch (this._type) {
            case BufferType.Object:
            case BufferType.ObjectSTRINGIFY:
                return true;
            default:
                return false;
        }
    }

    isString(): boolean {
        return (this._type === BufferType.String);
    }

    isBuffer(): boolean {
        return (this._type === BufferType.Buffer);
    }

    isDate(): boolean {
        return (this._type === BufferType.Date);
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

    isFixedSize(): boolean {
        return (this._headerSize === FixedHeaderSize);
    }

    _readHeader(bufferReader: Reader): boolean {
        // Header minimum size is FixedHeaderSize
        if (bufferReader.checkEOF(FixedHeaderSize)) {
            this._type = BufferType.PartialHeader;
            return false;
        }
        // Read separator
        // Read type / header
        this.setTypeAndContentSize(bufferReader.readUInt16(), -1);
        if (this._type === BufferType.NotValid) {
            return false;
        }
        if (this._headerSize === DynamicHeaderSize) {
            // Substract 'FixedHeaderSize' already read : DynamicHeaderSize - FixedHeaderSize = ContentFieldSize
            if (bufferReader.checkEOF(ContentFieldSize)) {
                this._type = BufferType.PartialHeader;
                return false;
            }
            // Read dynamic packet size
            this._contentSize = bufferReader.readUInt32();
        }
        if (bufferReader.checkEOF(this._contentSize + FooterLength)) {
            // Should be part of the header ?
            // if (this._type === BufferType.ArrayWithSize) {
            //     if (bufferReader.checkEOF(ArrayFieldSize)) {
            //         this._type = BufferType.PartialHeader;
            //         return false;
            //     }
            // }
            this._partialContent = true;
            return false;
        }
        return true;
    }

    protected pushDynamicContent(bufferWriter: Writer, bufferType: BufferType, contentSize: number): void {
        // Write header
        bufferWriter.pushContext();
        bufferWriter.writeUInt16(bufferType);
        bufferWriter.writeUInt32(contentSize);
    }

    protected popDynamicContent(bufferWriter: Writer): void {
        // Write Footer
        bufferWriter.writeBuffer(BufferFooter);
        bufferWriter.popContext();
    }

    // Write header, content and footer in one block
    // Only for basic types except string, buffer and object
// Write header, content and footer in one block
    // Only for basic types except string, buffer and object
    protected writeFixedSize(bufferWriter: Writer, bufferType: BufferType, bufferContent?: Buffer): void {
        switch (bufferType) {
            case BufferType.NegativeInteger:
            case BufferType.PositiveInteger:
            case BufferType.Double:
            case BufferType.Date:
                break;
            case BufferType.Null:
                bufferContent = BufferNull;
                break;
            case BufferType.Undefined:
                bufferContent = BufferUndefined;
                break;
            case BufferType.BooleanFalse:
                bufferContent = BufferBooleanFalse;
                break;
            case BufferType.BooleanTrue:
                bufferContent = BufferBooleanTrue;
                break;
            // default :
            //     throw new Error('socket-serializer - write: not expected data');
        }
        // Push block in origin writer
        bufferWriter.pushContext();
        bufferWriter.writeBuffer(bufferContent);
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
                else if (data instanceof Date) {
                    this.writeDate(bufferWriter, data);
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
                this.writeFixedSize(bufferWriter, BufferType.Undefined);
                break;
            case 'symbol':
            default:
                break;
        }
    }

    writeBoolean(bufferWriter: Writer, dataBoolean: boolean) {
        const type = dataBoolean ? BufferType.BooleanTrue : BufferType.BooleanFalse;
        this.writeFixedSize(bufferWriter, type);
    }

    // Thanks for parsing coming from https://github.com/tests-always-included/buffer-serializer/
    writeNumber(bufferWriter: Writer, dataNumber: number): void {
        // An integer
        if (Number.isInteger(dataNumber)) {
            const absDataNumber = Math.abs(dataNumber);
            // 32-bit integer
            if (absDataNumber <= 0xFFFFFFFF) {
                // Negative integer
                if (dataNumber < 0) {
                    const bufferContent = CreateBufferFor(BufferType.NegativeInteger, IntegerContentSize, absDataNumber);
                    this.writeFixedSize(bufferWriter, BufferType.NegativeInteger, bufferContent);
                }
                // Positive integer
                else {
                    const bufferContent = CreateBufferFor(BufferType.PositiveInteger, IntegerContentSize, absDataNumber);
                    this.writeFixedSize(bufferWriter, BufferType.PositiveInteger, bufferContent);
                }
                return;
            }
        }
        // Either this is not an integer or it is outside of a 32-bit integer.
        // Save as a double.
        const bufferContent = CreateBufferFor(BufferType.Double, DoubleContentSize, dataNumber);
        this.writeFixedSize(bufferWriter, BufferType.Double, bufferContent);
    }

    writeDate(bufferWriter: Writer, data: Date) {
        const bufferContent = CreateBufferFor(BufferType.Date, DateContentSize, data.getTime());
        this.writeFixedSize(bufferWriter, BufferType.Date, bufferContent);
    }

    // We do not use writeFixedSize
    // In order to prevent a potential costly copy of the buffer, we write it directly in the writer.
    writeString(bufferWriter: Writer, data: string, encoding?: BufferEncoding): void {
        // Encoding will be managed later, force 'utf8'
        // case 'hex':
        // case 'utf8':
        // case 'utf-8':
        // case 'ascii':
        // case 'latin1':
        // case 'binary':
        // case 'base64':
        // case 'ucs2':
        // case 'ucs-2':
        // case 'utf16le':
        // case 'utf-16le':
        const buffer = Buffer.from(data, 'utf8');
        const contentSize = buffer.length;
        this.pushDynamicContent(bufferWriter, BufferType.String, contentSize);
        bufferWriter.writeBuffer(buffer);
        this.popDynamicContent(bufferWriter);
    }

    writeBuffer(bufferWriter: Writer, buffer: Buffer): void {
        const contentSize = buffer.length;
        this.pushDynamicContent(bufferWriter, BufferType.Buffer, contentSize);
        bufferWriter.writeBuffer(buffer);
        this.popDynamicContent(bufferWriter);
    }

    writeObjectDirect1(bufferWriter: Writer, dataObject: any): void {
        if (dataObject === null) {
            this.writeFixedSize(bufferWriter, BufferType.Null);
        }
        else {
            const contentBufferWriter = new BufferListWriter();
            for (let [key, value] of Object.entries(dataObject)) {
                const buffer = Buffer.from(key, 'utf8');
                contentBufferWriter.writeUInt32(buffer.length);
                contentBufferWriter.writeBuffer(buffer);
                this.write(contentBufferWriter, value);
            }
            const contentSize = contentBufferWriter.length;
            this.pushDynamicContent(bufferWriter, BufferType.Object, contentSize);
            bufferWriter.write(contentBufferWriter);
            this.popDynamicContent(bufferWriter);
        }
    }

    writeObjectDirect2(bufferWriter: Writer, dataObject: any): void {
        if (dataObject === null) {
            this.writeFixedSize(bufferWriter, BufferType.Null);
        }
        else {
            const contentBufferWriter = new BufferListWriter();
            // let keys = Object.getOwnPropertyNames(dataObject);
            const keys = Object.keys(dataObject);
            for (let i = 0, l = keys.length; i < l; ++i) {
                const key = keys[i];
                const desc = Object.getOwnPropertyDescriptor(dataObject, key);
                if (desc && (typeof desc.value !== 'function')) {
                    const buffer = Buffer.from(key, 'utf8');
                    contentBufferWriter.writeUInt32(buffer.length);
                    contentBufferWriter.writeBuffer(buffer);
                    // this.write(contentBufferWriter, desc.value || dataObject[key]);
                    this.write(contentBufferWriter, desc.value);
                }
            }
            const contentSize = contentBufferWriter.length;
            this.pushDynamicContent(bufferWriter, BufferType.Object, contentSize);
            bufferWriter.write(contentBufferWriter);
            this.popDynamicContent(bufferWriter);
        }
    }

    writeObjectSTRINGIFY1(bufferWriter: Writer, dataObject: any): void {
        if (dataObject === null) {
            this.writeFixedSize(bufferWriter, BufferType.Null);
        }
        else {
            const stringifycation = JSON.stringify(dataObject);
            const buffer = Buffer.from(stringifycation);
            const contentSize = buffer.length;
            this.pushDynamicContent(bufferWriter, BufferType.ObjectSTRINGIFY, contentSize);
            bufferWriter.writeBuffer(buffer);
            this.popDynamicContent(bufferWriter);
        }
    }

    // Default methods for these kind of data
    writeObject(bufferWriter: Writer, dataObject: any): void {
        if (dataObject === null) {
            this.writeFixedSize(bufferWriter, BufferType.Null);
        }
        else {
            const stringifycation = JSONParser.stringify(dataObject);
            const buffer = Buffer.from(stringifycation, 'utf8');
            const contentSize = buffer.length;
            this.pushDynamicContent(bufferWriter, BufferType.ObjectSTRINGIFY, contentSize);
            bufferWriter.writeBuffer(buffer);
            this.popDynamicContent(bufferWriter);
        }
    }

    // Default methods for these kind of data
    writeArray(bufferWriter: Writer, args: any[]): void {
        const contentBufferWriter = new BufferListWriter();
        // JSONParser.install();
        for (let i = 0, l = args.length; i < l; ++i) {
            this.write(contentBufferWriter, args[i]);
        }
        // JSONParser.uninstall();
        // Add args.length size
        const contentSize = contentBufferWriter.length + ArrayFieldSize;
        this.pushDynamicContent(bufferWriter, BufferType.ArrayWithSize, contentSize);
        bufferWriter.writeUInt32(args.length);
        bufferWriter.write(contentBufferWriter);
        this.popDynamicContent(bufferWriter);
    }

    read(bufferReader: Reader): any | undefined {
        if (this._readHeader(bufferReader)) {
            const arg = this._readContent(bufferReader);
            bufferReader.skip(FooterLength);
            return arg;
        }
        // throw err ?
        return undefined;
    }

    _readContent(bufferReader: Reader): any | undefined {
        switch (this._type) {
            case BufferType.String:
                return this._readContentString(bufferReader, this._contentSize);

            case BufferType.Buffer:
                return bufferReader.subarray(this._contentSize);

            case BufferType.Double:
                return bufferReader.readDouble();
            case BufferType.NegativeInteger:
                return -bufferReader.readUInt32();
            case BufferType.PositiveInteger:
                return +bufferReader.readUInt32();

            case BufferType.BooleanTrue:
                return true;
            case BufferType.BooleanFalse:
                return false;

            case BufferType.Date:
                return new Date(bufferReader.readDouble());
    
                // case BufferType.ArrayWithLen:
            case BufferType.ArrayWithSize:
                return this._readContentArray(bufferReader);

            case BufferType.Object:
                return this._readContentObjectDirect(bufferReader);
            case BufferType.ObjectSTRINGIFY:
                return this._readContentObject(bufferReader);

            case BufferType.Null:
                return null;

            case BufferType.Undefined:
                return undefined;

            default: 
                return undefined;
        }
    }

    // Header has been read and checked
    _readContentString(bufferReader: Reader, len: number): string {
        // Encoding will be managed later
        return bufferReader.readString('utf8', len);
    }

    // Header has been read and checked
    // protected _readObjectSTRINGIFY1(bufferReader: Reader): string {
    //     const data = bufferReader.readString('utf8', this._contentSize);
    //     return JSON.parse(data);
    // }

    _readContentObject(bufferReader: Reader): string {
        const data = bufferReader.readString('utf8', this._contentSize);
        return JSONParser.parse(data);
    }

    // Header has been read and checked
    _readContentObjectDirect(bufferReader: Reader): any {
        const offsetContentSize = bufferReader.offset + this._contentSize;
        const dataObject: any = {};
        while (bufferReader.offset < offsetContentSize) {
            let keyLen = bufferReader.readUInt32();
            let key = bufferReader.readString('utf8', keyLen);
            dataObject[key] = this.read(bufferReader);
        }
        return dataObject;
    }

    // Header has been read and checked
    _readContentArray(bufferReader: Reader): any[] {
        const argsLen = bufferReader.readUInt32();
        const args = new Array(argsLen);
        let argIndex = 0;
        while (argIndex < argsLen) {
            const arg = this.read(bufferReader);
            args[argIndex++] = arg;
        }
        return args;
    }

    // Header has been read and checked
    _readContentArrayLength(bufferReader: Reader): number| undefined {
        return bufferReader.readUInt32();
    }

    protected byPass(bufferReader: Reader): boolean {
        // Do not decode data just skip
        if (this._readHeader(bufferReader)) {
            bufferReader.skip(this._contentSize + FooterLength);
            return true;
        }
        return false;
    }

    // Header has been read and checked
    _readContentArrayAt(bufferReader: Reader, index: number): any | undefined {
        const argsLen = bufferReader.readUInt32();
        if (index >= argsLen) {
            return undefined;
        }
        while (index > 0) {
            // Do not decode data just skip
            if (this.byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --index;
        }
        return this.read(bufferReader);
    }

    // Header has been read and checked
    _readContentArraySlice(bufferReader: Reader, start?: number, end?: number): any | undefined {
        const argsLen = bufferReader.readUInt32();
        if (start == null) {
            start = 0;
        }
        else if (start < 0) {
            start = argsLen + start;
        }
        if (start >= argsLen) {
            return [];
        }
        if (end == null) {
            end = argsLen;
        }
        else if (end < 0) {
            end = argsLen + end;
        }
        else {
            end = Math.min(end, argsLen);
        }
        if (end <= start) {
            return [];
        }

        while (start > 0) {
            // Do not decode data just skip
            if (this.byPass(bufferReader) === false) {
                // throw err ?
                return undefined;
            }
            --start;
            --end;
        }
        const args = new Array(end);
        let argIndex = 0;
        while (argIndex < end) {
            const arg = this.read(bufferReader);
            args[argIndex++] = arg;
        }
        return args;
    }
}
