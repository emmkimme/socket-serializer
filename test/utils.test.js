const { whichTypedArray, isDate, isArrayBuffer } = require("../lib/utils/types");
const { expect } = require("chai");

describe('utils tests', () => {
    describe('which array', () => {
        class SomeArray extends Int8Array {}
        class SomeArrayArray extends SomeArray {}
        class SomeClassWithoutTag extends Int8Array {
            [Symbol.toStringTag] = undefined;
        }

        const testCases = [
            // object / assertion result
            [undefined, undefined],
            [null, undefined],
            [false, undefined],
            [true, undefined],
            [{}, undefined],
            [/a/g, undefined],
            [new RegExp('a', 'g'), undefined],
            [new Date(), undefined],
            [42, undefined],
            [Object(42), undefined],
            [NaN, undefined],
            [Infinity, undefined],
            ['foo', undefined],
            [Object('foo'), undefined],
            [function() {}, undefined],
            [() => {}, undefined],
            [[], undefined],
            [new Int8Array(), 'Int8Array'],
            [new Int16Array(), 'Int16Array'],
            [new Int32Array(), 'Int32Array'],
            [new Uint8Array(), 'Uint8Array'],
            [new Uint16Array(), 'Uint16Array'],
            [new Uint32Array(), 'Uint32Array'],
            [new Uint8ClampedArray(), 'Uint8ClampedArray'],
            [new BigInt64Array(), 'BigInt64Array'],
            [new BigUint64Array(), 'BigUint64Array'],
            [new Float32Array(), 'Float32Array'],
            [new Float64Array(), 'Float64Array'],
            [new SomeArray(), 'Int8Array'],
            [new SomeArrayArray(), 'Int8Array'],
            [new SomeClassWithoutTag(), undefined],
        ];

        testCases.forEach(testCase => {
            it(`should check whichTypedArray for ${Object.prototype.toString.call(testCase[0])} and return ${testCase[1]}`, () => {
                const result = whichTypedArray(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            })
        });
    });
    
    describe('isDate', () => {
        class SomeDateChild extends Date {}
        const isDateTestCases = [
            [new Date(), true],
            [new Date(2022, 12, 1, 14, 24, 30), true],
            [new RegExp(/a/g), false],
            [42, false],
            [new Uint16Array(), false],
            ['2022/12/01', false],
            [NaN, false],
            [new SomeDateChild(), true],
        ];

        isDateTestCases.forEach(testCase => {
            it(`should check isDate for ${Object.prototype.toString.call(testCase[0])} and return ${testCase[1]}`, () => {
                const result = isDate(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            })
        });
    });
    
    describe('isArrayBuffer', () => {
        class SomeArrayChild extends ArrayBuffer {}
        const isArrayBufferTestCases = [
            [new Date(), false],
            [new RegExp(/a/g), false],
            [42, false],
            [new Uint16Array(), false],
            ['2022/12/01', false],
            [NaN, false],
            [new ArrayBuffer(10), true],
            [new SomeArrayChild(), true],
        ];

        isArrayBufferTestCases.forEach(testCase => {
            it(`should check isArrayBuffer for ${Object.prototype.toString.call(testCase[0])} and return ${testCase[1]}`, () => {
                const result = isArrayBuffer(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            })
        });
    });
    
});
