import { Reader } from '../buffer/reader';

export const HeaderSeparator = '['.charCodeAt(0);
export const FooterSeparator = ']'.charCodeAt(0);
export const FooterLength = 1;

export const FixedHeaderSize = 2;
export const ContentFieldSize = 4;
export const ArrayFieldSize = 4;
export const DynamicHeaderSize = FixedHeaderSize + ContentFieldSize;
// const ArrayHeaderSize = DynamicHeaderSize + ArrayFieldSize;

export const DoubleContentSize = 8;
export const IntegerContentSize = 4;
export const ZeroContentSize = 0;

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
    // 42
    PositiveInteger = BufferTypeHeader('+'),
    // 45
    NegativeInteger = BufferTypeHeader('-'),
    // 65
    ArrayWithSize = BufferTypeHeader('A'),
    // 66
    Buffer = BufferTypeHeader('B'),
    // 67
    ArrayBufferWithSize = BufferTypeHeader('C'),
    // 68
    Date = BufferTypeHeader('D'),
    // 70
    BooleanFalse = BufferTypeHeader('F'),
    // 78
    Null = BufferTypeHeader('N'),
    // 79
    Object = BufferTypeHeader('O'),
    // 84
    BooleanTrue = BufferTypeHeader('T'),
    // 85
    Undefined = BufferTypeHeader('U'),
    // 97 --- EXPERIMENTAL, avoid to read in advance the full array
    // ArrayWithLen = BufferTypeHeader('a'),
    // 100
    Double = BufferTypeHeader('d'),
    // 111
    ObjectSTRINGIFY = BufferTypeHeader('o'),
    // 115
    String = BufferTypeHeader('s'),
};

export namespace IpcPacketHeader {
    export interface RawData {
        type: IpcPacketType;
        headerSize: number;
        contentSize: number;
    }
}

export interface TypedArrayFactory {
    ctor: any;
    shortCode: number;
};

export const MapArrayBufferToShortCodes: Record<string, TypedArrayFactory> = {
    'uint8array': {
        ctor: Uint8Array,
        shortCode: 1
    },
    'uint8clampedarray': {
        ctor: Uint8ClampedArray,
        shortCode: 2
    },
    'uint16array': {
        ctor: Uint16Array,
        shortCode: 3
    },
    'uint32array': {
        ctor: Uint32Array,
        shortCode: 4
    },
    'int8array': {
        ctor: Int8Array,
        shortCode: 5
    },
    'int16array': {
        ctor: Int16Array,
        shortCode: 6
    },
    'int32array': {
        ctor: Int32Array,
        shortCode: 8
    },
    'bigint64array': {
        ctor: BigInt64Array,
        shortCode: 9
    },
    'biguint64array': {
        ctor: BigUint64Array,
        shortCode: 10
    },
    'biguint64float32arrayarray': {
        ctor: Float32Array,
        shortCode: 11
    },
    'float64array': {
        ctor: Float64Array,
        shortCode: 12
    },
};

export const MapShortCodeToArrayBuffer: Record<number, TypedArrayFactory> = (() => {
    const mapShortCodeToTypedArray: Record<number, TypedArrayFactory> = {};
    Object.entries(MapArrayBufferToShortCodes).forEach(([key, value]: [string, any]) => {
        mapShortCodeToTypedArray[value.shortCode] = value;
    });
    return mapShortCodeToTypedArray;
})();

const DefaultRawHeader: IpcPacketHeader.RawData = {
    type: IpcPacketType.NotValid,
    headerSize: -1,
    contentSize: -1
} as const;

export class IpcPacketHeader {
    protected _rawHeader: IpcPacketHeader.RawData;

    constructor(rawHeader?: IpcPacketHeader.RawData) {
        if (rawHeader) {
            this._rawHeader = rawHeader;
        }
        else {
            this._rawHeader = Object.assign({}, DefaultRawHeader);
        }
    }

    reset(): void {
        Object.assign(this._rawHeader, DefaultRawHeader);
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

    static DeclareHeader(type: IpcPacketType, contentSize: number): IpcPacketHeader.RawData {
        switch (type) {
            case IpcPacketType.Date:
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
            case IpcPacketType.Null:
            case IpcPacketType.Undefined:
                return {
                    type,
                    headerSize: FixedHeaderSize,
                    contentSize: ZeroContentSize
                };
            // case IpcPacketType.Object:
            case IpcPacketType.ObjectSTRINGIFY:
            case IpcPacketType.String:
            case IpcPacketType.Buffer:
            case IpcPacketType.ArrayWithSize:
            case IpcPacketType.ArrayBufferWithSize:
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
            return IpcPacketHeader.DeclareHeader(IpcPacketType.PartialHeader, -1);
        }
        // Read separator
        // Read type / header
        const rawHeader = IpcPacketHeader.DeclareHeader(bufferReader.readUInt16(), -1);
        if (rawHeader.type === IpcPacketType.NotValid) {
            return rawHeader;
        }
        if (rawHeader.headerSize === DynamicHeaderSize) {
            // Substract 'FixedHeaderSize' already read : DynamicHeaderSize - FixedHeaderSize = ContentFieldSize
            if (bufferReader.checkEOF(ContentFieldSize)) {
                return IpcPacketHeader.DeclareHeader(IpcPacketType.PartialHeader, -1);
            }
            // Read dynamic packet size
            rawHeader.contentSize = bufferReader.readUInt32();
        }
        if (bufferReader.checkEOF(rawHeader.contentSize + FooterLength)) {
            return IpcPacketHeader.DeclareHeader(IpcPacketType.PartialHeader, -1);
        }
        return rawHeader;
    }
}
