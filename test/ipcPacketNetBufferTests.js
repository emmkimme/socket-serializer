const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const portfinder = require('portfinder');

const Buffer = require('buffer').Buffer;

const ssModule = require('../lib/socket-serializer');

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

for (let socketWriterType = 0; socketWriterType < 4; ++socketWriterType) {

  describe(`Test packet transfer with socket ${socketWriterType}`, async function () {
    function testSerialization(param, test) {
      it(`transfer type ${typeof param} = ${JSON.stringify(param).substr(0, 128)}`, function (done) {
        portfinder.getPortPromise({ port: 49152 }).then((port) => {
          let ipcServer = new ssModule.IpcPacketNet({ port: port }); // '/tests'
          let timer = setTimeout(() => {
            ipcServer.server.close();
            reject('timeout');
          }, timeoutDelay);
          ipcServer.addListener('listening', () => {
            let ipcSocket = new ssModule.IpcPacketNet();
            ipcSocket.addListener('packet', (ipcPacket) => {
              switch (test) {
                case 0:
                  assert.equal(ipcPacket.parse(), param);
                  break;
                case 1:
                  assert(ObjectEqual(ipcPacket.parse(), param));
                  break;
                case 2:
                  assert(ArrayEqual(ipcPacket.parse(), param));
                  break;
                case 3:
                  assert(BufferEqual(ipcPacket.parse(), param));
                  break;
              }
              clearTimeout(timer);
              ipcSocket.socket.end();
              ipcSocket.socket.unref();
              ipcServer.server.close(() => {
                done();
              });
            });
            ipcSocket.addListener('close', (had_error) => {
              // console.log(`Port ${port} : ipcSocket disconnected (had error=${had_error})`);
            });
            ipcSocket.addListener('timeout', (err) => {
              clearTimeout(timer);
              ipcSocket.socket.end();
              ipcSocket.socket.unref();
              ipcServer.server.close(() => {
                console.error(`Port ${port} : ${err}`);
                done(err);
              });
            });
            ipcSocket.addListener('error', (err) => {
              clearTimeout(timer);
              ipcSocket.socket.end();
              ipcSocket.socket.unref();
              ipcServer.server.close(() => {
                console.error(`Port ${port} : ${err}`);
                done(err);
              });
            });
            ipcSocket.connect(port);
          });
          ipcServer.addListener('listening', (sockett) => {
            // console.log(`Port ${port} : server listening`);
          });
          ipcServer.addListener('connection', (socket) => {
            // console.log(`Port ${port} : ipcSocket connected`);
            // console.log(`Port ${port} : server sends data`);
            const ipb = new ssModule.IpcPacketBuffer();
            switch (socketWriterType) {
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
            // console.log(`Port ${port} : server closed`);
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

      const paramLongBuffer = Buffer.alloc(1280000);
      for (let i = 0; i < 256; ++i) {
        paramBuffer[i] = 255 * Math.random();
      }

      describe(`emit ${typeof paramBuffer} = ${JSON.stringify(paramBuffer)}`, function () {
        testSerialization(paramBuffer, 3);
      });
      describe(`emit ${typeof paramLongBuffer}`, function () {
        testSerialization(paramLongBuffer, 3);
      });
    });


    describe('Complex', function () {
      function createUuid() {
        return Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);
      }

        var uuid = createUuid();
        var uuidPattern = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
        uuid = uuid + uuidPattern.substring(0, 30 - uuid.length)

      var msgTestStart = {
        uuid: uuid,
        test: 36132,
        type: 'buffer',
        peer: {
          id: 10,
          name: 'test',
          process: {
            type: 'test',
            pid: 10
          }
        }
      };

      let msgContent = Buffer.alloc(3054200);
      msgContent.write(uuid, 0, uuid.length, 'utf8');

      describe(`emit ${typeof msgTestStart}`, function () {
        testSerialization(msgTestStart, 1);
        testSerialization(msgContent, 3);
        testSerialization(msgTestStart, 1);
        testSerialization(msgContent, 3);
      });


    });

  });

}
