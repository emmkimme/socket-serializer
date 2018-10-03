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
      console.time('stringify serialize');
      ipb.writeObjectSTRINGIFY(bufferWriter, bigData);
      console.timeEnd('stringify serialize');
      const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      console.time('stringify deserialize');
      let newbigdata = ipb.read(bufferReader);
      console.timeEnd('stringify deserialize');
      assert(ObjectEqual(bigData, newbigdata));
    });

    it('direct', () => {
      const ipb = new ssbModule.IpcPacketBuffer();
      const bufferWriter = new ssbModule.BufferListWriter();
      console.time('direct serialize');
      ipb.writeObjectDirect(bufferWriter, bigData);
      console.timeEnd('direct serialize');
      const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      console.time('direct deserialize');
      let newbigdata = ipb.read(bufferReader);
      console.timeEnd('direct deserialize');
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
    }

    it('stringify', () => {
      console.time('stringify serialize');
      for (i = 0; i < 10000; ++i) {
        const ipb = new ssbModule.IpcPacketBuffer();
        const bufferWriter = new ssbModule.BufferListWriter();
        ipb.writeObjectSTRINGIFY(bufferWriter, busEvent);
        const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
        let newBusEvent = ipb.read(bufferReader);
        assert(ObjectEqual(busEvent, newBusEvent));
      }
      console.timeEnd('stringify serialize');
    });

    it('direct', () => {
      console.time('direct serialize');
      for (i = 0; i < 10000; ++i) {
        const ipb = new ssbModule.IpcPacketBuffer();
        const bufferWriter = new ssbModule.BufferListWriter();
        ipb.writeObjectDirect(bufferWriter, busEvent);
        const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
        let newBusEvent = ipb.read(bufferReader);
        newBusEvent;
        // Can not compare, properties' order or indentation are not the same
        // assert(ObjectEqual(bigData, newBusEvent));
      }
      console.timeEnd('direct serialize');
    });
  });

});