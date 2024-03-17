import fetchMock from 'jest-fetch-mock';

import StatsigOnDeviceEvalClient from '../StatsigOnDeviceEvalClient';
import { MockLocalStorage } from './MockLocalStorage';
import DcsResponse from './dcs_response.json';

describe('Init Strategy - Awaited', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: StatsigOnDeviceEvalClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(DcsResponse));

    client = new StatsigOnDeviceEvalClient(sdkKey);

    await client.initializeAsync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "Network"', () => {
    const gate = client.getFeatureGate('a_gate', user);
    expect(gate.details.reason).toBe('Network:Recognized');
  });

  it('calls /download_config_specs from network', () => {
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://api.statsigcdn.com/v1/download_config_specs?k=client-key',
    );
  });

  it('writes nothing to storage', () => {
    expect(storageMock.data).toMatchObject({});
  });
});
