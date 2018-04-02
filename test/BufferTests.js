const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const BufferListReader = require('../lib/code/BufferListReader');


describe('Buffer', function () {
  const paramBuffer = Buffer.alloc(128);
  for (let i = 0; i < paramBuffer.length; ++i) {
    paramBuffer[i] = 255 * Math.random();
  }
  let globalBuffer = Buffer.concat([paramBuffer, paramBuffer, paramBuffer]);

  describe('BufferListReader', function () {
    it(`consolidate Buffers`, function () {
      let bufferListReader = new BufferListReader.BufferListReader();
      bufferListReader.appendBuffer(paramBuffer);
      bufferListReader.appendBuffer(paramBuffer);
      bufferListReader.appendBuffer(paramBuffer);
      {
        let result = bufferListReader.readBuffer(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      {
        let result = bufferListReader.readBuffer(128);
        assert(Buffer.compare(globalBuffer.slice(64, 64 + 128), result) === 0);
      }
    });
  });
});


