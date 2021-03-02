const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssModule = require('..');

const bigData = require('./bigdata.json');

function ObjectEqual(a1, a2) {
  return JSON.stringify(a1) === JSON.stringify(a2);
}

const defaultWriteObject = ssModule.IpcPacketWriter.prototype._writeObject;
const defaultReadObject = ssModule.IpcPacketReader.prototype._readContentObject;

function OverrideObjectMethods(obj, writeObject, readObject) {
  obj._writer._writeObject = writeObject;
  obj._reader._readContentObject = readObject;
}

function RestoreObjectMethods(obj) {
  obj._writer._writeObject = defaultWriteObject;
  obj._reader._readContentObject = defaultReadObject;
}

function readContentObjectDirect(bufferReader, contentSize) {
  const offsetContentSize = bufferReader.offset + contentSize;
  const dataObject = {};
  while (bufferReader.offset < offsetContentSize) {
    let keyLen = bufferReader.readUInt32();
    let key = bufferReader.readString('utf8', keyLen);
    dataObject[key] = this._read(bufferReader);
  }
  return dataObject;
}

// let depth1 = 0;
function writeObjectDirect1(bufferWriter, dataObject, cb) {
  // ++depth1;
  const contentWriter = new ssModule.BufferListWriter();
  const entries = Object.entries(dataObject);
  for (let i = 0, l = entries.length; i < l; ++i) {
    const entry = entries[i];
    const buffer = Buffer.from(entry[0], 'utf8');
    contentWriter.writeUInt32(buffer.length);
    contentWriter.writeBuffer(buffer);
    this.write(contentWriter, entry[1]);
  }
  // --depth1;
  // console.log(`depth1 ${depth1}`);
  this._writeDynamicContent(bufferWriter, ssModule.IpcPacketType.ObjectSTRINGIFY, contentWriter, cb);
}

let depth2 = 0;
function writeObjectDirect2(bufferWriter, dataObject, cb) {
  const contentWriter = new ssModule.BufferListWriter();
  // let keys = Object.getOwnPropertyNames(dataObject);
  const keys = Object.keys(dataObject);
  for (let i = 0, l = keys.length; i < l; ++i) {
    const key = keys[i];
    const desc = Object.getOwnPropertyDescriptor(dataObject, key);
    if (desc && (typeof desc.value !== 'function')) {
      const buffer = Buffer.from(key, 'utf8');
      contentWriter.writeUInt32(buffer.length);
      contentWriter.writeBuffer(buffer);
      // this.write(contentBufferWriter, desc.value || dataObject[key]);
      this.write(contentWriter, desc.value);
    }
  }
  this._writeDynamicContent(bufferWriter, ssModule.IpcPacketType.ObjectSTRINGIFY, contentWriter, cb);
}

function writeObjectSTRINGIFY1(bufferWriter, dataObject, cb) {
  const stringifycation = JSON.stringify(dataObject);
  const buffer = Buffer.from(stringifycation);
  this._writeDynamicBuffer(bufferWriter, ssModule.IpcPacketType.ObjectSTRINGIFY, buffer, cb);
}

function readObjectSTRINGIFY1(bufferReader, contentSize) {
  const data = bufferReader.readString('utf8', contentSize);
  return JSON.parse(data);
}


function test(type, ipcPacketCoreClass) {

  describe('Object', () => {

    describe('Object - big json', () => {
      it('JSON', () => {

        const ipcPacketCore = new ipcPacketCoreClass();
        OverrideObjectMethods(ipcPacketCore , writeObjectSTRINGIFY1, readObjectSTRINGIFY1);
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('JSON serialize - big json');
        ipcPacketCore.write(bufferWriter, bigData);
        console.timeEnd('JSON serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('JSON deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
        console.timeEnd('JSON deserialize - big json');
        assert(ObjectEqual(bigData, newbigdata));

        RestoreObjectMethods(ipcPacketCore);
      });

      it('JSONParser', () => {
        const ipcPacketCore = new ipcPacketCoreClass();
        const bufferWriter = new ssModule.BufferListWriter();
        console.time('JSONParser serialize - big json');
        ipcPacketCore.write(bufferWriter, bigData);
        console.timeEnd('JSONParser serialize - big json');

        const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
        console.time('JSONParser deserialize - big json');
        let newbigdata = ipcPacketCore.read(bufferReader);
        console.timeEnd('JSONParser deserialize - big json');
        assert(ObjectEqual(bigData, newbigdata));
      });


      // it('direct1', () => {
      //   const ipcPacketCore = new ipcPacketCoreClass();
      //   ipcPacketCore._writeObject = writeObjectDirect1;
      //   ipcPacketCore._readContentObject = readContentObjectDirect;
      //   const bufferWriter = new ssModule.BufferListWriter();
      //   console.time('direct1 serialize - big json');
      //   ipcPacketCore.write(bufferWriter, bigData);
      //   console.timeEnd('direct1 serialize - big json');

      //   const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
      //   console.time('direct1 deserialize - big json');
      //   let newbigdata = ipcPacketCore.read(bufferReader);
      //   console.timeEnd('direct1 deserialize - big json');
      //   // Can not compare, properties' order or indentation are not the same
      //   // assert(ObjectEqual(bigData, newbigdata));
      // });

      // it('direct2', () => {
      //   const ipcPacketCore = new ipcPacketCoreClass();
      //   ipcPacketCore._writeObject = writeObjectDirect2;
      //   ipcPacketCore._readContentObject = readContentObjectDirect;
      //   const bufferWriter = new ssModule.BufferListWriter();
      //   console.time('direct2 serialize - big json');
      //   ipcPacketCore.write(bufferWriter, bigData);
      //   console.timeEnd('direct2 serialize - big json');

      //   const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
      //   console.time('direct2 deserialize - big json');
      //   let newbigdata = ipcPacketCore.read(bufferReader);
      //   console.timeEnd('direct2 deserialize - big json');
      //   // Can not compare, properties' order or indentation are not the same
      //   // assert(ObjectEqual(bigData, newbigdata));
      // });
    });

    describe('Object - small json', () => {
      let busEvent = {
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
          testArrayUndefined: [12, "str", undefined, 3, null, "end", new Date()]
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

      it('JSONParser - small json', () => {
        console.time('JSONParser serialize - small json');
        for (i = 0; i < 10000; ++i) {
          const ipcPacketCore = new ipcPacketCoreClass();
          const bufferWriter = new ssModule.BufferListWriter();
          ipcPacketCore.write(bufferWriter, busEvent);
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('JSONParser serialize - small json');

        console.time('JSONParser deserialize - small json');
        const ipcPacketCore = new ipcPacketCoreClass();
        const bufferWriter = new ssModule.BufferListWriter();
        ipcPacketCore.write(bufferWriter, busEvent);
        for (i = 0; i < 10000; ++i) {
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('JSONParser deserialize - small json');
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

      it('direct2 - small json', () => {
        console.time('direct2 serialize - small json');
        for (i = 0; i < 10000; ++i) {
          const ipcPacketCore = new ipcPacketCoreClass();
          const bufferWriter = new ssModule.BufferListWriter();
          ipcPacketCore.write(bufferWriter, busEvent);
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
          // Can not compare, properties' order or indentation are not the same
          // assert(ObjectEqual(bigData, newBusEvent));
        }
        console.timeEnd('direct2 serialize - small json');

        console.time('direct2 deserialize - small json');
        const ipcPacketCore = new ipcPacketCoreClass();
        OverrideObjectMethods(ipcPacketCore, writeObjectDirect2, readContentObjectDirect);
        const bufferWriter = new ssModule.BufferListWriter();
        ipcPacketCore.write(bufferWriter, busEvent);
        for (i = 0; i < 10000; ++i) {
          const bufferReader = new ssModule.BufferReader(bufferWriter.buffer);
          let newBusEvent = ipcPacketCore.read(bufferReader);
          newBusEvent;
        }
        console.timeEnd('direct2 deserialize - small json');

        RestoreObjectMethods(ipcPacketCore);
      });
    });

  });

}

// test('buffer', ssModule.IpcPacketBuffer);
// test('buffers', ssModule.IpcPacketBufferList);
test('buffers', ssModule.IpcPacketCore);

