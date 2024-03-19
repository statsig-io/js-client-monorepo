import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import { DataAdapterCachePrefix } from '@statsig/client-core';

import { StatsigEvaluationsDataAdapter } from '../StatsigEvaluationsDataAdapter';
import { MockLocalStorage } from './MockLocalStorage';

describe('Cache Eviction', () => {
  let storageMock: MockLocalStorage;
  let adapter: StatsigEvaluationsDataAdapter;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    adapter = new StatsigEvaluationsDataAdapter();
    adapter.attach('client-key', null);

    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await adapter.getDataAsync(null, { userID: `user-${i}` });
    }
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('should only have 10 entries in _inMemoryCache', () => {
    const entries = Object.entries((adapter as any)._inMemoryCache);
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
    expect(Array.from(new Set(keys))).toEqual([
      'statsig.stable_id',
      'statsig.last_modified_time',
      DataAdapterCachePrefix,
    ]);
  });
});
