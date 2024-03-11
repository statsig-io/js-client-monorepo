import fetchMock from 'jest-fetch-mock';

import {
  DataAdapterCachePrefix,
  getUserStorageKey,
} from '@statsig/client-core';

import OnDeviceEvaluationsClient from '../OnDeviceEvaluationsClient';
import { SpecsDataAdapter } from '../SpecsDataAdapter';
import { MockLocalStorage } from './MockLocalStorage';
import DcsResponse from './dcs_response.json';

describe('Init Strategy - Bootstrap', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };
  const cacheKey = `${DataAdapterCachePrefix}.specs.${getUserStorageKey(sdkKey)}`;

  let client: OnDeviceEvaluationsClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(DcsResponse));

    client = new OnDeviceEvaluationsClient(sdkKey);
    const adapter = client.getDataAdapter() as SpecsDataAdapter;
    adapter.setData(JSON.stringify(DcsResponse));

    client.initializeSync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "Bootstrap"', () => {
    const gate = client.getFeatureGate('a_gate', user);
    expect(gate.details.reason).toBe('Bootstrap:Recognized');
  });

  it('writes the updated values to cache', () => {
    expect(storageMock.data[cacheKey]).toBeDefined();
  });

  describe('the next session', () => {
    beforeAll(async () => {
      fetchMock.mockClear();

      client = new OnDeviceEvaluationsClient(sdkKey);
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
