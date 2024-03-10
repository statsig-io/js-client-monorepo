import fetchMock from 'jest-fetch-mock';

import { LogLevel } from '@statsig/client-core';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Initialize Network Failure', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: PrecomputedEvaluationsClient;
  let storageMock: MockLocalStorage;

  async function runInitAsync() {
    client = new PrecomputedEvaluationsClient(sdkKey, user, {
      logLevel: LogLevel.None,
    });
    await client.initializeAsync();
  }

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockReject();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  describe('No Cache', () => {
    beforeAll(async () => {
      fetchMock.mock.calls = [];

      await runInitAsync();
    });

    it('is ready after initialize', () => {
      expect(client.loadingStatus).toBe('Ready');
    });

    it('reports source as "NoValues"', () => {
      const gate = client.getFeatureGate('a_gate');
      expect(gate.details.reason).toBe('NoValues');
    });

    it('tries to call /initialize 3 times', () => {
      expect(fetchMock.mock.calls).toHaveLength(3);
      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://api.statsig.com/v1/initialize',
      );
    });

    it('writes nothing to storage', () => {
      expect(storageMock.data).toMatchObject({});
    });
  });

  describe('With Cache', () => {
    beforeAll(async () => {
      fetchMock.mock.calls = [];

      storageMock.setItem(
        'statsig.cached.evaluations.2442570830',
        JSON.stringify({
          source: 'Network',
          data: JSON.stringify(InitializeResponse),
          receivedAt: Date.now(),
        }),
      );

      await runInitAsync();
    });

    it('reports source as "Cache"', () => {
      const gate = client.getFeatureGate('a_gate');
      expect(gate.details.reason).toBe('Cache:Recognized');
    });

    it('tries to call /initialize 3 times', () => {
      expect(fetchMock.mock.calls).toHaveLength(3);
      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://api.statsig.com/v1/initialize',
      );
    });
  });
});
