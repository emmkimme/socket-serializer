const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

describe('byte', () => {
    const size = 10000;
    it(`use writeUInt8`, () => {
        const buffer = Buffer.allocUnsafe(size);
        console.time('writeUInt8');
        for (let i = 0; i < size; ++i) {
            buffer.writeUInt8(100, i);
        }
        console.timeEnd('writeUInt8');
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size);
        console.time('write []');
        for (let i = 0; i < size; ++i) {
            buffer[i] = 100;
        }
        console.timeEnd('write []');
    });
    it(`use readUInt8`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        console.time('readUInt8');
        for (let i = 0; i < size; ++i) {
            buffer.readUInt8(i);
        }
        console.timeEnd('readUInt8');
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);;
        console.time('read []');
        for (let i = 0; i < size; ++i) {
            buffer[i];
        }
        console.timeEnd('read []');
    });
});

describe('bytes array', () => {
    const size = 10000;
    const dataArray = [1, 2, 3, 4, 5];
    const dataSize = dataArray.length;

    it(`use Uint8Array`, () => {
        const buffer = Buffer.allocUnsafe(size);
        console.time('Write Uint8Array');
        for (let i = 0; i < size; i += dataSize) {
            const uint8Array = new Uint8Array(dataArray);
            buffer.copy(uint8Array, i, 0);
        }
        console.timeEnd('Write Uint8Array');
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size);
        console.time('read []');
        for (let i = 0; i < size; i += dataSize) {
            let offset = i;
            for (let j = 0; j < dataArray.length; ++j) {
                buffer[offset++] = dataArray[j];
            }
        }
        console.timeEnd('read []');
    });
    // it(`use readUInt8`, () => {
    //     const buffer = Buffer.allocUnsafe(size).fill(100);
    //     console.time('readUInt8');
    //     for (let i = 0; i < size; i += dataSize) {
    //         buffer.readUInt8(i);
    //     }
    //     console.timeEnd('readUInt8');
    // });
    // it(`use []`, () => {
    //     const buffer = Buffer.allocUnsafe(size).fill(100);;
    //     console.time('[]');
    //     for (let i = 0; i < size; i += dataSize) {
    //         buffer[i];
    //     }
    //     console.timeEnd('[]');
    // });
});

describe('UInt16', () => {
    const size = 10000;
    const dataSize = 2;
    // it(`use writeUInt16`, () => {
    //     const buffer = Buffer.allocUnsafe(size);
    //     console.time('writeUInt16');
    //     for (let i = 0; i < size; i += dataSize2) {
    //         buffer.writeUInt16(100, i);
    //     }
    //     console.timeEnd('writeUInt16');
    // });
    // it(`use []`, () => {
    //     const buffer = Buffer.allocUnsafe(size);
    //     console.time('[]');
    //     for (let i = 0; i < size; i += dataSize2) {

    //         buffer[i] = 100;
    //     }
    //     console.timeEnd('[]');
    // });
    it(`use readUInt16LE`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        console.time('readUInt16LE');
        for (let i = 0; i < size; i += dataSize) {
            buffer.readUInt16LE(i);
        }
        console.timeEnd('readUInt16LE');
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        console.time('[]');
        for (let i = 0; i < size; i += dataSize) {
            const first = this[i];
            const last = this[i + 1];
            first + last * 2 ** 8;
        }
        console.timeEnd('[]');
    });
});
