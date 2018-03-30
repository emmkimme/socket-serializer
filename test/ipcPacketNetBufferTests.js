const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const portfinder = require('portfinder');

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/code/ipcPacketBuffer');
const ipb = new ipbModule.IpcPacketBuffer();

const ipnModule = require('../lib/code/ipcPacketNet');

const timeoutDelay = 500;

describe('Test packet transfer', async function () {
  function testSerialization(param, ipb, fctSerialize, fctParse) {
    it(`transfer type ${typeof param} = ${param}`, function (done) {
      portfinder.getPortPromise({ port: 49152 }).then((port) => {
        let ipcServer = new ipnModule.IpcPacketNet({ port: port }); // '/tests'
        let timer = setTimeout(() => {
          ipcServer.server.close();
          reject('timeout');
        }, timeoutDelay);
        ipcServer.addListener('listening', () => {
          let ipcSocket = new ipnModule.IpcPacketNet();
          ipcSocket.addListener('packet', (buff) => {
            assert.equal(fctParse.apply(ipb), param);
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
          fctSerialize.apply(ipb, [param]);
          socket.write(ipb.buffer);
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
      testSerialization(paramTrue, ipb, ipb.serializeBoolean, ipb.parseBoolean);
    });
    describe('emit false', function () {
      testSerialization(paramFalse, ipb, ipb.serializeBoolean, ipb.parseBoolean);
    });
  });

  describe('String', function () {
    const paramString = 'this is a test';

    describe('emit', function () {
      testSerialization(paramString, ipb, ipb.serializeString, ipb.parseString);
    });
  });

  describe('Number', function () {
    const paramDouble = 12302.23;
    const paramInt32Positive = 45698;
    const paramInt32Negative = -45698;
    const paramInt64Positive = 99999999999999;
    const paramInt64Negative = -99999999999999;

    describe('emit double', function () {
      testSerialization(paramDouble, ipb, ipb.serializeNumber, ipb.parseNumber);
    });
    describe('emit 32bits positive integer', function () {
      testSerialization(paramInt32Positive, ipb, ipb.serializeNumber, ipb.parseNumber);
    });
    describe('emit 32bits negative integer', function () {
      testSerialization(paramInt32Negative, ipb, ipb.serializeNumber, ipb.parseNumber);
    });
    describe('emit 64bits positive integer', function () {
      testSerialization(paramInt64Positive, ipb, ipb.serializeNumber, ipb.parseNumber);
    });
    describe('emit 64bits negative integer', function () {
      testSerialization(paramInt64Negative, ipb, ipb.serializeNumber, ipb.parseNumber);
    });
  });

  //   describe('Buffer', function () {
  //     const paramBuffer = Buffer.alloc(128);
  //     for (let i = 0; i < paramBuffer.length; ++i) {
  //       paramBuffer[i] = 255 * Math.random();
  //     }

  //     describe('serialize', function () {
  //       it(`explicit should return a type ${typeof paramBuffer}`, function () {
  //         var ipb = ipb.serializeBuffer(paramBuffer);
  //         assert(Buffer.compare(ipb.parseBuffer(), paramBuffer) === 0);
  //       });
  //       it(`implicit should return a type ${typeof paramBuffer}`, function () {
  //         var ipb = ipb.serialize(paramBuffer);
  //         assert(Buffer.compare(ipb.parse(), paramBuffer) === 0);
  //       });
  //     });
  //   });

  //   describe('Object', function () {
  //     const paramObject = {
  //       num: 10.2,
  //       str: "test",
  //       bool: true
  //     };

  //     describe('serialize', function () {
  //       it(`explicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
  //         var ipb = ipb.serializeObject(paramObject);
  //         assert(JSON.stringify(ipb.parseObject()) === JSON.stringify(paramObject));
  //       });
  //       it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
  //         var ipb = ipb.serialize(paramObject);
  //         assert(JSON.stringify(ipb.parse()) === JSON.stringify(paramObject));
  //       });
  //     });
  //   });


});

