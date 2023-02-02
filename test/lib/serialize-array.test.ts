import { expect } from 'chai';
import { IpcPacketBuffer } from '../../src/packet/ipcPacketBuffer';

function test(ipcPacketCore: IpcPacketBuffer) {
    describe(`${ipcPacketCore.constructor.name} Array`, () => {
        const paramArray = [
            'this is a test',
            255,
            56.5,
            true,
            '',
            null,
            undefined,
            new Uint8Array([1, 2, 3]),
            new ArrayBuffer(20),
        ];

        describe('serialize', () => {
            it(`should return a type ${typeof paramArray}`, () => {
                ipcPacketCore.serialize(paramArray);
                expect(ipcPacketCore.parse()).to.be.deep.eq(paramArray);
            });
        });

        describe('parseArrayLength', () => {
            it(`should have length ${typeof paramArray}`, () => {
                ipcPacketCore.serialize(paramArray);
                expect(ipcPacketCore.parseArrayLength()).to.be.eq(paramArray.length);
            });

            for (let i = 0; i < paramArray.length; ++i) {
                it(`should get at ${i} ${typeof paramArray[i]} ${paramArray[i]}`, () => {
                    ipcPacketCore.serialize(paramArray);
                    if (i >= 7) {
                        expect(ipcPacketCore.parse()).to.be.deep.eq(paramArray);
                    } else {
                        expect(ipcPacketCore.parseArrayAt(i)).to.be.deep.eq(paramArray[i]);
                    }
                });
            }
        });

        describe('slice', () => {
            it(`should correctly slice(2, 3) ${typeof paramArray}`, () => {
                ipcPacketCore.serialize(paramArray);
                expect(ipcPacketCore.parseArraySlice(2, 3)).to.be.deep.eq(paramArray.slice(2, 3));
            });

            it(`should correctly slice(1, -1) ${typeof paramArray}`, () => {
                ipcPacketCore.serialize(paramArray);
                expect(ipcPacketCore.parseArraySlice(1, -1)).to.be.deep.eq(paramArray.slice(1, -1));
            });
        });
    });
}

const ipcPacketBuffer = new IpcPacketBuffer();
test(ipcPacketBuffer);

// const ipcPacketBufferList = new ssModule.IpcPacketBufferList();
// test(ipcPacketBufferList);
