const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ssbModule = require('..');

function ArrayEqual(a1, a2) {
  return (a1.length === a2.length) && (a1.join(':') === a2.join(':'));
}

function test(ipcPacketCore) {

  describe('Array', function () {
    const paramArray = ['this is a test', 255, 56.5, true, '', null, undefined];

    describe('serialize', function () {
      it(`explicit should return a type ${typeof paramArray}`, function () {
        ipcPacketCore.serializeArray(paramArray);
        assert(ArrayEqual(ipcPacketCore.parseArray(), paramArray));
      });
      it(`implicit should return a type ${typeof paramArray}`, function () {
        ipcPacketCore.serialize(paramArray);
        assert(ArrayEqual(ipcPacketCore.parseArray(), paramArray));
      });
    });

    describe('access', function () {
      it(`get length ${typeof paramArray}`, function () {
        ipcPacketCore.serializeArray(paramArray);
        assert(ipcPacketCore.parseArrayLength() === paramArray.length);
      });

      for (let i = 0; i < paramArray.length; ++i) {
        it(`get at ${i} ${typeof paramArray[i]} ${paramArray[i]}`, function () {
          ipcPacketCore.serializeArray(paramArray);
          assert(ipcPacketCore.parseArrayAt(i) === paramArray[i]);
        });
      }
    });

    describe('slice', function () {
      it(`slice(2, 3) ${typeof paramArray}`, function () {
        ipcPacketCore.serializeArray(paramArray);
        assert(ArrayEqual(ipcPacketCore.parseArraySlice(2, 3), paramArray.slice(2, 3)));
      })

      it(`slice(1, -1) ${typeof paramArray}`, function () {
        ipcPacketCore.serializeArray(paramArray);
        assert(ArrayEqual(ipcPacketCore.parseArraySlice(1, -1), paramArray.slice(1, -1)));
      })
    });
  });
}

const ipcPacketBuffer = new ssbModule.IpcPacketBuffer();
test(ipcPacketBuffer);

const ipcPacketBufferList = new ssbModule.IpcPacketBufferList();
test(ipcPacketBufferList);
