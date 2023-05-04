import { Buffer } from 'buffer';

let encodeText: (str: string) => Buffer;
let decodeText: (buffer: Buffer, start: number, end: number) => string;
if (typeof TextEncoder === 'undefined') {
    encodeText = (str: string) => {
        return Buffer.from(str);
    };
    
    decodeText = (buffer: Buffer, start: number, end: number) => { 
        return buffer.toString('utf-8', start, end);
    };
} else {
    const encoder = new TextEncoder();
    encodeText = (str: string) => {
        return Buffer.from(encoder.encode(str));
    };
    
    const decoder = new TextDecoder();
    decodeText = (buffer: Buffer, start: number, end: number) => { 
        const bufferToDecode = buffer.subarray(start, end);
        return decoder.decode(bufferToDecode);
    };
}

export { encodeText, decodeText };
