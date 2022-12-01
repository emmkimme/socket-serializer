const chai = require('chai');
const assert = chai.assert;

function logTime(msg, cb) {
    console.time(msg);
    cb();
    console.timeEnd(msg);
}

describe('byte', () => {
    const size = 10000;
    it(`use writeUInt8`, () => {
        const buffer = Buffer.allocUnsafe(size);
        logTime('writeUInt8', () => {
            for (let i = 0; i < size; ++i) {
                buffer.writeUInt8(100, i);
            }
        });
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size);
        logTime('write []', () => {
            for (let i = 0; i < size; ++i) {
                buffer[i] = 100;
            }
        });
    });
    it(`use readUInt8`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        logTime('readUInt8', () => {
            for (let i = 0; i < size; ++i) {
                buffer.readUInt8(i);
            }
        });
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        logTime('read []', () => {
            for (let i = 0; i < size; ++i) {
                buffer[i];
            }
        });
    });

    it(`buffer allocUnsafe`, () => {
        const buffer = Buffer.allocUnsafe(1);
        buffer[0] = 100;
        assert(buffer[0] === 100);

        logTime('allocUnsafe', () => {
            for (let i = 0; i < size; ++i) {
                const buffer = Buffer.allocUnsafe(1);
                buffer[0] = 100;
            }
        });
    });

    it(`buffer allocUnsafe.fill`, () => {
        const buffer = Buffer.allocUnsafe(1).fill(100);
        assert(buffer[0] === 100);

        logTime('allocUnsafe.fill', () => {
            for (let i = 0; i < size; ++i) {
                const buffer = Buffer.allocUnsafe(1).fill(100);
            }
        });
    });

    it(`buffer alloc`, () => {
        const buffer = Buffer.alloc(1, 100);
        assert(buffer[0] === 100);

        logTime('alloc', () => {
            for (let i = 0; i < size; ++i) {
                const buffer = Buffer.alloc(1, 100);
            }
        });
    });
});

describe('bytes array', () => {
    const size = 10000;
    const dataArray = [1, 2, 3, 4, 5];
    const dataSize = dataArray.length;

    it(`use Uint8Array`, () => {
        const buffer = Buffer.allocUnsafe(size);
        logTime('Write Uint8Array', () => {
            for (let i = 0; i < size; i += dataSize) {
                const uint8Array = new Uint8Array(dataArray);
                buffer.copy(uint8Array, i, 0);
            }
        });
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size);
        logTime('read []', () => {
            for (let i = 0; i < size; i += dataSize) {
                let offset = i;
                for (let j = 0; j < dataArray.length; ++j) {
                    buffer[offset++] = dataArray[j];
                }
            }
        });
    });
});

describe('UInt16', () => {
    const size = 10000;
    const dataSize = 2;
    // it(`use writeUInt16`, () => {
    //     const buffer = Buffer.allocUnsafe(size);
    //     logTime('writeUInt16');
    //     for (let i = 0; i < size; i += dataSize2) {
    //         buffer.writeUInt16(100, i);
    //     }
    //     console.timeEnd('writeUInt16');
    // });
    // it(`use []`, () => {
    //     const buffer = Buffer.allocUnsafe(size);
    //     logTime('[]');
    //     for (let i = 0; i < size; i += dataSize2) {

    //         buffer[i] = 100;
    //     }
    //     console.timeEnd('[]');
    // });
    it(`use readUInt16LE`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        logTime('readUInt16LE', () => {
            for (let i = 0; i < size; i += dataSize) {
                buffer.readUInt16LE(i);
            }
        });
    });
    it(`use []`, () => {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        logTime('[]', () => {
            for (let i = 0; i < size; i += dataSize) {
                const first = this[i];
                const last = this[i + 1];
                first + last * 2 ** 8;
            }
        });
    });
});

// describe('test', () => {
//     const buffer = Buffer.from('123');
//     const str = buffer.toString(0, 10);
//     console.log(str);
// });

describe('buffer concat', () => {
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    function createRandomBuffer() {
        const length = Math.random() * 1000;
        let buffer = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; ++i) {
            buffer[i] = randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        return buffer;
    }

    const buffers = [];
    before(() => {
        for (let i = 0; i < 1000; ++i) {
            buffers.push(createRandomBuffer());
        }
    });

    it(`push - apply`, () => {
        const results = buffers.slice();
        logTime('push - apply', () => {
            results.push.apply(results, buffers);
        });
    });

    it(`push - loop`, () => {
        const results = buffers.slice();
        logTime('push - loop', () => {
            for (let i = 0; i < buffers.length; ++i) {
                results.push(buffers[i]);
            }
        });
    });

    it(`concat`, () => {
        let results = buffers.slice();
        logTime('concat', () => {
            results = results.concat(buffers);
        });
    });

});

// describe('test Uint32Array type', () => {
//     const data = new Uint32Array();

//     it('util.types.isUint32Array', () => {
//         assert(util.types.isUint32Array(data));
//     });

//     it('util.types.isArrayBuffer', () => {
//         assert(util.types.isArrayBuffer(data));
//     });

//     it('util.types.isAnyArrayBuffer', () => {
//         assert(util.types.isAnyArrayBuffer(data));
//     });

//     it('util.types.isTypedArray', () => {
//         assert(util.types.isTypedArray(data));
//     });

// });


describe('clone vs create', () => {
    const loop = 100000;
    const data = { type: 10, headerSize: 100, contentSize: 1000 };

    it('clone', () => {
        for (let i = 0; i < loop; ++i) {
            const obj = Object.assign({} , data);
        }
    });

    it('create', () => {
        for (let i = 0; i < loop; ++i) {
            const obj = { type: 10, headerSize: 100, contentSize: 1000 };
        }
    });
});