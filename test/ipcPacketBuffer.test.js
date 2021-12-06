const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const ssbModule = require('..');

function ArrayEqual(a1, a2) {
  return (a1.length === a2.length) && (a1.join(':') === a2.join(':'));
}

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

function BufferEqual(a1, a2) {
  return Buffer.compare(a1, a2) === 0;
}

function testSerialization(param, ipb, fctSerialize, checkParse, fctCompare) {
  ipb.serialize(param);
  const rawData = ipb.getRawData();
  {
    let msg = `serialization size ${typeof param} = ${rawData.contentSize + rawData.headerSize + ssbModule.FooterLength}`;
    it(msg, () => {
      console.time(msg);
      ipb.serialize(param);
      const packetCore = new ssbModule.IpcPacketBuffer();
      const packetSize = packetCore.bytelength(param);
      console.timeEnd(msg);
      assert(ipb.packetSize === packetSize);
    });
  }
  {
    let msg = `serialization content ${typeof param} = ${JSON.stringify(param).substr(0, 128)}`;
    it(msg, () => {
      console.time(msg);
      ipb.serialize(param);
      console.timeEnd(msg);
      assert(fctCompare(ipb.parse(), param));
      assert(checkParse.call(ipb), true);
    });
  }
  {
    let msg = `serialization raw content ${typeof param} = ${JSON.stringify(param).substr(0, 128)}`;
    it(msg, () => {
      console.time(msg);
      ipb.serialize(param);
      const rawHeader = ipb.getRawData();
      assert(rawHeader.type === ipb.type);
      assert(rawHeader.contentSize === ipb.contentSize);
      if (rawHeader.buffers) {
        // assert(rawHeader.buffers === ipb.buffers);
      }
      else {
        assert(BufferEqual(rawHeader.buffer, ipb.buffer));
      }
      ipb.setRawData(rawHeader);
      assert(fctCompare(ipb.parse(), param));
      console.timeEnd(msg);
    });
  }
}

function test(ipcPacketCore) {
  describe('Boolean', () => {
    const paramTrue = true;
    const paramFalse = false;

    describe('serialize true', () => {
      testSerialization(paramTrue, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isBoolean, (a, b) => a == b);
    });
    describe('serialize false', () => {
      testSerialization(paramFalse, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isBoolean, (a, b) => a == b);
    });
  });

  describe('Number', () => {
    const paramDouble = 12302.23;
    const paramInt32Positive = 45698;
    const paramInt32Negative = -45698;
    const paramInt64Positive = 99999999999999;
    const paramInt64Negative = -99999999999999;

    describe('serialize double', () => {
      testSerialization(paramDouble, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNumber, (a, b) => a == b);
    });
    describe('serialize 32bits positive integer', () => {
      testSerialization(paramInt32Positive, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNumber, (a, b) => a == b);
    });
    describe('serialize 32bits negative integer', () => {
      testSerialization(paramInt32Negative, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNumber, (a, b) => a == b);
    });
    describe('serialize 64bits positive integer', () => {
      testSerialization(paramInt64Positive, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNumber, (a, b) => a == b);
    });
    describe('serialize 64bits negative integer', () => {
      testSerialization(paramInt64Negative, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNumber, (a, b) => a == b);
    });
  });

  describe('String', () => {
    function allocateString(seed, num) {
        num = Number(num) / 100;
        var result = seed;
        var str ='0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';
        while (true) {
            if (num & 1) { // (1)
                result += str;
            }
            num >>>= 1; // (2)
            if (num <= 0) break;
            str += str;
        }
        return result;
    }

    let longstring = allocateString('long string', Math.pow(2, 12));
    let shortstring = 'hello';
    let emptystring = '';

    describe('long string', () => {
      testSerialization(longstring, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isString, (a, b) => a == b);
    });

    describe('short string', () => {
      testSerialization(shortstring, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isString, (a, b) => a == b);
    });

    describe('empty string', () => {
      testSerialization(emptystring, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isString, (a, b) => a == b);
    });
  });

  describe('Array', () => {
    const paramArray = ['this is a test', 255, 56.5, true, ''];

    describe('serialize', () => {
      testSerialization(paramArray, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isArray, (a, b) => ArrayEqual(a, b));

      // it(`explicit should return a type ${typeof paramArray}`, () => {
      //   ipb.serialize(paramArray);
      //   assert(ArrayEqual(ipb.parseArray(), paramArray));
      // });
      // it(`implicit should return a type ${typeof paramArray}`, () => {
      //   ipb.serialize(paramArray);
      //   assert(ArrayEqual(ipb.parseArray(), paramArray));
      // });
    });
  });

  describe('Buffer', () => {
    const paramBuffer = Buffer.alloc(128);
    for (let i = 0; i < paramBuffer.length; ++i) {
      paramBuffer[i] = 255 * Math.random();
    }

    describe('serialize', () => {
      testSerialization(paramBuffer, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isBuffer, (a, b) => BufferEqual(a, b));

      // it(`explicit should return a type ${typeof paramBuffer}`, () => {
      //   ipb.serialize(paramBuffer);
      //   assert(Buffer.compare(ipb.parseBuffer(), paramBuffer) === 0);
      // });
      // it(`implicit should return a type ${typeof paramBuffer}`, () => {
      //   ipb.serialize(paramBuffer);
      //   assert(Buffer.compare(ipb.parse(), paramBuffer) === 0);
      // });
    });
  });

  describe('Object', () => {
    const paramObject = {
      num: 10.2,
      str: "test",
      bool: true,
      Null: null,
      Undef: undefined,
      properties: {
        num1: 12.2,
        str1: "test2",
        bool1: false
      }
    };

    describe('serialize', () => {
      testSerialization(paramObject, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isObject, (a, b) => ObjectEqual(a, b));
      // it(`explicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, () => {
      //   ipb.serialize(paramObject);
      //   assert(JSON.stringify(ipb.parseObject()) === JSON.stringify(paramObject));
      // });
      // it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, () => {
      //   ipb.serialize(paramObject);
      //   assert(JSON.stringify(ipb.parse()) === JSON.stringify(paramObject));
      // });
    });

    const nullObject = null;
    describe('serialize null', () => {
      testSerialization(nullObject, ipcPacketCore, ipcPacketCore.serialize, ipcPacketCore.isNull, (a, b) => ObjectEqual(a, b));
      // it(`explicit should return a type ${typeof nullObject} = ${JSON.stringify(nullObject)}`, () => {
      //   ipb.serialize(nullObject);
      //   assert(ipb.parseObject() == nullObject);
      // });
      // it(`implicit should return a type ${typeof nullObject} = ${JSON.stringify(nullObject)}`, () => {
      //   ipb.serialize(nullObject);
      //   assert(ipb.parse() == nullObject);
      // });
    });
  });
}

const ipcPacketBuffer = new ssbModule.IpcPacketBuffer();
test(ipcPacketBuffer);

const ipcPacketBufferList = new ssbModule.IpcPacketBufferList();
test(ipcPacketBufferList);
