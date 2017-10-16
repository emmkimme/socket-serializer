const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const portfinder = require('portfinder');

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/ipcPacketBuffer');

const ipnModule = require('../lib/ipcPacketNet');

describe('Test packet transfer', function () {
    function testSerialization(param, fctFrom, fctTo) {
        it(`transfer type ${typeof param} = ${param}`, function (done) {
            portfinder.getPortPromise({ port: 49152 }).then((port) => {
                let server = new ipnModule.IpcPacketNet({ port: port }); // '/tests'
                server.addListener('listening', () => {
                    let client = new ipnModule.IpcPacketNet({ port: port });
                    client.addListener('packet', (ipcPacketBuffer) => {
                        assert.equal(fctTo.apply(ipcPacketBuffer), param);
                        done();
                    });
                    client.addListener('error', (err) => {
                        done(err);
                    });
                    client.connect();
                });
                server.addListener('connection', (socket) => {
                    var ipb = fctFrom(param);
                    socket.write(ipb.buffer);
                });
                server.addListener('error', (err) => {
                    done(err);
                });
                server.listen();
            });
        });
      }
      
      describe('Boolean', function () {
        const paramTrue = true;
        const paramFalse = false;
      
        describe('emit true', function () {
          testSerialization(paramTrue, ipbModule.IpcPacketBuffer.fromBoolean, new ipbModule.IpcPacketBuffer().toBoolean);
        });
        describe('emit false', function () {
          testSerialization(paramFalse, ipbModule.IpcPacketBuffer.fromBoolean, new ipbModule.IpcPacketBuffer().toBoolean);
        });
      });
      
      describe('String', function () {
        const paramString = 'this is a test';
      
        describe('emit', function () {
          testSerialization(paramString, ipbModule.IpcPacketBuffer.fromString, new ipbModule.IpcPacketBuffer().toString);
        });
      });
      
      describe('Number', function () {
        const paramDouble = 12302.23;
        const paramInt32Positive = 45698;
        const paramInt32Negative = -45698;
        const paramInt64Positive = 99999999999999;
        const paramInt64Negative = -99999999999999;
      
        describe('emit double', function () {
          testSerialization(paramDouble, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
        });
        describe('emit 32bits positive integer', function () {
          testSerialization(paramInt32Positive, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
        });
        describe('emit 32bits negative integer', function () {
          testSerialization(paramInt32Negative, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
        });
        describe('emit 64bits positive integer', function () {
          testSerialization(paramInt64Positive, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
        });
        describe('emit 64bits negative integer', function () {
          testSerialization(paramInt64Negative, ipbModule.IpcPacketBuffer.fromNumber, new ipbModule.IpcPacketBuffer().toNumber);
        });
      });
      
    //   describe('Buffer', function () {
    //     const paramBuffer = Buffer.alloc(128);
    //     for (let i = 0; i < paramBuffer.length; ++i) {
    //       paramBuffer[i] = 255 * Math.random();
    //     }
      
    //     describe('serialize', function () {
    //       it(`explicit should return a type ${typeof paramBuffer}`, function () {
    //         var ipb = ipbModule.IpcPacketBuffer.fromBuffer(paramBuffer);
    //         assert(Buffer.compare(ipb.toBuffer(), paramBuffer) === 0);
    //       });
    //       it(`implicit should return a type ${typeof paramBuffer}`, function () {
    //         var ipb = ipbModule.IpcPacketBuffer.from(paramBuffer);
    //         assert(Buffer.compare(ipb.to(), paramBuffer) === 0);
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
    //         var ipb = ipbModule.IpcPacketBuffer.fromObject(paramObject);
    //         assert(JSON.stringify(ipb.toObject()) === JSON.stringify(paramObject));
    //       });
    //       it(`implicit should return a type ${typeof paramObject} = ${JSON.stringify(paramObject)}`, function () {
    //         var ipb = ipbModule.IpcPacketBuffer.from(paramObject);
    //         assert(JSON.stringify(ipb.to()) === JSON.stringify(paramObject));
    //       });
    //     });
    //   });
      
      
});

