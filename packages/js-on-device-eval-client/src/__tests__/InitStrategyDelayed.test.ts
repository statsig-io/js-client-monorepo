import fetchMock from 'jest-fetch-mock';
import { DcsResponseString, MockLocalStorage } from 'statsig-test-helpers';

import { DataAdapterCachePrefix, _getStorageKey } from '@statsig/client-core';

import StatsigOnDeviceEvalClient from '../StatsigOnDeviceEvalClient';

describe('Init Strategy - Delayed', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };
  const cacheKey = `${DataAdapterCachePrefix}.specs.${_getStorageKey(sdkKey)}`;

  let client: StatsigOnDeviceEvalClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(DcsResponseString);

    client = new StatsigOnDeviceEvalClient(sdkKey);
    client.initializeSync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "NoValues"', () => {
    const gate = client.getFeatureGate('a_gate', user);
    expect(gate.details.reason).toBe('NoValues');
  });

  it('writes the updated values to cache', () => {
    expect(storageMock.data[cacheKey]).toBeDefined();
  });

  describe('the next session', () => {
    beforeAll(async () => {
      fetchMock.mockClear();

      client = new StatsigOnDeviceEvalClient(sdkKey);
      client.initializeSync();
    });

    it('is ready after initialize', () => {
      expect(client.loadingStatus).toBe('Ready');
    });

    it('reports source as "Cache"', () => {
      const gate = client.getFeatureGate('a_gate', user);
      expect(gate.details.reason).toBe('Cache:Recognized');
    });
  });
});
