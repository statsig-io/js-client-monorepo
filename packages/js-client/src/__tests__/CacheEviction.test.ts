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

describe('Storage Quota Handling', () => {
  let storageMock: MockLocalStorage;
  let adapter: StatsigEvaluationsDataAdapter;
  let originalSetItem: (key: string, value: string) => void;

  beforeEach(() => {
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

    // Store original setItem to restore later
    originalSetItem = storageMock.setItem;
  });

  afterEach(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('evicts old cached keys on QuotaExceededError', async () => {
    storageMock.setItem = jest.fn((key: string, value: string) => {
      if (
        key.startsWith(DataAdapterCachePrefix) &&
        Object.keys(storageMock.data).filter((k) =>
          k.startsWith(DataAdapterCachePrefix),
        ).length > 0
      ) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      originalSetItem.call(storageMock, key, value);
    });

    await adapter.getDataAsync(null, { userID: `user-a` });
    const userAKey = 'statsig.cached.evaluations.user-a';
    expect(storageMock.data[userAKey]).toBeDefined();

    await adapter.getDataAsync(null, { userID: 'new-user' });

    // Check that `user-a` has been evicted
    expect(storageMock.data[userAKey]).toBeUndefined();
  });

  it('retries on QuotaExceededError until successful', async () => {
    let setItemCount = 0;
    storageMock.setItem = jest.fn((key: string, value: string) => {
      if (key.startsWith(DataAdapterCachePrefix) && setItemCount <= 2) {
        setItemCount++;
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      originalSetItem.call(storageMock, key, value);
    });

    await adapter.getDataAsync(null, { userID: 'new-user' });

    expect(setItemCount).toBeGreaterThan(2);
  });

  it('retries on QuotaExceededError within a limit', async () => {
    let setItemCount = 0;
    storageMock.setItem = jest.fn((key: string, value: string) => {
      if (key.startsWith(DataAdapterCachePrefix)) {
        setItemCount++;
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      originalSetItem.call(storageMock, key, value);
    });

    await expect(
      adapter.getDataAsync(null, { userID: 'new-user' }),
    ).rejects.toThrow('QuotaExceededError');
    expect(setItemCount).toBeLessThan(100);
  });

  it('rethrows non-QuotaExceededError', async () => {
    let setItemCount = 0;
    storageMock.setItem = jest.fn((key: string, value: string) => {
      if (key.startsWith(DataAdapterCachePrefix)) {
        setItemCount++;
        throw new Error('SomeOtherError');
      }
      originalSetItem.call(storageMock, key, value);
    });

    await expect(
      adapter.getDataAsync(null, { userID: 'new-user' }),
    ).rejects.toThrow('SomeOtherError');

    expect(setItemCount).toEqual(1);
  });
});
