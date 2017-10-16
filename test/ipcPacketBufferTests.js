const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ipbModule = require('../lib/ipcPacketBuffer');

const paramTrue = true;
const paramFalse = false;

describe('Boolean', function () {
  describe('serialize', function () {
    it(`should return a type ${typeof paramTrue} = ${paramTrue}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromBoolean(paramTrue);
      assert.equal(ipb.toBoolean(), paramTrue);
    });
    it(`should return a type ${typeof paramTrue} = ${paramTrue}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramTrue);
      assert.equal(ipb.to(), paramTrue);
    });
    it(`should return a type ${typeof paramFalse} = ${paramFalse}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromBoolean(paramFalse);
      assert.equal(ipb.toBoolean(), paramFalse);
    });
    it(`should return a type ${typeof paramFalse} = ${paramFalse}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramFalse);
      assert.equal(ipb.to(), paramFalse);
    });
  });
});

const paramString = 'this is a test';

describe('String', function () {
  describe('serialize', function () {
    it(`should return a type ${typeof paramString} = ${paramString}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromString(paramString);
      assert.equal(ipb.toString(), paramString);
    });
    it(`should return a type ${typeof paramString} = ${paramString}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramString);
      assert.equal(ipb.to(), paramString);
    });
  });
});

const paramDouble = 12302.23;
const paramInt32Positive = 45698;
const paramInt32Negative = -45698;
const paramInt64Positive = 99999999999999;
const paramInt64Negative = -99999999999999;

describe('Number', function () {
  describe('serialize double', function () {
    it(`should return a type ${typeof paramDouble} = ${paramDouble}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromNumber(paramDouble);
      assert.equal(ipb.toNumber(), paramDouble);
    });
    it(`should return a type ${typeof paramDouble} = ${paramDouble}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramDouble);
      assert.equal(ipb.to(), paramDouble);
    });
  });
  describe('serialize 32bits positive integer', function () {
    it(`should return a type ${typeof paramInt32Positive} = ${paramInt32Positive}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.fromNumber(paramInt32Positive);
      assert.equal(ipb.toNumber(), paramInt32Positive);
    });
    it(`should return a type ${typeof paramInt32Positive} = ${paramInt32Positive}`, function () {
      var ipb = ipbModule.IpcPacketBuffer.from(paramInt32Positive);
      assert.equal(ipb.to(), paramInt32Positive);
    });
  });
});