import { expect } from 'chai';
import { Buffer } from 'buffer';
import { IpcPacketBuffer } from '../../src/packet/ipcPacketBuffer';
import { IpcPacketBufferList } from '../../src/packet/ipcPacketBufferList';
import { generateString } from '../utils/generate-string';

function testSerialization(
    param: unknown,
    ipb: IpcPacketBuffer | IpcPacketBufferList,
    checkParse: () => boolean,
    paramType: string
) {
    // ipb.serialize(param);
    describe(`'${paramType}' serialization`, () => {
        it(`should have packet size equal to the byte length of the buffer if 'param' is '${paramType}'`, () => {
            ipb.serialize(param);
            const packetCore = new IpcPacketBuffer();
            const packetSize = packetCore.bytelength(param);
            expect(ipb.packetSize).to.be.equal(packetSize);
        });

        it(`should correctly serialize if 'param' is '${paramType}'`, () => {
            ipb.serialize(param);
            expect(ipb.parse()).to.deep.equal(param);
            expect(checkParse.call(ipb)).to.be.true;
        });

        it(`should correctly serialize raw content if 'param' is ${paramType}`, () => {
            ipb.serialize(param);
            const rawHeader = ipb.getRawData();
            expect(rawHeader.type).to.be.eq(ipb.type);
            expect(rawHeader.contentSize === ipb.contentSize);
            if (rawHeader.buffers) {
                expect(rawHeader.buffers).to.be.deep.equal(ipb.buffers);
            } else {
                expect(rawHeader.buffer).to.be.deep.equal(ipb.buffer);
            }
            ipb.setRawData(rawHeader);
            expect(ipb.parse()).to.be.deep.equal(param);
        });
    });
}

function testIpcPacketBuffer(ipb: IpcPacketBuffer | IpcPacketBufferList) {
    const paramTrue = true;
    const paramFalse = false;

    testSerialization(paramTrue, ipb, ipb.isBoolean, 'Positive Boolean');
    testSerialization(paramFalse, ipb, ipb.isBoolean, 'Negative Boolean');

    const paramDouble = 12302.23;
    const paramInt32Positive = 45698;
    const paramInt32Negative = -45698;
    const paramInt64Positive = 99999999999999;
    const paramInt64Negative = -99999999999999;

    testSerialization(paramDouble, ipb, ipb.isNumber, 'Double');
    testSerialization(paramInt32Positive, ipb, ipb.isNumber, 'Positive Integer');
    testSerialization(paramInt32Negative, ipb, ipb.isNumber, 'Negative Integer');
    testSerialization(paramInt64Positive, ipb, ipb.isNumber, 'Positive Int64');
    testSerialization(paramInt64Negative, ipb, ipb.isNumber, 'Negative Int64');

    const longString = generateString(Math.pow(2, 12));
    const shortString = 'hello';
    const emptyString = '';

    testSerialization(longString, ipb, ipb.isString, `String of size ${longString.length}`);
    testSerialization(shortString, ipb, ipb.isString, `String of size ${shortString.length}`);
    testSerialization(emptyString, ipb, ipb.isString, 'Empty String');

    const paramArray = ['this is a test', 255, 56.5, true, ''];

    testSerialization(paramArray, ipb, ipb.isArray, 'Array');

    const paramBuffer = Buffer.alloc(128);
    for (let i = 0; i < paramBuffer.length; ++i) {
        paramBuffer[i] = 255 * Math.random();
    }

    testSerialization(paramBuffer, ipb, ipb.isBuffer, 'Buffer');

    const nullObject = null as null;
    const paramObject = {
        num: 10.2,
        str: 'test',
        bool: true,
        Null: null as null,
        properties: {
            num1: 12.2,
            str1: 'test2',
            bool1: false,
        },
    };

    testSerialization(paramObject, ipb, ipb.isObject, 'Sample Object');
    testSerialization(nullObject, ipb, ipb.isNull, 'Null Object');
}

[new IpcPacketBuffer(), new IpcPacketBufferList()].forEach((ipcPacketCore) => {
    testIpcPacketBuffer(ipcPacketCore);
});
