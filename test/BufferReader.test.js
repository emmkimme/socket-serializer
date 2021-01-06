const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const Buffer = require('buffer').Buffer;
const { BufferListReader } = require('../lib/buffer/BufferListReader');


function fill(buffer) {
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = 255 * Math.random();
  }
}

describe('BufferReader', () => {
  const paramBuffer1 = Buffer.alloc(20);
  fill(paramBuffer1);
  const paramBuffer2 = Buffer.alloc(123);
  fill(paramBuffer2);
  const paramBuffer3 = Buffer.alloc(1);
  fill(paramBuffer3);
  let globalBuffer = Buffer.concat([paramBuffer1, paramBuffer2, paramBuffer3]);

  describe('BufferListReader append', () => {
    it(`consolidate Buffers`, () => {
      let bufferListReader = new BufferListReader();
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


  describe('BufferListReader ctor', () => {
    it(`consolidate Buffers`, () => {
      let bufferListReader = new BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
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

    it(`context Buffers`, () => {
      let bufferListReader = new BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
      {
        let result = bufferListReader.length;
        assert(globalBuffer.length === result);
      }
      bufferListReader.seek(128);
      bufferListReader.pushd();
      {
        bufferListReader.seek(0);
        let result = bufferListReader.slice(64);
        assert(Buffer.compare(globalBuffer.slice(0, 64), result) === 0);
      }
      bufferListReader.popd();
      bufferListReader.seek(0);
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

  describe('BufferListReader memory', () => {
    it(`reset Buffer`, () => {
      let bufferListReader = new BufferListReader();
      bufferListReader.appendBuffer(paramBuffer1);
      bufferListReader.appendBuffer(paramBuffer2);
      const bufferOriginalSize = bufferListReader.length;
      {
        let result = bufferListReader.length;
        assert(bufferOriginalSize=== result);
      }
      bufferListReader.reset();
      {
        let result = bufferListReader.length;
        assert(0 === result);
      }
    });

    it(`reduce Buffers when offset matches length`, () => {
      let bufferListReader = new BufferListReader();
      bufferListReader.appendBuffer(paramBuffer1);
      bufferListReader.appendBuffer(paramBuffer2);
      const bufferOriginalSize = bufferListReader.length;
      bufferListReader.reduce();
      {
        let result = bufferListReader.length;
        assert(bufferOriginalSize=== result);
      }
      bufferListReader.slice(paramBuffer1.length);
      bufferListReader.reduce();
      {
        let result = bufferListReader.length;
        assert(paramBuffer2.length === result);
      }
    });

    it(`reduce Buffers when offset > length / 2`, () => {
      const paramBuffer4 = Buffer.alloc(BufferListReader.ReduceThreshold * 2);
      fill(paramBuffer4);

      let bufferListReader = new BufferListReader();
      bufferListReader.appendBuffer(paramBuffer4);
      const bufferOriginalSize = bufferListReader.length;
      bufferListReader.reduce();
      {
        let result = bufferListReader.length;
        assert(bufferOriginalSize=== result);
      }
      bufferListReader.slice(paramBuffer4.length / 2);
      bufferListReader.reduce();
      {
        let result = bufferListReader.length;
        assert(bufferOriginalSize === result);
      }
      bufferListReader.slice(1);
      bufferListReader.reduce();
      {
        let result = bufferListReader.length;
        assert(bufferOriginalSize > result);
      }
    });
  });

  describe('BufferListReader subarrayList', () => {
    it(`match boundaries`, () => {
      const bufferListReader = new BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
      bufferListReader.seek(paramBuffer1.length);
      const subarrayList = bufferListReader.subarrayList();
      assert(bufferListReader.offset === paramBuffer1.length + paramBuffer2.length + paramBuffer3.length);

      assert(subarrayList.length === 2);
      assert(Buffer.compare(subarrayList[0], paramBuffer2) === 0);
      assert(Buffer.compare(subarrayList[1], paramBuffer3) === 0);
    });

    it(`cross boundaries #1`, () => {
      const bufferListReader = new BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3]);
      bufferListReader.seek(paramBuffer1.length / 2);
      const subarrayList = bufferListReader.subarrayList(paramBuffer1.length / 2 + paramBuffer2.length);
      assert(bufferListReader.offset === paramBuffer1.length + paramBuffer2.length);

      assert(subarrayList.length === 2);
      assert(Buffer.compare(subarrayList[0], paramBuffer1.subarray(paramBuffer1.length / 2)) === 0);
      assert(Buffer.compare(subarrayList[1], paramBuffer2) === 0);
    });

    const paramBuffer3bis = Buffer.alloc(30);
    fill(paramBuffer3bis);
    it(`cross boundaries #2`, () => {
      const bufferListReader = new BufferListReader([paramBuffer1, paramBuffer2, paramBuffer3bis]);
      bufferListReader.seek(paramBuffer1.length / 2);
      const subarrayList = bufferListReader.subarrayList(paramBuffer1.length / 2 + paramBuffer2.length + paramBuffer3bis.length / 2);
      assert(bufferListReader.offset === paramBuffer1.length + paramBuffer2.length + paramBuffer3bis.length / 2);

      assert(subarrayList.length === 3);
      assert(Buffer.compare(subarrayList[0], paramBuffer1.subarray(paramBuffer1.length / 2)) === 0);
      assert(Buffer.compare(subarrayList[1], paramBuffer2) === 0);
      assert(Buffer.compare(subarrayList[2], paramBuffer3bis.subarray(0, paramBuffer3bis.length / 2)) === 0);
    });
  });

});


