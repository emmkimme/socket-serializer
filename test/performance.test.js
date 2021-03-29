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

function TestPerformance(myValue, nameTypeOf, compare, count) {
  it(`1 - static ${nameTypeOf} serial`, () => {
    const ipcBuffer = new ipcSocket.IpcPacketBuffer();
    ipcBuffer._writer.write = ipcBuffer._writer.write1;
    const time = process.hrtime();
    for (let i = 0; i < count; ++i) {
      ipcBuffer.serialize(myValue);
      ipcBuffer.reset();
    }
    const diff = process.hrtime(time);
    const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
    console.log(`=> static ${nameTypeOf} ${diffms.toFixed(2)} ms`);

    ipcBuffer.serialize(myValue);
    const buffer = ipcBuffer.buffer;
    ipcBuffer.decodeFromBuffer(buffer);
    const resultParse = ipcBuffer.parse();
    assert(compare(myValue, resultParse));
  });

  // it(`1 - dynamic ${nameTypeOf} serial`, () => {
  //   const time = process.hrtime();
  //   for (let i = 0; i < count; ++i) {
  //     const ipcBuffer = new ipcSocket.IpcPacketBuffer();
  //     ipcBuffer._writer.write = ipcBuffer._writer.write1;
  //     ipcBuffer.serialize(myValue);
  //   }
  //   const diff = process.hrtime(time);
  //   const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
  //   console.log(`=> dynamic ${nameTypeOf} ${diffms.toFixed(2)} ms`);
  // });

  it(`2 - static ${nameTypeOf} serial`, () => {
    const ipcBuffer = new ipcSocket.IpcPacketBuffer();
    ipcBuffer._writer.write = ipcBuffer._writer.write2;
    const time = process.hrtime();
    for (let i = 0; i < count; ++i) {
      ipcBuffer.serialize(myValue);
      ipcBuffer.reset();
    }
    const diff = process.hrtime(time);
    const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
    console.log(`=> static ${nameTypeOf} ${diffms.toFixed(2)} ms`);
  });

  // it(`2 - dynamic ${nameTypeOf} serial`, () => {
  //   const time = process.hrtime();
  //   for (let i = 0; i < count; ++i) {
  //     const ipcBuffer = new ipcSocket.IpcPacketBuffer();
  //     ipcBuffer._writer.write = ipcBuffer._writer.write2;
  //     ipcBuffer.serialize(myValue);
  //   }
  //   const diff = process.hrtime(time);
  //   const diffms = diff[0] * Conversions.ms[0] + diff[1] * Conversions.ms[1];
  //   console.log(`=> dynamic ${nameTypeOf} ${diffms.toFixed(2)} ms`);
  // });
}


function TestTypeOf(myValue, nameTypeOf, compare, count) {
  count = count || 10000;
  TestPerformance(myValue, nameTypeOf, compare, count);
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

const myBuffer = Buffer.from(allocateString(1024));

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

const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);

const arrayBuffer = new ArrayBuffer([10, 20, 30, 40, 50]);

describe('SocketSerializer', () => {
  describe('buffer', () => {
    TestTypeOf(myBuffer, "Buffer", (r1, r2) => r1.compare(r2) === 0);
  });

  describe('Uint8Array', () => {
    TestTypeOf(uint8Array, "Uint8Array", (r1, r2) => r1.toString() === r2.toString());
  });

  describe('ArrayBuffer', () => {
    TestTypeOf(arrayBuffer, "ArrayBuffer", (r1, r2) => r1.toString() === r2.toString());
  });

  describe('Date', () => {
    let myDate = new Date();
    TestTypeOf(myDate, "Date", (r1, r2) => r1.valueOf() == r2.valueOf());
  });

  describe('Error', () => {
    let myError = new Error();
    TestTypeOf(myError, "Error", (r1, r2) => r1.message == r2.message);
  });

  describe('TypeError', () => {
    let myError = new TypeError();
    TestTypeOf(myError, "TypeError", (r1, r2) => r1.message == r2.message);
  });

  describe('big json', () => {
    TestTypeOf(bigJSON, "object", (r1, r2) => ObjectEqual(r1, r2), 1);
  });

  describe('complex json', () => {
    TestTypeOf(complexJSON, "object", (r1, r2) => ObjectEqual(r1, r2));
  });
});


