import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import StatsigClient from '../StatsigClient';
import { MockLocalStorage } from './MockLocalStorage';

describe('Init Strategy - Awaited', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: StatsigClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    client = new StatsigClient(sdkKey, user);
    await client.initializeAsync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "Network"', () => {
    const gate = client.getFeatureGate('a_gate');
    expect(gate.details.reason).toBe('Network:Recognized');
  });

  it('calls /initialize from network', () => {
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://api.statsig.com/v1/initialize',
    );
  });

  it('writes nothing to storage', () => {
    expect(storageMock.data).toMatchObject({});
  });
});
