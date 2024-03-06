import fetchMock from 'jest-fetch-mock';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Cache Eviction', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: PrecomputedEvaluationsClient;
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    client = new PrecomputedEvaluationsClient(sdkKey);
    await client.initialize(user);

    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await client.updateUser({ userID: `user-${i}` });
    }

    await client.shutdown();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('should only have 10 user cache entries and 1 manifest entry', () => {
    expect(Object.entries(storageMock.data).length).toBe(11);
  });
});
