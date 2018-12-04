const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ipbModule = require('../lib/code/ipcPacketBuffer');
const ipb = new ipbModule.IpcPacketBuffer();

function ArrayEqual(a1, a2) {
  return (a1.length === a2.length) && (a1.join(':') === a2.join(':'));
}

describe('Array', function () {
  const paramArray = ['this is a test', 255, 56.5, true, '', null, undefined];

  describe('serialize', function () {
    it(`explicit should return a type ${typeof paramArray}`, function () {
      ipb.serializeArray(paramArray);
      assert(ArrayEqual(ipb.parseArray(), paramArray));
    });
    it(`implicit should return a type ${typeof paramArray}`, function () {
      ipb.serialize(paramArray);
      assert(ArrayEqual(ipb.parseArray(), paramArray));
    });
  });

  describe('access', function () {
    it(`get length ${typeof paramArray}`, function () {
      ipb.serializeArray(paramArray);
      assert(ipb.parseArrayLength() === paramArray.length);
    });

    for(let i = 0; i < paramArray.length; ++i) {
      it(`get at ${i} ${typeof paramArray[i]} ${paramArray[i]}`, function () {
        ipb.serializeArray(paramArray);
        assert(ipb.parseArrayAt(i) === paramArray[i]);
      });
    }
  });

  describe('slice', function () {
    it(`slice(2, 3) ${typeof paramArray}`, function () {
      ipb.serializeArray(paramArray);
      assert(ArrayEqual(ipb.parseArraySlice(2, 3), paramArray.slice(2, 3)));
    })

    it(`slice(1, -1) ${typeof paramArray}`, function () {
      ipb.serializeArray(paramArray);
      assert(ArrayEqual(ipb.parseArraySlice(1, -1), paramArray.slice(1, -1)));
    })
  });
});
