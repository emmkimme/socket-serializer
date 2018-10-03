const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssbModule = require('../lib/socket-serializer');

const bigData = require('./bigdata.json');

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

describe('Object', () => {

  describe('Object - big json', () => {
    it('stringify', () => {
      const ipb = new ssbModule.IpcPacketBuffer();
      const bufferWriter = new ssbModule.BufferListWriter();
      console.time('stringify serialize - big json');
      ipb.writeObjectSTRINGIFY(bufferWriter, bigData);
      console.timeEnd('stringify serialize - big json');
      const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      console.time('stringify deserialize - big json');
      let newbigdata = ipb.read(bufferReader);
      console.timeEnd('stringify deserialize - big json');
      assert(ObjectEqual(bigData, newbigdata));
    });

    it('direct1 - big json', () => {
      const ipb = new ssbModule.IpcPacketBuffer();
      const bufferWriter = new ssbModule.BufferListWriter();
      console.time('direct1 serialize - big json');
      ipb.writeObjectDirect1(bufferWriter, bigData);
      console.timeEnd('direct1 serialize - big json');
      const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      console.time('direct1 deserialize - big json');
      let newbigdata = ipb.read(bufferReader);
      console.timeEnd('direct1 deserialize - big json');
      // Can not compare, properties' order or indentation are not the same
      // assert(ObjectEqual(bigData, newbigdata));
    });

    it('direct2 - big json', () => {
      const ipb = new ssbModule.IpcPacketBuffer();
      const bufferWriter = new ssbModule.BufferListWriter();
      console.time('direct2 serialize - big json');
      ipb.writeObjectDirect2(bufferWriter, bigData);
      console.timeEnd('direct2 serialize - big json');
      const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      console.time('direct2 deserialize - big json');
      let newbigdata = ipb.read(bufferReader);
      console.timeEnd('direct2 deserialize - big json');
      // Can not compare, properties' order or indentation are not the same
      // assert(ObjectEqual(bigData, newbigdata));
    });
  });

  describe('Object - small json', () => {
    let busEvent = {
      channel: '/electron-common-ipc/myChannel/myRequest',
      sender: {
        id: 'MyPeer_1234567890',
        name: 'MyPeer_customName',
        process: {
          type: 'renderer',
          pid: 2000,
          rid: 2,
          wcid: 10
        }
      },
      request: {
        replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
      }
    };

    it('stringify - small json', (done) => {
      console.time('stringify serialize - small json');
      for (i = 0; i < 10000; ++i) {
        const ipb = new ssbModule.IpcPacketBuffer();
        const bufferWriter = new ssbModule.BufferListWriter();
        ipb.writeObjectSTRINGIFY(bufferWriter, busEvent);
        const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
        let newBusEvent = ipb.read(bufferReader);
        newBusEvent;
      }
      console.timeEnd('stringify serialize - small json');
      done();
    });

    it('direct1 - small json', (done) => {
      console.time('direct1 serialize - small json');
      for (i = 0; i < 10000; ++i) {
        const ipb = new ssbModule.IpcPacketBuffer();
        const bufferWriter = new ssbModule.BufferListWriter();
        ipb.writeObjectDirect1(bufferWriter, busEvent);
        const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
        let newBusEvent = ipb.read(bufferReader);
        newBusEvent;
        // Can not compare, properties' order or indentation are not the same
        // assert(ObjectEqual(bigData, newBusEvent));
      }
      console.timeEnd('direct1 serialize - small json');
      done();
    });

    it('direct2 - small json', (done) => {
      console.time('direct2 serialize - small json');
      for (i = 0; i < 10000; ++i) {
        const ipb = new ssbModule.IpcPacketBuffer();
        const bufferWriter = new ssbModule.BufferListWriter();
        ipb.writeObjectDirect2(bufferWriter, busEvent);
        const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
        let newBusEvent = ipb.read(bufferReader);
        newBusEvent;
        // Can not compare, properties' order or indentation are not the same
        // assert(ObjectEqual(bigData, newBusEvent));
      }
      console.timeEnd('direct2 serialize - small json');
      done();
    });
  });

});