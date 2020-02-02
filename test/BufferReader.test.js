const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const BufferListReader = require('../lib/code/BufferListReader');


function fill(buffer) {
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = 255 * Math.random();
  }
}

describe('BufferReader', function () {
  const paramBuffer1 = Buffer.alloc(20);
  fill(paramBuffer1);
  const paramBuffer2 = Buffer.alloc(123);
  fill(paramBuffer2);
  const paramBuffer3 = Buffer.alloc(1);
  fill(paramBuffer3);
  let globalBuffer = Buffer.concat([paramBuffer1, paramBuffer2, paramBuffer3]);

  describe('BufferListReader append', function () {
    it(`consolidate Buffers`, function () {
      let bufferListReader = new BufferListReader.BufferListReader();
      bufferListReader.appendBuffer(paramBuffer1);
      bufferListReader.appendBuffer(paramBuffer2);
      bufferListReader.appendBuffer(paramBuffer3);
      {
        let result = bufferListReader.length;
        assert(globalBuffer.length === result);
      }
      {
        let result = bufferListReader.slice(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      {
        let result = bufferListReader.slice(128);
        assert(Buffer.compare(globalBuffer.slice(64, 64 + 128), result) === 0);
      }
    });
  });


  describe('BufferListReader ctor', function () {
    it(`consolidate Buffers`, function () {
      let bufferListReader = new BufferListReader.BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
      {
        let result = bufferListReader.length;
        assert(globalBuffer.length === result);
      }
      {
        let result = bufferListReader.slice(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      {
        let result = bufferListReader.slice(128);
        assert(Buffer.compare(globalBuffer.slice(64, 64 + 128), result) === 0);
      }
    });

    it(`context Buffers`, function () {
      let bufferListReader = new BufferListReader.BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
      {
        let result = bufferListReader.length;
        assert(globalBuffer.length === result);
      }
      bufferListReader.pushd();
      {
        let result = bufferListReader.slice(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      bufferListReader.popd();
      bufferListReader.pushd();
      {
        let result = bufferListReader.subarray(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      bufferListReader.popd();
      {
        let result = bufferListReader.slice(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }

      bufferListReader.pushd();
      {
        let result = bufferListReader.slice(128);
        assert(Buffer.compare(globalBuffer.slice(64, 64 + 128), result) === 0);
      }
      bufferListReader.popd();
      bufferListReader.pushd();
      {
        let result = bufferListReader.subarray(128);
        assert(Buffer.compare(globalBuffer.subarray(64, 64 + 128), result) === 0);
      }
      bufferListReader.popd();
      {
        let result = bufferListReader.slice(128);
        assert(Buffer.compare(globalBuffer.slice(64, 64 + 128), result) === 0);
      }
    });
  });
});


