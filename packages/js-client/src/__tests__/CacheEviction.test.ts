import fetchMock from 'jest-fetch-mock';
import { InitResponseString, MockLocalStorage } from 'statsig-test-helpers';

import { DataAdapterCachePrefix, StatsigUser } from '@statsig/client-core';

import { StatsigEvaluationsDataAdapter } from '../StatsigEvaluationsDataAdapter';

describe('Cache Eviction', () => {
  const expectedNotToBeEvicted = [...Array(9)].map((_, i) => `user-${11 + i}`); // users 11 - 19
  expectedNotToBeEvicted.push('user-1');

  let storageMock: MockLocalStorage;
  let adapter: StatsigEvaluationsDataAdapter;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    adapter = new StatsigEvaluationsDataAdapter();
    adapter.attach(
      'client-key',
      {
        customUserCacheKeyFunc: (_sdkKey: string, user: StatsigUser) =>
          user.userID ?? '',
      },
      null,
    );

    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await adapter.getDataAsync(null, { userID: `user-${i}` });
    }

    await adapter.getDataAsync(null, { userID: `user-1` }); // bump last modified time
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('should only have 10 entries in _inMemoryCache', () => {
    const entries = Object.entries((adapter as any)._inMemoryCache._data);
    expect(entries.length).toBe(10);
  });

  it('should only have 10 user cache entries', () => {
    const entries = Object.entries(storageMock.data).filter((e) =>
      e[0].startsWith(DataAdapterCachePrefix),
    );
    expect(entries.length).toBe(10);
  });

  it('only writes the expected keys', () => {
    const keys = Object.keys(storageMock.data).map((k) =>
      k.split('.').slice(0, 2).join('.'),
    );
    expect(Array.from(new Set(keys)).sort()).toEqual([
      DataAdapterCachePrefix,
      'statsig.last_modified_time',
      'statsig.session_id',
      'statsig.stable_id',
    ]);
  });

  it('only retains the expected keys in memory', () => {
    const keys = Object.keys((adapter as any)._inMemoryCache._data).map((k) =>
      k.split('.').slice(0, 2).join('.'),
    );
    expect(Array.from(new Set(keys))).toEqual([DataAdapterCachePrefix]);
  });

  it('evicts the eldest first from memory', () => {
    expect.assertions(10);

    const keys = Object.keys((adapter as any)._inMemoryCache._data).sort();
    expectedNotToBeEvicted.forEach((userID) => {
      expect(keys).toContain(`statsig.cached.evaluations.${userID}`);
    });
  });

  it('evicts the eldest first from local storage', () => {
    expect.assertions(10);

    const keys = Object.keys(storageMock.data).sort();
    expectedNotToBeEvicted.forEach((userID) => {
      expect(keys).toContain(`statsig.cached.evaluations.${userID}`);
    });
  });
});
