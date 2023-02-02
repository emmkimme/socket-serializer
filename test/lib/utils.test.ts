import { whichTypedArray, isDate, isArrayBuffer } from '../../src/utils/types';
import { expect } from 'chai';

describe('utils', () => {
    describe('which array', () => {
        class SomeArray extends Int8Array {}
        class SomeArrayArray extends SomeArray {}
        class SomeClassWithoutTag extends Int8Array {
            get [Symbol.toStringTag]() {
                return undefined as 'Int8Array';
            }
        }

        const testCases = [
            // object / assertion result
            [undefined, undefined],
            [null, undefined],
            [false, undefined, '[false]'],
            [true, undefined, '[true]'],
            [{}, undefined, '[{}]'],
            [/a/g, undefined, '[/a/g]'],
            [new RegExp('a', 'g'), undefined, `[new RegExp('a', 'g')]`],
            [new Date(), undefined],
            [42, undefined, '[42]'],
            [Object(42), undefined, '[Object(42)]'],
            [NaN, undefined, '[NaN]'],
            [Infinity, undefined, '[Infinity]'],
            ['foo', undefined, '[String foo]'],
            [Object('foo'), undefined, `[Object('foo')]`],
            [
                function () {
                    /** empty */
                },
                undefined,
                '[Function]',
            ],
            [
                () => {
                    /** empty */
                },
                undefined,
                '[Lambda]',
            ],
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
            [new SomeArray(), 'Int8Array', '[object SomeArray]'],
            [new SomeArrayArray(), 'Int8Array', '[object SomeArrayArray]'],
            [new SomeClassWithoutTag(), undefined, '[object SomeClassWithoutTag]'],
        ];

        testCases.forEach((testCase) => {
            it(`should check whichTypedArray for ${
                testCase[2] ? testCase[2] : Object.prototype.toString.call(testCase[0])
            } and return ${testCase[1]}`, () => {
                const result = whichTypedArray(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            });
        });
    });

    describe('isDate', () => {
        class SomeDateChild extends Date {}
        const isDateTestCases = [
            [new Date(), true, '[new Date()]'],
            [new Date(2022, 12, 1, 14, 24, 30), true, '[new Date(2022, 12, 1, 14, 24, 30)]'],
            [new RegExp(/a/g), false],
            [42, false, '[]'],
            [new Uint16Array(), false],
            ['2022/12/01', false],
            [NaN, false, 'NaN'],
            [new SomeDateChild(), true],
        ];

        isDateTestCases.forEach((testCase) => {
            it(`should check isDate for ${
                testCase[2] ? testCase[2] : Object.prototype.toString.call(testCase[0])
            } and return ${testCase[1]}`, () => {
                const result = isDate(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            });
        });
    });

    describe('isArrayBuffer', () => {
        class SomeArrayChild extends ArrayBuffer {}
        const isArrayBufferTestCases = [
            [new Date(), false],
            [new RegExp(/a/g), false],
            [42, false, '[42]'],
            [new Uint16Array(), false],
            ['2022/12/01', false],
            [NaN, false, '[NaN]'],
            [new ArrayBuffer(10), true],
            [new SomeArrayChild(10), true, '[object SomeArrayChild]'],
        ];

        isArrayBufferTestCases.forEach((testCase) => {
            it(`should check isArrayBuffer for ${
                testCase[2] ? testCase[2] : Object.prototype.toString.call(testCase[0])
            } and return ${
                testCase[1]
            }`, () => {
                const result = isArrayBuffer(testCase[0]);
                expect(result).to.be.equal(testCase[1]);
            });
        });
    });
});
