import fetchMock from 'jest-fetch-mock';
import { InitResponseString, MockLocalStorage } from 'statsig-test-helpers';

import { DataAdapterResult, Log } from '@statsig/client-core';

import { StatsigEvaluationsDataAdapter } from '../StatsigEvaluationsDataAdapter';

describe('Evaluations Data Adapter', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let storageMock: MockLocalStorage;
  let adapter: StatsigEvaluationsDataAdapter;

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

      new StatsigEvaluationsDataAdapter().getDataSync(user);

      expect(Log.error).toHaveBeenCalled();
    });
  });

  describe('getDataSync', () => {
    beforeAll(async () => {
      fetchMock.mockResponse(InitResponseString);

      adapter = new StatsigEvaluationsDataAdapter();
      adapter.attach(sdkKey, null);
    });

    it('returns null when nothing is found', () => {
      const result = adapter.getDataSync(user);
      expect(result).toBeNull();
    });

    it('returns bootstrapped values', () => {
      adapter.setData(InitResponseString, user);

      const result = adapter.getDataSync(user);

      expect(result?.source).toBe('Bootstrap');
      expect(result?.data).toBe(InitResponseString);
    });

    it('returns prefetched values', async () => {
      await adapter.prefetchData(user);

      const result = adapter.getDataSync(user);

      expect(result?.source).toBe('Prefetch');
      expect(result?.data).toBe(InitResponseString);
    });
  });

  describe('getDataAsync', () => {
    let result: DataAdapterResult | null;

    beforeEach(async () => {
      fetchMock.mock.calls = [];
      fetchMock.mockResponse(InitResponseString);

      adapter = new StatsigEvaluationsDataAdapter();
      adapter.attach(sdkKey, null);
      result = await adapter.getDataAsync(null, user);
    });

    it('returns the network result on success', () => {
      expect(result?.source).toBe('Network');
      expect(result?.data).toBe(InitResponseString);
    });

    it('saves the network value for later getDataSync calls', () => {
      const syncResult = adapter.getDataSync(user);
      expect(syncResult?.source).toBe('Network');
      expect(syncResult?.data).toBe(InitResponseString);
    });

    it('is cached for later sessions', () => {
      const nextAdapter = new StatsigEvaluationsDataAdapter();
      nextAdapter.attach(sdkKey, null);

      const syncResult = nextAdapter.getDataSync(user);
      expect(syncResult?.source).toBe('Cache');
      expect(syncResult?.data).toBe(InitResponseString);
    });

    it('returns NetworkNotModifed on 204', async () => {
      fetchMock.mockResponse('', { status: 204 });

      const notModifiedResult = await adapter.getDataAsync(null, user);

      expect(notModifiedResult?.source).toBe('NetworkNotModified');
      expect(notModifiedResult?.data).toBe(InitResponseString);
    });

    it('returns null on network failure', async () => {
      fetchMock.mockReject();

      const errorResult = await adapter.getDataAsync(null, user);

      expect(errorResult).toBeNull();
    });
  });
});
