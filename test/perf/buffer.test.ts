import { expect } from 'chai';
import { Buffer } from 'buffer';
import { benchmark } from '../utils/benchmark';

describe('[PerfBuffer] Compare operations with bytes', () => {
    const size = 10000;
    it(`use indexing for writing`, function () {
        const buffer = Buffer.allocUnsafe(size);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                buffer[i] = 100;
            }
        });
    });

    it(`use indexing for reading`, function () {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                buffer[i];
            }
        })
    });

    it(`use writeUInt8`, function() {
        const buffer = Buffer.allocUnsafe(size);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                buffer.writeUInt8(100, i);
            }
        });
    });

    it(`use readUInt8`, function () {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                buffer.readUInt8(i);
            }
        });
    });

    it(`use buffer allocUnsafe`, function() {
        const buffer = Buffer.allocUnsafe(1);
        buffer[0] = 100;
        expect(buffer[0]).to.be.eq(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                const buffer = Buffer.allocUnsafe(1);
                buffer[0] = 100;
            }
        });
    });

    it(`use buffer allocUnsafe.fill`, function() {
        const buffer = Buffer.allocUnsafe(1).fill(100);
        expect(buffer[0]).to.be.eq(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                Buffer.allocUnsafe(1).fill(100);
            }
        });
    });

    it(`use buffer alloc`, function() {
        const buffer = Buffer.alloc(1, 100);
        expect(buffer[0]).to.be.eq(100);

        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; ++i) {
                Buffer.alloc(1, 100);
            }
        });
    });
});

describe('[PerfBuffer] Compare buffer population from Array using', () => {
    const size = 10000;
    const dataArray = [1, 2, 3, 4, 5];
    const dataSize = dataArray.length;

    it(`Uint8Array set`, function() {
        const buffer = Buffer.allocUnsafe(size);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; i += dataSize) {
                const uint8Array = new Uint8Array(dataArray);
                buffer.set(uint8Array, i)
            }
        })
    });

    it(`indexing`, function() {
        const buffer = Buffer.allocUnsafe(size);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; i += dataSize) {
                let offset = i;
                for (let j = 0; j < dataArray.length; ++j) {
                    buffer[offset++] = dataArray[j];
                }
            }
        })
    });
});

describe('[PerfBuffer] Compare indexing and readUint16LE', () => {
    const size = 10000;
    const dataSize = 2;

    it(`use readUInt16LE to access buffer elements`, function() {
        const buffer = Buffer.allocUnsafe(size).fill(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size; i += dataSize) {
                buffer.readUInt16LE(i);
            }
        });
    });

    it(`use indexing([]) to access buffer elements`, function() {
        const buff = Buffer.allocUnsafe(size).fill(100);
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < size - 1; i += dataSize) {
                const first = buff[i];
                const last = buff[i + 1];
                first + last;
            }
        });
    });
});

describe('[PerfBuffer] Buffer concat', () => {
    function createRandomBuffer(): Buffer {
        const length = Math.random() * 1000;
        const buffer = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; ++i) {
            buffer[i] = Math.random() * 255;
        }
        return buffer;
    }

    const buffers: Buffer[] = [];
    before(() => {
        for (let i = 0; i < 1000; ++i) {
            buffers.push(createRandomBuffer());
        }
    });

    it(`push - apply`, function() {
        const results = buffers.slice();
        benchmark.record(`${this.test.fullTitle()}`, () => {
            results.push(...buffers);
        });
    });

    it(`push - loop`, function() {
        const results = buffers.slice();
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < buffers.length; ++i) {
                results.push(buffers[i]);
            }
        });
    });

    it(`concat`, function() {
        let results = buffers.slice();
        benchmark.record(`${this.test.fullTitle()}`, () => {
            results = results.concat(buffers);
        });
    });
});

describe('[PerfBuffer] Object clone vs create', () => {
    const loop = 100000;
    const data = { type: 10, headerSize: 100, contentSize: 1000 };

    it('should clone Object', function() {
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < loop; ++i) {
                Object.assign({}, data);
                data.type = data.headerSize;
            }
        });
    });

    it('should create Object', function() {
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < loop; ++i) {
                const obj = { type: 10, headerSize: 100, contentSize: 1000 };
                obj.type = obj.headerSize;
            }
        });
    });
});
