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
    export interface RawData {
        type: IpcPacketType;
        headerSize: number;
        contentSize: number;
    }
}

export class IpcPacketHeader {
    protected _rawHeader: IpcPacketHeader.RawData;

    constructor(rawHeader?: IpcPacketHeader.RawData) {
        if (rawHeader) {
            this._rawHeader = rawHeader;
        }
        else {
            this.reset();
        }
    }

    reset(): void {
        this._rawHeader = {
            type: IpcPacketType.NotValid,
            headerSize: -1,
            contentSize: -1
        };
    }

    setRawData(rawHeader: IpcPacketHeader.RawData): void {
        this._rawHeader = rawHeader;
    }

    getRawData(): IpcPacketHeader.RawData {
        return this._rawHeader;
    }

    get type(): IpcPacketType {
        return this._rawHeader.type;
    }

    get packetSize(): number {
        return this._rawHeader.contentSize + (this._rawHeader.headerSize + FooterLength);
    }

    get contentSize(): number {
        return this._rawHeader.contentSize;
    }

    get footerSize(): number {
        return FooterLength;
    }

    get headerSize(): number {
        return this._rawHeader.headerSize;
    }

    isNotValid(): boolean {
        return (this._rawHeader.type === IpcPacketType.NotValid);
    }

    isComplete(): boolean {
        return (this._rawHeader.type !== IpcPacketType.NotValid) && (this._rawHeader.type !== IpcPacketType.PartialHeader);
    }

    isNull(): boolean {
        return (this._rawHeader.type === IpcPacketType.Null);
    }

    isUndefined(): boolean {
        return (this._rawHeader.type === IpcPacketType.Undefined);
    }

    isArray(): boolean {
        return (this._rawHeader.type === IpcPacketType.ArrayWithSize);
        // switch (this._rawHeader.type) {
        //     case IpcPacketType.ArrayWithSize:
        //     case IpcPacketType.ArrayWithLen:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    // isArrayWithSize(): boolean {
    //     return this._rawHeader.type === IpcPacketType.ArrayWithSize;
    // }

    // isArrayWithLen(): boolean {
    //     return this._rawHeader.type === IpcPacketType.ArrayWithLen;
    // }

    isObject(): boolean {
        return (this._rawHeader.type === IpcPacketType.ObjectSTRINGIFY);
        // switch (this._rawHeader.type) {
        //     case IpcPacketType.Object:
        //     case IpcPacketType.ObjectSTRINGIFY:
        //         return true;
        //     default:
        //         return false;
        // }
    }

    isString(): boolean {
        return (this._rawHeader.type === IpcPacketType.String);
    }

    isBuffer(): boolean {
        return (this._rawHeader.type === IpcPacketType.Buffer);
    }

    isDate(): boolean {
        return (this._rawHeader.type === IpcPacketType.Date);
    }

    isNumber(): boolean {
        switch (this._rawHeader.type) {
            case IpcPacketType.NegativeInteger:
            case IpcPacketType.PositiveInteger:
            case IpcPacketType.Double:
                return true;
            default:
                return false;
        }
    }

    isBoolean(): boolean {
        switch (this._rawHeader.type) {
            case IpcPacketType.BooleanTrue:
            case IpcPacketType.BooleanFalse:
                return true;
            default:
                return false;
        }
    }

    isFixedSize(): boolean {
        return (this._rawHeader.headerSize === FixedHeaderSize);
    }

    static CheckType(type: IpcPacketType, contentSize: number): IpcPacketHeader.RawData {
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

   static ReadHeader(bufferReader: Reader): IpcPacketHeader.RawData {
        // Header minimum size is FixedHeaderSize
        if (bufferReader.checkEOF(FixedHeaderSize)) {
            return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
        }
        // Read separator
        // Read type / header
        const rawHeader = IpcPacketHeader.CheckType(bufferReader.readUInt16(), -1);
        if (rawHeader.type === IpcPacketType.NotValid) {
            return rawHeader;
        }
        if (rawHeader.headerSize === DynamicHeaderSize) {
            // Substract 'FixedHeaderSize' already read : DynamicHeaderSize - FixedHeaderSize = ContentFieldSize
            if (bufferReader.checkEOF(ContentFieldSize)) {
                return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
            }
            // Read dynamic packet size
            rawHeader.contentSize = bufferReader.readUInt32();
        }
        if (bufferReader.checkEOF(rawHeader.contentSize + FooterLength)) {
            return IpcPacketHeader.CheckType(IpcPacketType.PartialHeader, -1);
        }
        return rawHeader;
    }
}