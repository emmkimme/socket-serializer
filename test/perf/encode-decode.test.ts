import * as bigJSON from '../lib/big-data.json';
import { Buffer } from 'buffer';
import { benchmark } from '../utils/benchmark';
import { generateString } from '../utils/generate-string';
import { sampleJson } from './serialization.test';

function WriteUtf8(string: string, buffer: Uint8Array, offset: number) {
    const start = offset;
    let c1, c2;
    for (let i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = (c1 >> 6) | 192;
            buffer[offset++] = (c1 & 63) | 128;
        } else if ((c1 & 0xfc00) === 0xd800 && ((c2 = string.charCodeAt(i + 1)) & 0xfc00) === 0xdc00) {
            c1 = 0x10000 + ((c1 & 0x03ff) << 10) + (c2 & 0x03ff);
            ++i;
            buffer[offset++] = (c1 >> 18) | 240;
            buffer[offset++] = ((c1 >> 12) & 63) | 128;
            buffer[offset++] = ((c1 >> 6) & 63) | 128;
            buffer[offset++] = (c1 & 63) | 128;
        } else {
            buffer[offset++] = (c1 >> 12) | 224;
            buffer[offset++] = ((c1 >> 6) & 63) | 128;
            buffer[offset++] = (c1 & 63) | 128;
        }
    }
    return offset - start;
}

function ReadUtf8(buffer: Uint8Array, start: number, end: number) {
    if (end - start < 1) {
        return '';
    }

    let str = '';
    for (let i = start; i < end; ) {
        const t = buffer[i++];
        if (t <= 0x7f) {
            str += String.fromCharCode(t);
        } else if (t >= 0xc0 && t < 0xe0) {
            str += String.fromCharCode(((t & 0x1f) << 6) | (buffer[i++] & 0x3f));
        } else if (t >= 0xe0 && t < 0xf0) {
            str += String.fromCharCode(((t & 0xf) << 12) | ((buffer[i++] & 0x3f) << 6) | (buffer[i++] & 0x3f));
        } else if (t >= 0xf0) {
            const t2 =
                (((t & 7) << 18) | ((buffer[i++] & 0x3f) << 12) | ((buffer[i++] & 0x3f) << 6) | (buffer[i++] & 0x3f)) -
                0x10000;
            str += String.fromCharCode(0xd800 + (t2 >> 10));
            str += String.fromCharCode(0xdc00 + (t2 & 0x3ff));
        }
    }

    return str;
}

describe('[PerfEncodeDecode]', () => {
    const bigBatchString = JSON.stringify(bigJSON);
    const oneMegString = generateString(1000000);
    const tenKbString = generateString(10000);
    const sampleMessage = JSON.stringify(sampleJson);
    const smallStr = generateString(30);

    [bigBatchString, oneMegString, tenKbString, sampleMessage, smallStr].forEach((objectStr) => {
        it(`Use 'TextEncoder' to encode string with size ${objectStr.length}`, function () {
            const textEncoder = new TextEncoder();
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    textEncoder.encode(objectStr);
                },
                { iterations: 100 }
            );
        });

        it(`Use 'Buffer.from' to encode string with size ${objectStr.length}`, function () {
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    Buffer.from(objectStr, 'utf-8');
                },
                { iterations: 10 }
            );
        });

        it(`Use 'plain JS' to encode string with size ${objectStr.length}`, function () {
            const buffer = new Uint8Array(objectStr.length);
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    WriteUtf8(objectStr, buffer, 0);
                },
                { iterations: 100 }
            );
        });

        it(`Use 'TextDecoder' to decode string with size ${objectStr.length}`, function () {
            const textDecoder = new TextDecoder();
            const textEncoder = new TextEncoder();
            const buffer = textEncoder.encode();
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    textDecoder.decode(buffer);
                },
                { iterations: 100 }
            );
        });

        it(`Use 'Buffer.toString' to decode string with size ${objectStr.length}`, function () {
            const buffer = Buffer.from(objectStr, 'utf-8');
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    buffer.toString();
                },
                { iterations: 10 }
            );
        });

        it(`Use 'plain JS' to decode string with size ${objectStr.length}`, function () {
            const buffer = new Uint8Array(objectStr.length);
            WriteUtf8(objectStr, buffer, 0);
            benchmark.record(
                this.test.fullTitle(),
                () => {
                    ReadUtf8(buffer, 0, buffer.length);
                },
                { iterations: 10 }
            );
        });
    });
});
