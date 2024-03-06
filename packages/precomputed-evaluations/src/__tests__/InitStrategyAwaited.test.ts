import fetchMock from 'jest-fetch-mock';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import { NetworkEvaluationsDataProvider } from '../data-providers/NetworkEvaluationsDataProvider';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Init Strategy - Awaited', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };
  const options = {
    dataProviders: [NetworkEvaluationsDataProvider.create()],
  };

  let client: PrecomputedEvaluationsClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    client = new PrecomputedEvaluationsClient(sdkKey, user, options);

    await client.initialize();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('is ready after initialize', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('reports source as "Network"', () => {
    const gate = client.getFeatureGate('a_gate');
    expect(gate.source).toBe('Network');
  });

  // it('calls /initialize from network', () => {
  //   expect(fetchMock.mock.calls).toHaveLength(1);
  //   expect(fetchMock.mock.calls[0][0]).toBe('1');
  // });

  it('writes nothing to storage', () => {
    expect(storageMock.data).toMatchObject({});
  });
});
