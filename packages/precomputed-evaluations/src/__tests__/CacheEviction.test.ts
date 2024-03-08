import fetchMock from 'jest-fetch-mock';

import { EvaluationsDataAdapter } from '../EvaluationsDataAdapter';
import { MockLocalStorage } from './MockLocalStorage';
import InitializeResponse from './initialize.json';

describe('Cache Eviction', () => {
  const sdkKey = 'client-key';
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    const adapter = new EvaluationsDataAdapter(sdkKey);

    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await adapter.fetchLatestDataForUser({ userID: `user-${i}` });
    }
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  it('should only have 10 user cache entries', () => {
    const entries = Object.entries(storageMock.data).filter((e) =>
      e[0].startsWith('statsig.user_cache'),
    );
    expect(entries.length).toBe(10);
  });

  it('only writes the expected keys', () => {
    const keys = Object.keys(storageMock.data).map((k) =>
      k.split('.').slice(0, 2).join('.'),
    );
    expect(Array.from(new Set(keys))).toEqual([
      'statsig.stable_id',
      'statsig.last_modified_time',
      'statsig.user_cache',
    ]);
  });
});
