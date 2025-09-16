import fetchMock from 'jest-fetch-mock';
import { DcsResponseString, MockLocalStorage } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

const sdkKey = 'client-test-key';

describe('Gate Evaluation with Mock Data', () => {
  it('should evaluate gates correctly with real specs data', () => {
    const client = new StatsigEdgeClient(sdkKey);

    client.initializeSync(DcsResponseString);

    // Test with the gates that exist in the DcsResponse
    const user = { userID: 'a-user' };
    const user2 = { userID: 'b-user' };

    //100% pass rate in a_gate
    expect(client.checkGate('a_gate', user)).toBe(true);
    //50% pass rate.
    expect(client.checkGate('partial_gate', user2)).toBe(false);
    expect(client.checkGate('partial_gate', user)).toBe(true);
  });
});

describe('Async Verification', () => {
  let client: StatsigEdgeClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(DcsResponseString);

    client = new StatsigEdgeClient(sdkKey);
    await client.initializeAsync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('calls /download_config_specs from network', () => {
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://api.statsigcdn.com/v1/download_config_specs?k=client-test-key',
    );
  });
});
