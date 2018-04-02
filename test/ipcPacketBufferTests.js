const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/code/ipcPacketBuffer');
const ipb = new ipbModule.IpcPacketBuffer();

function testSerialization(param, ipb, fctSerialize, fctParse) {
  {
    let msg = `explicit should return a type ${typeof param} = ${param}`;
    it(msg, function () {
      console.time(msg);
      fctSerialize.call(ipb, param);
      assert.equal(fctParse.call(ipb), param);
      console.timeEnd(msg);
    });
  }
  {
    let msg = `implicit should return a type ${typeof param} = ${param}`;
    it(msg, function () {
      console.time(msg);
      ipb.serialize(param);
      assert.equal(ipb.parse(), param);
      console.timeEnd(msg);
    });
  }
}

describe('Boolean', function () {
  const paramTrue = true;
  const paramFalse = false;

  describe('serialize true', function () {
    testSerialization(paramTrue, ipb, ipb.serializeBoolean, ipb.parseBoolean);
  });
  describe('serialize false', function () {
    testSerialization(paramFalse, ipb, ipb.serializeBoolean, ipb.parseBoolean);
  });
});

describe('Number', function () {
  const paramDouble = 12302.23;
  const paramInt32Positive = 45698;
  const paramInt32Negative = -45698;
  const paramInt64Positive = 99999999999999;
  const paramInt64Negative = -99999999999999;

  describe('serialize double', function () {
    testSerialization(paramDouble, ipb, ipb.serializeNumber, ipb.parseNumber);
  });
  describe('serialize 32bits positive integer', function () {
    testSerialization(paramInt32Positive, ipb, ipb.serializeNumber, ipb.parseNumber);
  });
  describe('serialize 32bits negative integer', function () {
    testSerialization(paramInt32Negative, ipb, ipb.serializeNumber, ipb.parseNumber);
  });
  describe('serialize 64bits positive integer', function () {
    testSerialization(paramInt64Positive, ipb, ipb.serializeNumber, ipb.parseNumber);
  });
  describe('serialize 64bits negative integer', function () {
    testSerialization(paramInt64Negative, ipb, ipb.serializeNumber, ipb.parseNumber);
  });
});

describe('String', function () {
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

  describe('long string', function () {
    testSerialization(longstring, ipb, ipb.serializeString, ipb.parseString);
  });

  describe('short string', function () {
    testSerialization(shortstring, ipb, ipb.serializeString, ipb.parseString);
  });

  describe('empty string', function () {
    testSerialization(emptystring, ipb, ipb.serializeString, ipb.parseString);
  });
});

function ArrayEqual(a1, a2) {
  return (a1.length === a2.length) && (a1.join(':') === a2.join(':'));
}

describe('Array', function () {
  const paramArray = ['this is a test', 255, 56.5, true, ''];

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramArray}`, function () {
      ipb.serializeArray(paramArray);
      assert(ArrayEqual(ipb.parseArray(), paramArray));
    });
    it(`implicit should return a type ${typeof paramArray}`, function () {
      ipb.serialize(paramArray);
      assert(ArrayEqual(ipb.parseArray(), paramArray));
    });
  });
});


describe('Buffer', function () {
  const paramBuffer = Buffer.alloc(128);
  for (let i = 0; i < paramBuffer.length; ++i) {
    paramBuffer[i] = 255 * Math.random();
  }

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramBuffer}`, function () {
      ipb.serializeBuffer(paramBuffer);
      assert(Buffer.compare(ipb.parseBuffer(), paramBuffer) === 0);
    });
    it(`implicit should return a type ${typeof paramBuffer}`, function () {
      ipb.serialize(paramBuffer);
      assert(Buffer.compare(ipb.parse(), paramBuffer) === 0);
    });
  });
});

describe('Object', function () {
  const paramObject = {
    num: 10.2,
    str: "test",
    bool: true,
    properties: {
      num1: 12.2,
      str1: "test2",
      bool1: false
    }
  };

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      ipb.serializeObject(paramObject);
      assert(JSON.stringify(ipb.parseObject()) === JSON.stringify(paramObject));
    });
    it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      ipb.serialize(paramObject);
      assert(JSON.stringify(ipb.parse()) === JSON.stringify(paramObject));
    });
  });

  describe('serialize null', function () {
    it(`explicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      ipb.serializeObject(null);
      assert(ipb.parseObject() == null);
    });
    it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      ipb.serialize(null);
      assert(ipb.parse() == null);
    });
  });
});

