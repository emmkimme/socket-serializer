import { Reader } from './reader';

export const HeaderSeparator = '['.charCodeAt(0);
export const FooterSeparator = ']'.charCodeAt(0);
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
    return (type.charCodeAt(0) << 8) + HeaderSeparator;
}

export enum IpcPacketType {
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

export namespace IpcPacketHeader {
    export interface RawContent {
        type: IpcPacketType;
        contentSize: number;
        partialContent: boolean;
    }
}

export class IpcPacketHeader {
    protected _type: IpcPacketType;
    protected _headerSize: number;
    protected _contentSize: number;
    protected _partialContent: boolean;

    constructor(rawContent?: IpcPacketHeader.RawContent) {
        if (rawContent) {
            this.setTypeAndContentSize(rawContent.type, rawContent.contentSize);
            this._partialContent = rawContent.partialContent;
        }
        else {
            this.reset();
        }
    }

    reset(): void {
        this._type = IpcPacketType.NotValid;
        this._headerSize = -1;
        this._contentSize = -1;
        this._partialContent = false;
    }

    setRawContent(rawContent: IpcPacketHeader.RawContent): void {
        this.setTypeAndContentSize(rawContent.type, rawContent.contentSize);
        this._partialContent = rawContent.partialContent;
    }

    getRawContent(): IpcPacketHeader.RawContent {
        const rawContent: IpcPacketHeader.RawContent = {
            type: this._type,
            contentSize: this._contentSize,
            partialContent: this._partialContent
        };
        return rawContent;
    }

    get type(): IpcPacketType {
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

    protected setTypeAndContentSize(bufferType: IpcPacketType, contentSize: number) {
        this._partialContent = false;
        this._type = bufferType;
        switch (bufferType) {
            case IpcPacketType.Date:
                this._headerSize = FixedHeaderSize;
                this._contentSize = DateContentSize;
                break;
            case IpcPacketType.Double:
                this._headerSize = FixedHeaderSize;
                this._contentSize = DoubleContentSize;
                break;
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
                this._headerSize = FixedHeaderSize;
                this._contentSize = IntegerContentSize;
                break;
            case IpcPacketType.BooleanTrue:
            case IpcPacketType.BooleanFalse:
                this._headerSize = FixedHeaderSize;
                this._contentSize = BooleanContentSize;
                break;
            case IpcPacketType.Null:
            case IpcPacketType.Undefined:
                this._headerSize = FixedHeaderSize;
                this._contentSize = NullUndefinedContentSize;
                break;
            // case IpcPacketType.ArrayWithLen:
            //     this._headerSize = MinHeaderLength;
            //     this._contentSize = 0;
            //     break;
            // case IpcPacketType.Object:
            case IpcPacketType.ObjectSTRINGIFY:
            case IpcPacketType.String:
            case IpcPacketType.Buffer:
            case IpcPacketType.ArrayWithSize:
                this._headerSize = DynamicHeaderSize;
                this._contentSize = contentSize;
                break;
            default:
                this._type = IpcPacketType.NotValid;
                this._headerSize = -1;
                this._contentSize = -1;
                break;
        }
    }

    isNotValid(): boolean {
        return (this._type === IpcPacketType.NotValid);
    }

    isComplete(): boolean {
        return (this._partialContent === false) && (this._type !== IpcPacketType.NotValid) && (this._type !== IpcPacketType.PartialHeader);
    }

    isNull(): boolean {
        return (this._type === IpcPacketType.Null);
    }

    isUndefined(): boolean {
        return (this._type === IpcPacketType.Undefined);
    }

    isArray(): boolean {
        return (this._type === IpcPacketType.ArrayWithSize);
        // switch (this._type) {
        //     case IpcPacketType.ArrayWithSize:
        //     case IpcPacketType.ArrayWithLen:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    // isArrayWithSize(): boolean {
    //     return this._type === IpcPacketType.ArrayWithSize;
    // }

    // isArrayWithLen(): boolean {
    //     return this._type === IpcPacketType.ArrayWithLen;
    // }

    isObject(): boolean {
        return (this._type === IpcPacketType.ObjectSTRINGIFY);
        // switch (this._type) {
        //     case IpcPacketType.Object:
        //     case IpcPacketType.ObjectSTRINGIFY:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    isString(): boolean {
        return (this._type === IpcPacketType.String);
    }

    isBuffer(): boolean {
        return (this._type === IpcPacketType.Buffer);
    }

    isDate(): boolean {
        return (this._type === IpcPacketType.Date);
    }

    isNumber(): boolean {
        switch (this._type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
            case IpcPacketType.Double:
                return true;
            default:
                return false;
        }
    }

    isBoolean(): boolean {
        switch (this._type) {
            case IpcPacketType.BooleanTrue:
            case IpcPacketType.BooleanFalse:
                return true;
            default:
                return false;
        }
    }

    isFixedSize(): boolean {
        return (this._headerSize === FixedHeaderSize);
    }

    readHeader(bufferReader: Reader): boolean {
        // Header minimum size is FixedHeaderSize
        if (bufferReader.checkEOF(FixedHeaderSize)) {
            this._type = IpcPacketType.PartialHeader;
            return false;
        }
        // Read separator
        // Read type / header
        this.setTypeAndContentSize(bufferReader.readUInt16(), -1);
        if (this._type === IpcPacketType.NotValid) {
            return false;
        }
        if (this._headerSize === DynamicHeaderSize) {
            // Substract 'FixedHeaderSize' already read : DynamicHeaderSize - FixedHeaderSize = ContentFieldSize
            if (bufferReader.checkEOF(ContentFieldSize)) {
                this._type = IpcPacketType.PartialHeader;
                return false;
            }
            // Read dynamic packet size
            this._contentSize = bufferReader.readUInt32();
        }
        if (bufferReader.checkEOF(this._contentSize + FooterLength)) {
            // Should be part of the header ?
            // if (this._type === IpcPacketType.ArrayWithSize) {
            //     if (bufferReader.checkEOF(ArrayFieldSize)) {
            //         this._type = IpcPacketType.PartialHeader;
            //         return false;
            //     }
            // }
            this._partialContent = true;
            return false;
        }
        return true;
    }
}