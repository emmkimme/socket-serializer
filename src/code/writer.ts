import { Buffer } from 'buffer';

// Uint8Array ?
export function BufferAllocFromArray(dataArray: number[]): Buffer {
    // return Buffer.from(dataArray);
    let l = dataArray.length;
    let buffer = Buffer.alloc(l);
    for (let i = 0; i < l; ++i) {
        buffer[i] = dataArray[i];
    }
    return buffer;
}

// Uint8Array ?
export function BufferWriteArray(buffer: Buffer, dataArray: number[], start?: number): number {
    // return buffer.copy()
    start = start || 0;
    let l = dataArray.length;
    for (let i = 0; i < l; ++i) {
        buffer[start] = dataArray[i];
        ++start;
    }
    return l;
}

export interface Writer {
    readonly buffer: Buffer;
    readonly buffers: Buffer[];
    readonly length: number;

    writeByte(data: number): number;
    writeBytes(dataArray: number[]): number;
    writeUInt32(data: number): number;
    writeDouble(data: number): number;
    writeString(data: string, encoding?: string, len?: number): number;
    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number;
    write(writer: Writer): number;

    pushContext(): void;
    popContext(): void;
}

