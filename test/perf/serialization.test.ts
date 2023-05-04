import { generateString } from '../utils/generate-string';
import * as bigJSON from '../lib/big-data.json';
import { expect } from 'chai';
import { Buffer } from 'buffer';
import { IpcPacketBuffer } from '../../src/packet/ipcPacketBuffer';
import { benchmark } from '../utils/benchmark';
import { JSONParserV1 } from 'json-helpers';


describe('1-big-json', () => {
    const bigString = JSON.stringify(bigJSON);

    it('should parse JSON', () => {
        benchmark.record('BIG JSON PARSE', () => {
            eval(bigString);
        }, { iterations: 100 });
    });

    it('should parse JSON', () => {
        benchmark.record('BIG JSON PARSE', () => {
            JSON.parse(bigString);
        }, { iterations: 100 });
    });
    
    it('should parse JSONParserV1', () => {
        benchmark.record('BIG JSONParseV1 PARSE', () => {
            JSONParserV1.parse(bigString);
        }, { iterations: 100 });
    });

    it('should stringify JSON', () => {
        benchmark.record('BIG JSON STRINGIFY', () => {
            JSON.stringify(bigJSON);
        }, { iterations: 100 });
    });

    it('should stringify JSONParserV1', () => {
        benchmark.record('BIG JSONParseV1 STRINGIFY', () => {
            JSONParserV1.stringify(bigJSON);
        }, { iterations: 100 });
    });
});

function TestPerformance(myValue: unknown, nameTypeOf: string, numberOfCycles = 1000): void {
    it(`1 - static ${nameTypeOf} serial`, function() {
        const ipcBuffer = new IpcPacketBuffer();
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < numberOfCycles; ++i) {
                ipcBuffer.serialize(myValue);
                ipcBuffer.reset();
            }
        });

        ipcBuffer.serialize(myValue);
        const buffer = ipcBuffer.buffer;
        ipcBuffer.decodeFromBuffer(buffer);
        const resultParse = ipcBuffer.parse();
        expect(myValue).to.deep.equal(resultParse);
    });

    it(`2 - static ${nameTypeOf} serial`, function() {
        const ipcBuffer = new IpcPacketBuffer();
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < numberOfCycles; ++i) {
                ipcBuffer.serialize(myValue);
                ipcBuffer.reset();
            }
        });
    });
}

const myBuffer = Buffer.from(generateString(1024));

export const sampleJson = {
    channel: '/electron-common-ipc/myChannel/myRequest',
    sender: {
        id: 'MyPeer_1234567890',
        name: 'MyPeer_customName',
        date: new Date(),
        process: {
            type: 'renderer',
            pid: 2000,
            rid: 2,
            wcid: 10,
        },
        testArrayUndefined: [12, 'str', 3, null, new Date(), 'end'],
    },
    request: {
        replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
    },
};

const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
const arrayBuffer = new ArrayBuffer(5);
const dataView = new DataView(arrayBuffer);
for (let i = 0; i < arrayBuffer.byteLength; i++) {
    dataView.setUint8(i, i);
}

describe('[PerfSerialization] SocketSerializer', () => {
    describe('serialize Buffer', () => {
        TestPerformance(myBuffer, 'Buffer');
    });

    describe('serialize Uint8Array', () => {
        TestPerformance(uint8Array, 'Uint8Array');
    });

    describe('serialize ArrayBuffer', () => {
        TestPerformance(arrayBuffer, 'ArrayBuffer');
    });

    describe('serialize Date', () => {
        const myDate = new Date();
        TestPerformance(myDate, 'Date');
    });

    describe('serialize Error', () => {
        const myError = new Error();
        TestPerformance(myError, 'Error');
    });

    describe('serialize TypeError', () => {
        const myError = new TypeError();
        TestPerformance(myError, 'TypeError');
    });

    describe('serialize big-json.json', () => {
        TestPerformance(bigJSON, 'object', 1);
    });

    describe('serialize sample json object', () => {
        TestPerformance(sampleJson, 'object');
    });
});
