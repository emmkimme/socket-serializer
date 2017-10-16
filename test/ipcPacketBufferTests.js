const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/ipcPacketBuffer');

function testSerialization(param, fctFrom, fctTo) {
  it(`explicit should return a type ${typeof param} = ${param}`, function () {
    var ipb = fctFrom(param);
    assert.equal(fctTo.apply(ipb), param);
  });
  it(`implicit should return a type ${typeof param} = ${param}`, function () {
    var ipb = ipbModule.IpcPacketBuffer.from(param);
    assert.equal(ipb.to(), param);
  });
}

describe('Boolean', function () {
  const paramTrue = true;
  const paramFalse = false;

  describe('serialize true', function () {
    testSerialization(paramTrue, ipbModule.IpcPacketBuffer.fromBoolean, new ipbModule.IpcPacketBuffer().toBoolean);
  });
  describe('serialize false', function () {
    testSerialization(paramFalse, ipbModule.IpcPacketBuffer.fromBoolean, new ipbModule.IpcPacketBuffer().toBoolean);
  });
});

describe('String', function () {
  const paramString = 'this is a test';

  describe('serialize', function () {
    testSerialization(paramString, ipbModule.IpcPacketBuffer.fromString, new ipbModule.IpcPacketBuffer().toString);
  });
});

describe('Number', function () {
  const paramDouble = 12302.23;
  const paramInt32Positive = 45698;
  const paramInt32Negative = -45698;
  const paramInt64Positive = 99999999999999;
  const paramInt64Negative = -99999999999999;

  describe('serialize double', function () {
    testSerialization(paramDouble, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
  });
  describe('serialize 32bits positive integer', function () {
    testSerialization(paramInt32Positive, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
  });
  describe('serialize 32bits negative integer', function () {
    testSerialization(paramInt32Negative, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
  });
  describe('serialize 64bits positive integer', function () {
    testSerialization(paramInt64Positive, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
  });
  describe('serialize 64bits negative integer', function () {
    testSerialization(paramInt64Negative, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
  });
});

describe('Buffer', function () {
  const paramBuffer = Buffer.alloc(128);
  for (let i = 0; i < paramBuffer.length; ++i) {
    paramBuffer[i] = 255 * Math.random();
  }

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramBuffer}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromBuffer(paramBuffer);
      assert(Buffer.compare(ipb.toBuffer(), paramBuffer) === 0);
    });
    it(`implicit should return a type ${typeof paramBuffer}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramBuffer);
      assert(Buffer.compare(ipb.to(), paramBuffer) === 0);
    });
  });
});

describe('Object', function () {
  const paramObject = {
    num: 10.2,
    str: "test",
    bool: true
  };

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromObject(paramObject);
      assert(JSON.stringify(ipb.toObject()) === JSON.stringify(paramObject));
    });
    it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramObject);
      assert(JSON.stringify(ipb.to()) === JSON.stringify(paramObject));
    });
  });
});

