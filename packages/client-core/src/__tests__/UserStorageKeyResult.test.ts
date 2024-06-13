import { _getUserStorageKey } from '../CacheKey';
import { StatsigUser } from '../StatsigUser';

const EXPECTED_HASH = '3826897827';
const TEST_CASES: [string, StatsigUser][] = Object.entries({
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

const SDK_KEY = 'client-key-for-storage-test';

describe('User Storage Key Result', () => {
  test.each(TEST_CASES)(`%s`, (_t, user) => {
    const lKey = _getUserStorageKey(SDK_KEY, user);
    expect(lKey).toBe(EXPECTED_HASH);
  });
});
