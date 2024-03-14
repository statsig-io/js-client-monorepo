import fetchMock from 'jest-fetch-mock';

import { Log, StatsigDataAdapterResult } from '@statsig/client-core';

import { EvaluationsDataAdapter } from '../EvaluationsDataAdapter';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

const InitializeResponseString = JSON.stringify(InitializeResponse);

describe('Evaluations Data Adapter', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let storageMock: MockLocalStorage;
  let adapter: EvaluationsDataAdapter;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
    MockLocalStorage.disableMockStorage();
  });

  describe('attach', () => {
    it('logs an error when called before attach', () => {
      Log.error = jest.fn();

      new EvaluationsDataAdapter().getDataSync(user);

      expect(Log.error).toHaveBeenCalled();
    });
  });

  describe('getDataSync', () => {
    beforeAll(async () => {
      fetchMock.mockResponse(InitializeResponseString);

      adapter = new EvaluationsDataAdapter();
      adapter.attach(sdkKey, null);
    });

    it('returns null when nothing is found', () => {
      const result = adapter.getDataSync(user);
      expect(result).toBeNull();
    });

    it('returns bootstrapped values', () => {
      adapter.setData(InitializeResponseString, user);

      const result = adapter.getDataSync(user);

      expect(result?.source).toBe('Bootstrap');
      expect(result?.data).toBe(InitializeResponseString);
    });

    it('returns prefetched values', async () => {
      await adapter.prefetchData(user);

      const result = adapter.getDataSync(user);

      expect(result?.source).toBe('Prefetch');
      expect(result?.data).toBe(InitializeResponseString);
    });
  });

  describe('getDataAsync', () => {
    let result: StatsigDataAdapterResult | null;

    beforeEach(async () => {
      fetchMock.mock.calls = [];
      fetchMock.mockResponse(InitializeResponseString);

      adapter = new EvaluationsDataAdapter();
      adapter.attach(sdkKey, null);
      result = await adapter.getDataAsync(null, user);
    });

    it('returns the network result on success', () => {
      expect(result?.source).toBe('Network');
      expect(result?.data).toBe(InitializeResponseString);
    });

    it('saves the network value for later getDataSync calls', () => {
      const syncResult = adapter.getDataSync(user);
      expect(syncResult?.source).toBe('Network');
      expect(syncResult?.data).toBe(InitializeResponseString);
    });

    it('is cached for later sessions', () => {
      const nextAdapter = new EvaluationsDataAdapter();
      nextAdapter.attach(sdkKey, null);

      const syncResult = nextAdapter.getDataSync(user);
      expect(syncResult?.source).toBe('Cache');
      expect(syncResult?.data).toBe(InitializeResponseString);
    });

    it('returns NetworkNotModifed on 204', async () => {
      fetchMock.mockResponse('', { status: 204 });

      const notModifiedResult = await adapter.getDataAsync(null, user);

      expect(notModifiedResult?.source).toBe('NetworkNotModified');
      expect(notModifiedResult?.data).toBe(InitializeResponseString);
    });

    it('returns null on network failure', async () => {
      fetchMock.mockReject();

      const errorResult = await adapter.getDataAsync(null, user);

      expect(errorResult).toBeNull();
    });

    it('hits error boundary', async () => {
      (adapter as any).getDataSync = () => {
        throw new Error('Test');
      };
      await adapter.prefetchData({ userID: 'a' });
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://statsigapi.net/v1/sdk_exception',
      );
    });
  });
});
