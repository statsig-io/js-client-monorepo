import { _getSortedObject } from '../Hashing';

const unsorted = {
  b: { b: '1', c: { b: '1', a: '2' }, a: '2' },
  a: { b: '1', c: { b: '1', a: '2' }, a: '2' },
};

describe('SortedObject', () => {
  describe.each([
    [
      '0 Levels',
      0,
      {
        a: { b: '1', c: { b: '1', a: '2' }, a: '2' },
        b: { b: '1', c: { b: '1', a: '2' }, a: '2' },
      },
    ],
    [
      'Whole Object',
      undefined,
      {
        a: { a: '2', b: '1', c: { a: '2', b: '1' } },
        b: { a: '2', b: '1', c: { a: '2', b: '1' } },
      },
    ],
    [
      '1 Level',
      1,
      {
        a: { a: '2', b: '1', c: { b: '1', a: '2' } },
        b: { a: '2', b: '1', c: { b: '1', a: '2' } },
      },
    ],
    [
      '2 Levels',
      2,
      {
        a: { a: '2', b: '1', c: { a: '2', b: '1' } },
        b: { a: '2', b: '1', c: { a: '2', b: '1' } },
      },
    ],
  ])('%s', (_title, maxLevels, sorted) => {
    it('sorts the object', () => {
      expect(JSON.stringify(_getSortedObject(unsorted, maxLevels))).toBe(
        JSON.stringify(sorted),
      );
    });
  });
});
