const ipcSocket = require('../');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Conversions = {
  's': [1, 1e-9],
  'ms': [1e3, 1e-6],
  'us': [1e6, 1e-3],
  'ns': [1e9, 1]
};


function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

function TestPerformance(myValue, nameTypeOf) {
  it(`static buffer serial - ${nameTypeOf}`, () => {
    const ipcBuffer = new ipcSocket.IpcPacketBuffer();
    const time = process.hrtime();
    for (let i = 0; i < 10000; ++i) {
      ipcBuffer.serialize(myValue);
      ipcBuffer.reset();
    }
    const diff = process.hrtime(time);
    const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
    console.log(`static buffer ${diffms.toFixed(2)} ms`);
  });

  it(`dynamic buffer serial - ${nameTypeOf}`, () => {
    const time = process.hrtime();
    for (let i = 0; i < 10000; ++i) {
      const ipcBuffer = new ipcSocket.IpcPacketBuffer();
      ipcBuffer.serialize(myValue);
    }
    const diff = process.hrtime(time);
    const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
    console.log(`dynamic buffer ${diffms.toFixed(2)} ms`);
  });
}


function TestTypeOf(myValue, nameTypeOf) {
  TestPerformance(myValue, nameTypeOf);
}

function allocateString(num) {
  num = Number(num) / 100;
  var str = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';
  var result = '';
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
const myBuffer = {
  myBuffer: Buffer.from(allocateString(1024))
}

const bigJSON = require('./bigdata.json');

const complexJSON = {
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
      testUndefined: undefined
    },
    testArrayUndefined: [12, "str", undefined, 3, null, new Date(), "end"]
  },
  request: {
    replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
  }
};

const uint8Array = {
  myUint8Array: new Uint8Array([1, 2, 3, 4, 5])
}

describe('JSONParser', () => {
  describe('buffer json', () => {
    TestTypeOf(myBuffer, "Buffer", (r1, r2) => r1.compare(r2) === 0);
  });

  describe('Uint8Array json', () => {
    TestTypeOf(uint8Array, "Uint8Array", (r1, r2) => r1.toString() === r2.toString());
  });

  describe('Date json', () => {
    let myDate = new Date();
    TestTypeOf(myDate, "Date", (r1, r2) => r1.valueOf() == r2.valueOf());
  });

  describe('Error json', () => {
    let myError = new Error();
    TestTypeOf(myError, "Error", (r1, r2) => r1.message == r2.message);
  });

  describe('TypeError json', () => {
    let myError = new TypeError();
    TestTypeOf(myError, "TypeError", (r1, r2) => r1.message == r2.message);
  });

  describe('TypeError json', () => {
    let myError = new TypeError();
    TestTypeOf(myError, "TypeError", (r1, r2) => r1.message == r2.message);
  });

  describe('big json', () => {
    TestTypeOf(bigJSON, "object", (r1, r2) => ObjectEqual(r1, r2));
  });

  describe('complex json', () => {
    TestTypeOf(complexJSON, "object", (r1, r2) => ObjectEqual(r1, r2));
  });
});


