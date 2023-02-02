import { benchmark } from '../utils/benchmark';
import { whichTypedArray } from '../../src/utils/types';

const typedArrays = [
    100000,
    'some-string',
    new Int8Array(),
    new Int16Array(),
    new Int32Array(),
    new Uint8Array(),
    new Uint16Array(),
    new Uint32Array(),
    new Uint8ClampedArray(),
    new BigInt64Array(),
    new BigUint64Array(),
    new Float32Array(),
    new Float64Array(),
];

describe('[Perf] utils', () => {
    it('should measure performance of custom whichTypedArray', function() {
        benchmark.record(`${this.test.fullTitle()}`, () => {
            for (let i = 0; i < typedArrays.length; i++) {
                whichTypedArray(typedArrays[i]);
            }
        });
    });
});
