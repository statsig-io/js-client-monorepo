import fetchMock from 'jest-fetch-mock';
import {
  InitResponseStableIDString,
  MockLocalStorage,
} from 'statsig-test-helpers';

import {
  DataAdapterCachePrefix,
  _getUserStorageKey,
} from '@statsig/client-core';

import StatsigClient from '../StatsigClient';

describe('Init Strategy - Bootstrap', () => {
  const sdkKey = 'client-key';
  const user = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };
  const cacheKey = `${DataAdapterCachePrefix}.evaluations.${_getUserStorageKey(sdkKey, user)}`;

  let client: StatsigClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseStableIDString);

    client = new StatsigClient(sdkKey, user);
    client.dataAdapter.setData(InitResponseStableIDString);

    client.initializeSync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "Bootstrap"', () => {
    const gate = client.getFeatureGate('a_gate');
    expect(gate.details.reason).toBe('Bootstrap:Recognized');
  });

  it('writes the updated values to cache', () => {
    expect(storageMock.data[cacheKey]).toBeDefined();
  });

  describe('the next session', () => {
    beforeAll(async () => {
      fetchMock.mockClear();

      client = new StatsigClient(sdkKey, user);
      client.initializeSync();
    });

    it('is ready after initialize', () => {
      expect(client.loadingStatus).toBe('Ready');
    });

    it('reports source as "Cache"', () => {
      const gate = client.getFeatureGate('a_gate');
      expect(gate.details.reason).toBe('Cache:Recognized');
    });
  });
});
