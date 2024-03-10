import fetchMock from 'jest-fetch-mock';

import { getUserStorageKey } from '@statsig/client-core';

import { EvaluationsDataAdapter } from '../EvaluationsDataAdapter';
import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Init Strategy - Bootstrap', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };
  const cacheKey = `statsig.cached.evaluations.${getUserStorageKey(sdkKey, user)}`;

  let client: PrecomputedEvaluationsClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    client = new PrecomputedEvaluationsClient(sdkKey, user);
    const adapter = client.getDataAdapter() as EvaluationsDataAdapter;
    adapter.setDataForUser(user, JSON.stringify(InitializeResponse));

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

      client = new PrecomputedEvaluationsClient(sdkKey, user);
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
