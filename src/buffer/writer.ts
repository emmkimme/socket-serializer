import { Buffer } from 'buffer';

export interface Writer {
    readonly buffer: Buffer;
    readonly buffers: Buffer[];
    readonly length: number;
    noAssert: boolean;

    reset(): void;

    writeByte(data: number): number;
    writeBytes(dataArray: number[]): number;
    writeUInt16(data: number): number;
    writeUInt32(data: number): number;
    writeDouble(data: number): number;
    writeString(data: string, len?: number): number;
    encodeString(data: string): Buffer;
    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number;
    writeBuffers(data: Buffer[]): number;
    writeArrayBuffer(data: ArrayBuffer): number;
    write(writer: Writer): number;

    pushContext(): void;
    popContext(): void;
}

// Implement common methods
export abstract class WriterBase implements Writer {
    protected static EmptyBuffer = Buffer.allocUnsafe(0);
    readonly encodeString: (data: string) => Buffer;

    protected _noAssert: boolean;

    constructor() {
        this._noAssert = true;
        if(typeof TextEncoder === 'undefined') {
            this.encodeString = this._encodeStringSlow;
        } else {
            this.encodeString = this._encodeStringFast.bind(this, new TextEncoder());
        }
    }

    abstract get buffer(): Buffer;
    abstract get buffers(): Buffer[];
    abstract get length(): number;

    get noAssert(): boolean {
        return this._noAssert;
    }

    set noAssert(noAssert: boolean) {
        this._noAssert = noAssert;
    }

    abstract reset(): void;

    abstract writeByte(data: number): number;
    abstract writeBytes(dataArray: number[]): number;
    abstract writeUInt16(data: number): number;
    abstract writeUInt32(data: number): number;
    abstract writeDouble(data: number): number;
    abstract writeString(data: string, len?: number): number;
    abstract writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number;
    abstract writeBuffers(data: Buffer[], totalLength?: number): number;
    abstract writeArrayBuffer(data: ArrayBuffer): number;
    abstract write(writer: Writer): number;

    abstract pushContext(): void;
    abstract popContext(): void;

    private _encodeStringFast(encoder: TextEncoder, data: string): Buffer {
        return Buffer.from(encoder.encode(data));
    }
    
    private _encodeStringSlow(data: string): Buffer {
        return Buffer.from(data);
    }
}