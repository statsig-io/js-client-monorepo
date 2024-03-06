import fetchMock from 'jest-fetch-mock';

import { getUserStorageKey } from '@statsig/client-core';

import OnDeviceEvaluationsClient from '../OnDeviceEvaluationsClient';
import { LocalStorageCacheSpecsDataProvider } from '../data-providers/LocalStorageCacheSpecsDataProvider';
import { DelayedNetworkSpecsDataProvider } from '../data-providers/NetworkSpecsDataProvider';
import { MockLocalStorage } from './MockLocalStorage';
import DcsResponse from './dcs_response.json';

describe('Init Strategy - Delayed', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };
  const cacheKey = getUserStorageKey(sdkKey);
  const options = {
    dataProviders: [
      new LocalStorageCacheSpecsDataProvider(),
      DelayedNetworkSpecsDataProvider.create(),
    ],
  };

  let client: OnDeviceEvaluationsClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(DcsResponse));

    client = new OnDeviceEvaluationsClient(sdkKey, options);

    // Purposely not awaiting
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    client.initialize();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "NoValues"', () => {
    const gate = client.getFeatureGate('a_gate', user);
    expect(gate.source).toBe('NoValues');
  });

  it('writes the updated values to cache', () => {
    expect(storageMock.data[cacheKey]).toBeDefined();
  });

  describe('the next session', () => {
    beforeAll(async () => {
      fetchMock.mockClear();

      client = new OnDeviceEvaluationsClient(sdkKey, options);

      // Purposely not awaiting
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      client.initialize();
    });

    it('is ready after initialize', () => {
      expect(client.loadingStatus).toBe('Ready');
    });

    it('reports source as "Cache"', () => {
      const gate = client.getFeatureGate('a_gate', user);
      expect(gate.source).toBe('Cache');
    });
  });
});
