import fetchMock from 'jest-fetch-mock';
import { InitResponseString, MockLocalStorage } from 'statsig-test-helpers';

import StatsigClient from '../StatsigClient';

describe('StatsigClient and Environments', () => {
  const user = { userID: 'a-user' };
  const env = { statsigEnvironment: { tier: 'dev' } };
  const expectedCacheKey = 'statsig.cached.evaluations.1769418430'; // DJB2(JSON({userID: 'a-user', statsigEnvironment: {tier: 'dev'}}))

  let storageMock: MockLocalStorage;
  let client: StatsigClient;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
    fetchMock.enableMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
    MockLocalStorage.disableMockStorage();
  });

  beforeEach(() => {
    storageMock.clear();

    fetchMock.mock.calls = [];
    fetchMock.mockResponse(InitResponseString);

    client = new StatsigClient('client-key', user, {
      environment: { tier: 'dev' },
      disableStatsigEncoding: true,
    });
  });

  describe('When triggered by StatsigClient', () => {
    it('sets the environment on post sync init requests', async () => {
      client.initializeSync();
      await new Promise((r) => setTimeout(r, 1));

      const [, req] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(req?.body));

      expect(body.user).toMatchObject(env);
      expect(storageMock.data[expectedCacheKey]).toBeDefined();
    });

    it('sets the environment on async init requests', async () => {
      await client.initializeAsync();

      const [, req] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(req?.body));

      expect(body.user).toMatchObject(env);
      expect(storageMock.data[expectedCacheKey]).toBeDefined();
    });
  });

  describe('When triggered by DataAdapter', () => {
    it('sets the environment on prefetch requests', async () => {
      await client.dataAdapter.prefetchData(user);

      const [, req] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(req?.body));

      expect(body.user).toMatchObject(env);
      expect(storageMock.data[expectedCacheKey]).toBeDefined();
    });

    it('sets the environment on getDataAsync requests', async () => {
      await client.dataAdapter.getDataAsync(null, user, {});

      const [, req] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(req?.body));

      expect(body.user).toMatchObject(env);
      expect(storageMock.data[expectedCacheKey]).toBeDefined();
    });
  });

  it('includes env on DataAdapter reads', () => {
    storageMock.data[expectedCacheKey] = JSON.stringify({
      source: 'Network',
      receivedAt: Date.now(),
      data: InitResponseString,
      stableID: null,
      fullUserHash: null,
    });

    expect(client.dataAdapter.getDataSync(user)).toBeDefined();
  });
});
