export const typedArrays = [
    'Int8Array',
    'Int16Array',
    'Int32Array',
    'Uint8Array',
    'Uint16Array',
    'Uint32Array',
    'Uint8ClampedArray',
    'BigInt64Array',
    'BigUint64Array',
    'Float32Array',
    'Float64Array',
] as const;

export type PossibleTypedArrays = typeof typedArrays[number];

export function getObjectStringTag(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    let currentObjectTag = (value as { [Symbol.toStringTag]: string })[Symbol.toStringTag];
    if (!currentObjectTag) {
        currentObjectTag = Object.prototype.toString.call(value).slice(8, -1);
    }

    return currentObjectTag;
}

export function whichTypedArray(value: unknown): PossibleTypedArrays | undefined {
    const stringTag = getObjectStringTag(value);
    return typedArrays.find(type => type === stringTag);
}

export function isObject(arg: unknown): boolean {
  return typeof arg === 'object' && arg !== null;
}

export function isDate(d: unknown): boolean{
  return isObject(d) && getObjectStringTag(d) === 'Date';
}

export function isArrayBuffer(value: unknown) {
  return getObjectStringTag(value) === 'ArrayBuffer';
}
