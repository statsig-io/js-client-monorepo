import { _getUserStorageKey } from '../CacheKey';
import { StatsigUser } from '../StatsigUser';

const IDENTICAL_USERS: [string, StatsigUser][] = Object.entries({
  user_id_first: {
    userID: 'a-user',
    customIDs: { a: '1', b: '2' },
  },
  custom_ids_first: {
    customIDs: { a: '1', b: '2' },
    userID: 'a-user',
  },
  custom_ids_unordered: {
    userID: 'a-user',
    customIDs: { b: '2', a: '1' },
  },
  with_addtional_info: {
    userID: 'a-user',
    customIDs: { a: '1', b: '2' },

    // all below fields are not included in cache key
    email: 'foo@bar.com',
    ip: '1.2.3.4',
    userAgent: 'Chrome v35',
    country: 'NZ',
    locale: 'en_NZ',
    appVersion: '3.2.1',
    custom: { is_cool: true },
    privateAttributes: { shhh: '1' },
  },
});

const UNIQUE_USERS = Object.entries({
  custom_ids_only: {
    customIDs: { a: '1', b: '2' },
  },
  custom_ids_only_alt: {
    customIDs: { a: '1', b: '3' },
  },
  custom_ids_only_parital: {
    customIDs: { a: '1' },
  },
  user_id_only: {
    userID: 'a-user',
  },
  user_id_only_alt: {
    userID: 'b-user',
  },
  user_id_and_custom_ids: {
    userID: 'a-user',
    customIDs: { a: '1' },
  },
  user_id_in_custom_ids: {
    userID: 'a-user',
    customIDs: { userID: 'a-user' },
  },
}) as unknown as [string, StatsigUser][];

const SDK_KEY = 'client-key';

describe('User Storage Key', () => {
  describe.each(IDENTICAL_USERS)('Identical Users', (title, left) => {
    test.each(IDENTICAL_USERS)(`${title} vs %s`, (_t, right) => {
      const lKey = _getUserStorageKey(SDK_KEY, left);
      const rKey = _getUserStorageKey(SDK_KEY, right);
      expect(lKey).toBe(rKey);
    });
  });

  describe.each(UNIQUE_USERS)('Different Users', (lTitle, left) => {
    describe.each(UNIQUE_USERS)('', (rTitle, right) => {
      (rTitle === lTitle ? it.skip : it)(`${lTitle} vs ${rTitle}`, () => {
        const lKey = _getUserStorageKey(SDK_KEY, left);
        const rKey = _getUserStorageKey(SDK_KEY, right);
        expect(lKey).not.toBe(rKey);
      });
    });
  });
});
