import { StatsigUser, getUserStorageKey } from '../StatsigUser';

const IDENTICAL_USERS: [string, StatsigUser][] = Object.entries({
  one: {
    custom: { arr: ['1', '2', '3'], str: 'bar' },
    customIDs: { a: '1', b: '2' },
    email: 'foo',
    privateAttributes: { num: 1, arr: [], bool: false },
  },
  two: {
    customIDs: { a: '1', b: '2' },
    email: 'foo',
    custom: { str: 'bar', arr: ['1', '2', '3'] },
    privateAttributes: { bool: false, arr: [], num: 1 },
  },
  three: {
    customIDs: { b: '2', a: '1' },
    custom: { str: 'bar', arr: ['1', '2', '3'] },
    email: 'foo',
    privateAttributes: { num: 1, bool: false, arr: [] },
  },
});

const UNIQUE_USERS = Object.entries({
  one: {
    customIDs: { a: '1', b: '2' },
  },
  two: {
    userID: 'a-user',
  },
  three: {
    customIDs: { b: '2', a: '1' },
    email: 'foo',
  },
  four: {
    userID: 'b-user',
  },
  five: {
    userID: 'b-user',
    email: 'b@user.com',
  },
  six: {
    userID: 'b-user',
    email: 'b@user.com',
    customIDs: { userID: 'a-user' },
    custom: {},
  },
}) as unknown as [string, StatsigUser][];

const SDK_KEY = 'client-key';

describe('User Stroage Key', () => {
  describe.each(IDENTICAL_USERS)('Identical Users', (title, left) => {
    test.each(IDENTICAL_USERS)(`${title} vs %s`, (_t, right) => {
      const lKey = getUserStorageKey(SDK_KEY, left);
      const rKey = getUserStorageKey(SDK_KEY, right);
      expect(lKey).toBe(rKey);
    });
  });

  describe.each(UNIQUE_USERS)('Different Users', (lTitle, left) => {
    describe.each(UNIQUE_USERS)('', (rTitle, right) => {
      (rTitle === lTitle ? it.skip : it)(`${lTitle} vs ${rTitle}`, () => {
        const lKey = getUserStorageKey(SDK_KEY, left);
        const rKey = getUserStorageKey(SDK_KEY, right);
        expect(lKey).not.toBe(rKey);
      });
    });
  });
});
