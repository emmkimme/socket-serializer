const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const socketHelpers = require('socket-port-helpers');

const Buffer = require('buffer').Buffer;

const ssModule = require('..');

const timeoutDelay = 500;

function ArrayEqual(a1, a2) {
  return (a1.length === a2.length) && (a1.join(':') === a2.join(':'));
}

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

function BufferEqual(a1, a2) {
  return Buffer.compare(a1, a2) === 0;
}

let current_port = 49152;
function testSerializationWithSocket(param, socketWriterType, test) {
  it(`transfer type ${typeof param} = ${JSON.stringify(param).substr(0, 128)}`, function (done) {
    let test_err;
    socketHelpers.findFirstFreePort({portRange: `>=${current_port}`, log: false, testConnection: true })
    .then((port) => {
        // current_port = port;
        let ipcServer = new ssModule.IpcPacketSocket(); // '/tests'
        let timer = setTimeout(() => {
          ipcServer.server.close();
          done('timeout');
        }, timeoutDelay);
        ipcServer.addListener('listening', () => {
          // console.log(`Port ${port} : server listening`);
          let ipcSocket = new ssModule.IpcPacketSocket();
          ipcSocket.addListener('packet', (ipcPacket) => {
            let paramResult = ipcPacket.parse();
            switch (test) {
              case 0:
                assert.equal(paramResult, param);
                break;
              case 1:
                assert(ObjectEqual(paramResult, param));
                break;
              case 2:
                assert(ArrayEqual(paramResult, param));
                break;
              case 3:
                assert(BufferEqual(paramResult, param));
                break;
            }
            clearTimeout(timer);
            ipcSocket.socket.end();
            ipcSocket.socket.unref();
            ipcServer.server.close(() => {
              console.log(`Port ${port} : ipcSocket close server`);
              // done();
            });
          });
          ipcSocket.addListener('close', (had_error) => {
            // console.log(`Port ${port} : ipcSocket disconnected (had error=${had_error})`);
          });
          ipcSocket.addListener('timeout', (err) => {
            test_err = err;
            clearTimeout(timer);
            ipcSocket.socket.end();
            ipcSocket.socket.unref();
            ipcServer.server.close(() => {
              console.warn(`Port ${port} : ipcSocket close server error ${err}`);
              // done(err);
            });
          });
          ipcSocket.addListener('error', (err) => {
            // test_err = err;
            // console.log(`Port ${port} : ipcSocket error ${err}`);
            clearTimeout(timer);
            ipcSocket.socket.end();
            ipcSocket.socket.unref();
            ipcServer.server.close(() => {
              console.warn(`Port ${port} : ipcSocket close server error ${err}`);
              // done(err);
            });
          });
          ipcSocket.connect(port);
        });
        ipcServer.addListener('connection', (socket) => {
          // console.log(`Port ${port} : ipcSocket connected`);
          // console.log(`Port ${port} : server sends data`);
          const ipb = new ssModule.IpcPacketBuffer();
          switch (socketWriterType) {
            case -1:
              socket.write(param);
              break;
            case 0:
              ipb.serialize(param);
              socket.write(ipb.buffer);
              break;
            case 1: {
              let s = new ssModule.SocketWriter(socket);
              ipb.write(s, param);
              break;
            }
            case 2: {
              let s = new ssModule.DelayedSocketWriter(socket);
              ipb.write(s, param);
              break;
            }
            case 3: {
              let s = new ssModule.BufferedSocketWriter(socket, 64);
              ipb.write(s, param);
              break;
            }
          }
        });
        ipcServer.addListener('close', (err) => {
          clearTimeout(timer);
          console.log(`Port ${port} : server closed`);
          test_err ? done(test_err) : done();
        });
        ipcServer.addListener('error', (err) => {
          clearTimeout(timer);
          console.error(`Port ${port} : ${err}`);
          done(err);
        });
        ipcServer.listen(port);
      });
  });
}


for (let socketWriterType = 0; socketWriterType < 4; ++socketWriterType) {

  describe(`Test packet transfer with socket ${socketWriterType}`, async function () {
    function testSerialization(param, test) {
      testSerializationWithSocket(param, socketWriterType, test);
    }

    describe('Boolean', function () {
      const paramTrue = true;
      const paramFalse = false;

      describe('emit true', function () {
        testSerialization(paramTrue, 0);
      });
      describe('emit false', function () {
        testSerialization(paramFalse, 0);
      });
    });

    describe('String', function () {
      const paramString = 'this is a test';

      describe('emit', function () {
        testSerialization(paramString, 0);
      });
    });

    describe('Number', function () {
      const paramDouble = 12302.23;
      const paramInt32Positive = 45698;
      const paramInt32Negative = -45698;
      const paramInt64Positive = 99999999999999;
      const paramInt64Negative = -99999999999999;

      describe('emit double', function () {
        testSerialization(paramDouble, 0);
      });
      describe('emit 32bits positive integer', function () {
        testSerialization(paramInt32Positive, 0);
      });
      describe('emit 32bits negative integer', function () {
        testSerialization(paramInt32Negative, 0);
      });
      describe('emit 64bits positive integer', function () {
        testSerialization(paramInt64Positive, 0);
      });
      describe('emit 64bits negative integer', function () {
        testSerialization(paramInt64Negative, 0);
      });
    });

    const paramObject = {
      num: 10.2,
      str: "test",
      bool: true,
      empty: null,
      properties: {
        num1: 12.2,
        str1: "test2",
        strEmpty: "",
        bool1: false
      }
    };
    const nullObject = null;

    describe('Object', function () {
      describe(`emit ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
        testSerialization(paramObject, 1);
      });

      describe(`emit ${typeof nullObject} = ${JSON.stringify(nullObject)}`, function () {
        testSerialization(nullObject, 1);
      });
    });

    describe('Array', function () {
      const paramArray = ['this is a test', "", 255, 56.5, null, true, '', paramObject, nullObject];

      describe(`emit ${typeof paramArray} = ${JSON.stringify(paramArray)}`, function () {
        testSerialization(paramArray, 2);
      });
    });

    describe('Buffer', function () {
      const paramBuffer = Buffer.alloc(128);
      for (let i = 0; i < paramBuffer.length; ++i) {
        paramBuffer[i] = 255 * Math.random();
      }

      const paramLongBuffer = Buffer.alloc(70000);
      for (let i = 0; i < 256; ++i) {
        paramLongBuffer[i] = 255 * Math.random();
      }

      describe(`emit ${typeof paramBuffer} = ${JSON.stringify(paramBuffer)}`, function () {
        testSerialization(paramBuffer, 3);
      });
      describe(`emit ${typeof paramLongBuffer}`, function () {
        testSerialization(paramLongBuffer, 3);
      });
    });
});
}
