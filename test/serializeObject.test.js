const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssModule = require('..');

const bigData = require('./bigdata.json');

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

function test(ipcPacketCore) {


  describe('Object', () => {

    describe('Object - big json', () => {
      it('stringify1', () => {
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('stringify1 serialize - big json');
        ipcPacketCore.writeObjectSTRINGIFY1(bufferWriter, bigData);
        console.timeEnd('stringify1 serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('stringify1 deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
        console.timeEnd('stringify1 deserialize - big json');
        assert(ObjectEqual(bigData, newbigdata));
      });

      it('stringify2', () => {
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('stringify2 serialize - big json');
        ipcPacketCore.writeObject(bufferWriter, bigData);
        console.timeEnd('stringify2 serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('stringify2 deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
        console.timeEnd('stringify2 deserialize - big json');
        assert(ObjectEqual(bigData, newbigdata));
      });


      it('direct1 - big json', () => {
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('direct1 serialize - big json');
        ipcPacketCore.writeObjectDirect1(bufferWriter, bigData);
        console.timeEnd('direct1 serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('direct1 deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
        console.timeEnd('direct1 deserialize - big json');
        // Can not compare, properties' order or indentation are not the same
        // assert(ObjectEqual(bigData, newbigdata));
      });

      it('direct2 - big json', () => {
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('direct2 serialize - big json');
        ipcPacketCore.writeObjectDirect2(bufferWriter, bigData);
        console.timeEnd('direct2 serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('direct2 deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
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
            wcid: 10,
            testUndefined: undefined
          },
          testArrayUndefined: [12, "str", undefined, 3, null, "end"]
        },
        request: {
          replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
        }
      };

      // it('stringify1 - small json', (done) => {
      //   console.time('stringify1 serialize - small json');
      //   for (i = 0; i < 10000; ++i) {
      //     const ipcPacketCore = new ssbModule.IpcPacketBuffer();
      //     const bufferWriter = new ssbModule.BufferListWriter();
      //     ipcPacketCore.writeObjectSTRINGIFY1(bufferWriter, busEvent);
      //     const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      //     let newBusEvent = ipcPacketCore.read(bufferReader);
      //     newBusEvent;
      //   }
      //   console.timeEnd('stringify1 serialize - small json');

      //   console.time('stringify1 deserialize - small json');
      //   const ipcPacketCore = new ssbModule.IpcPacketBuffer();
      //   const bufferWriter = new ssbModule.BufferListWriter();
      //   ipcPacketCore.writeObjectSTRINGIFY1(bufferWriter, busEvent);
      //   for (i = 0; i < 10000; ++i) {
      //     const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      //     let newBusEvent = ipcPacketCore.read(bufferReader);
      //     newBusEvent;
      //   }
      //   console.time('stringify1 deserialize - small json');
      //   done();
      // });

      it('stringify2 - small json', (done) => {
        console.time('stringify2 serialize - small json');
        for (i = 0; i < 10000; ++i) {
          const ipcPacketCore = new ssModule.IpcPacketBuffer();
          const bufferWriter = new ssModule.BufferListWriter();
          ipcPacketCore.writeObject(bufferWriter, busEvent);
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('stringify2 serialize - small json');

        console.time('stringify2 deserialize - small json');
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        ipcPacketCore.writeObject(bufferWriter, busEvent);
        for (i = 0; i < 10000; ++i) {
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('stringify2 deserialize - small json');
        done();
      });

      // it('direct1 - small json', (done) => {
      //   console.time('direct1 serialize - small json');
      //   for (i = 0; i < 10000; ++i) {
      //     const ipcPacketCore = new ssbModule.IpcPacketBuffer();
      //     const bufferWriter = new ssbModule.BufferListWriter();
      //     ipcPacketCore.writeObjectDirect1(bufferWriter, busEvent);
      //     const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      //     let newBusEvent = ipcPacketCore.read(bufferReader);
      //     newBusEvent;
      //     // Can not compare, properties' order or indentation are not the same
      //     // assert(ObjectEqual(bigData, newBusEvent));
      //   }
      //   console.timeEnd('direct1 serialize - small json');

      //   console.time('direct1 deserialize - small json');
      //   const ipcPacketCore = new ssbModule.IpcPacketBuffer();
      //   const bufferWriter = new ssbModule.BufferListWriter();
      //   ipcPacketCore.writeObjectSTRINGIFY(bufferWriter, busEvent);
      //   for (i = 0; i < 10000; ++i) {
      //     const bufferReader = new ssbModule.BufferReader(bufferWriter.buffer);
      //     let newBusEvent = ipcPacketCore.read(bufferReader);
      //     newBusEvent;
      //   }
      //   console.time('direct1 deserialize - small json');
      //   done();
      // });

      it('direct2 - small json', (done) => {
        console.time('direct2 serialize - small json');
        for (i = 0; i < 10000; ++i) {
          const ipcPacketCore = new ssModule.IpcPacketBuffer();
          const bufferWriter = new ssModule.BufferListWriter();
          ipcPacketCore.writeObjectDirect2(bufferWriter, busEvent);
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
          // Can not compare, properties' order or indentation are not the same
          // assert(ObjectEqual(bigData, newBusEvent));
        }
        console.timeEnd('direct2 serialize - small json');

        console.time('direct2 deserialize - small json');
        const ipcPacketCore = new ssModule.IpcPacketBuffer();
        const bufferWriter = new ssModule.BufferListWriter();
        ipcPacketCore.writeObject(bufferWriter, busEvent);
        for (i = 0; i < 10000; ++i) {
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('direct2 deserialize - small json');
        done();
      });
    });

  });

}

const ipcPacketBuffer = new ssModule.IpcPacketBuffer();
test(ipcPacketBuffer);

const ipcPacketBufferList = new ssModule.IpcPacketBufferList();
test(ipcPacketBufferList);
