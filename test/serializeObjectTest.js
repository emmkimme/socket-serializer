const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssbModule = require('../lib/socket-serializer');

const bigData = require('./bigdata.json');

describe('Object', function () {
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
  });
});

