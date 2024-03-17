import fetchMock from 'jest-fetch-mock';

import { DataAdapterCachePrefix, LogLevel } from '@statsig/client-core';

import StatsigClient from '../StatsigClient';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Initialize Network Bad Response', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: StatsigClient;
  let storageMock: MockLocalStorage;

  async function initialize() {
    client = new StatsigClient(sdkKey, user, {
      logLevel: LogLevel.None,
    });
    await client.initializeAsync();
  }

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse('<NOT JSON>');
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  describe('No Cache', () => {
    beforeAll(async () => {
      fetchMock.mock.calls = [];

      await initialize();
    });

    it('is ready after initialize', () => {
      expect(client.loadingStatus).toBe('Ready');
    });

    it('reports source as "NoValues"', () => {
      const gate = client.getFeatureGate('a_gate');
      expect(gate.details.reason).toBe('NoValues');
    });

    it('writes nothing to storage', () => {
      expect(storageMock.data).toMatchObject({});
    });
  });

  describe('With Cache', () => {
    beforeAll(async () => {
      fetchMock.mock.calls = [];

      storageMock.setItem(
        `${DataAdapterCachePrefix}.evaluations.2442570830`,
        JSON.stringify({
          source: 'Network',
          data: JSON.stringify(InitializeResponse),
          receivedAt: Date.now(),
        }),
      );

      await initialize();
    });

    it('reports source as "Cache"', () => {
      const gate = client.getFeatureGate('a_gate');
      expect(gate.details.reason).toBe('Cache:Recognized');
    });
  });
});