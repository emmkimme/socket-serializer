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
        headerSize: number;
        contentSize: number;
    }
}

export class IpcPacketHeader {
    protected _rawContent: IpcPacketHeader.RawContent;

    constructor(rawContent?: IpcPacketHeader.RawContent) {
        if (rawContent) {
            this._rawContent = rawContent;
        }
        else {
            this.reset();
        }
    }

    reset(): void {
        this._rawContent = {
            type: IpcPacketType.NotValid,
            headerSize: -1,
            contentSize: -1
        };
    }

    setRawContent(rawContent: IpcPacketHeader.RawContent): void {
        this._rawContent = rawContent;
    }

    getRawContent(): IpcPacketHeader.RawContent {
        return this._rawContent;
    }

    get type(): IpcPacketType {
        return this._rawContent.type;
    }

    get packetSize(): number {
        return this._rawContent.contentSize + (this._rawContent.headerSize + FooterLength);
    }

    get contentSize(): number {
        return this._rawContent.contentSize;
    }

    get footerSize(): number {
        return FooterLength;
    }

    get headerSize(): number {
        return this._rawContent.headerSize;
    }

    isNotValid(): boolean {
        return (this._rawContent.type === IpcPacketType.NotValid);
    }

    isComplete(): boolean {
        return (this._rawContent.type !== IpcPacketType.NotValid) && (this._rawContent.type !== IpcPacketType.PartialHeader);
    }

    isNull(): boolean {
        return (this._rawContent.type === IpcPacketType.Null);
    }

    isUndefined(): boolean {
        return (this._rawContent.type === IpcPacketType.Undefined);
    }

    isArray(): boolean {
        return (this._rawContent.type === IpcPacketType.ArrayWithSize);
        // switch (this._rawContent.type) {
        //     case IpcPacketType.ArrayWithSize:
        //     case IpcPacketType.ArrayWithLen:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    // isArrayWithSize(): boolean {
    //     return this._rawContent.type === IpcPacketType.ArrayWithSize;
    // }

    // isArrayWithLen(): boolean {
    //     return this._rawContent.type === IpcPacketType.ArrayWithLen;
    // }

    isObject(): boolean {
        return (this._rawContent.type === IpcPacketType.ObjectSTRINGIFY);
        // switch (this._rawContent.type) {
        //     case IpcPacketType.Object:
        //     case IpcPacketType.ObjectSTRINGIFY:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    isString(): boolean {
        return (this._rawContent.type === IpcPacketType.String);
    }

    isBuffer(): boolean {
        return (this._rawContent.type === IpcPacketType.Buffer);
    }

    isDate(): boolean {
        return (this._rawContent.type === IpcPacketType.Date);
    }

    isNumber(): boolean {
        switch (this._rawContent.type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
            case IpcPacketType.Double:
                return true;
            default:
                return false;
        }
    }

    isBoolean(): boolean {
        switch (this._rawContent.type) {
            case IpcPacketType.BooleanTrue:
            case IpcPacketType.BooleanFalse:
                return true;
            default:
                return false;
        }
    }

    isFixedSize(): boolean {
        return (this._rawContent.headerSize === FixedHeaderSize);
    }

    static CheckType(type: IpcPacketType, contentSize: number): IpcPacketHeader.RawContent {
        switch (type) {
            case IpcPacketType.Date:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: DateContentSize
                };
            case IpcPacketType.Double:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: DoubleContentSize
                };
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: IntegerContentSize
                };
            case IpcPacketType.BooleanTrue:
            case IpcPacketType.BooleanFalse:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: BooleanContentSize
                };
            case IpcPacketType.Null:
            case IpcPacketType.Undefined:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: NullUndefinedContentSize
                };
            // case IpcPacketType.Object:
            case IpcPacketType.ObjectSTRINGIFY:
            case IpcPacketType.String:
            case IpcPacketType.Buffer:
            case IpcPacketType.ArrayWithSize:
                return {
                    type,
                    headerSize: DynamicHeaderSize,
                    contentSize
                };
            case IpcPacketType.PartialHeader:
            case IpcPacketType.NotValid:
                return {
                    type,
                    headerSize: -1,
                    contentSize: -1
                };
            default:
                return {
                    type: IpcPacketType.NotValid,
                    headerSize: -1,
                    contentSize: -1
                };
        }
    }

   static ReadHeader(bufferReader: Reader): IpcPacketHeader.RawContent {
        // Header minimum size is FixedHeaderSize
        if (bufferReader.checkEOF(FixedHeaderSize)) {
            return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
        }
        // Read separator
        // Read type / header
        const rawContent = IpcPacketHeader.CheckType(bufferReader.readUInt16(), -1);
        if (rawContent.type === IpcPacketType.NotValid) {
            return rawContent;
        }
        if (rawContent.headerSize === DynamicHeaderSize) {
            // Substract 'FixedHeaderSize' already read : DynamicHeaderSize - FixedHeaderSize = ContentFieldSize
            if (bufferReader.checkEOF(ContentFieldSize)) {
                return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
            }
            // Read dynamic packet size
            rawContent.contentSize = bufferReader.readUInt32();
        }
        if (bufferReader.checkEOF(rawContent.contentSize + FooterLength)) {
            return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
        }
        return rawContent;
    }
}