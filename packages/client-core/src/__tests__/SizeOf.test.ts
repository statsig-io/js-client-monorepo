import { TextEncoder } from 'util';

import { _fastApproxSizeOf } from '../SizeOf';

const ACTUAL_SIZE = 108;
const EXPECTED_APPROX_SIZE = 96;

const exactSizeOf = (obj: unknown): number => {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
};

describe('SizeOf', () => {
  const obj = {
    message: 'Hello, 世界!',
    number: 1,
    bool: true,
    null: null,
    undefined: undefined,
    array: [1, 2, 3],
    object: { a: 1, b: 2, c: 3 },
  };

  it('should return a "good enough" size of an object', () => {
    const result = _fastApproxSizeOf(obj, 9999);
    expect(result).toBe(EXPECTED_APPROX_SIZE);
  });

  it('should return the correct size of an object', () => {
    expect(exactSizeOf(obj)).toBe(ACTUAL_SIZE);
  });

  it('exits early size grows beyond max', () => {
    const result = _fastApproxSizeOf(obj, 50);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(EXPECTED_APPROX_SIZE);
  });
});
