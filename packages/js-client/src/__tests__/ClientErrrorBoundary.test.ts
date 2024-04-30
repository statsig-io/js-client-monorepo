import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import { LogLevel } from '@statsig/client-core';

import StatsigClient from '../StatsigClient';

describe('Client Error Boundary', () => {
  let client: StatsigClient;

  beforeAll(async () => {
    client = new StatsigClient(
      'client-key',
      { userID: '' },
      {
        logLevel: LogLevel.None,
      },
    );

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);
    client.initializeSync();
  });

  it('catches errors', () => {
    expect(() => client.checkGate('test_public')).not.toThrow();
  });

  it('data adapter hits error boundary', async () => {
    const adapter = client.dataAdapter;
    (adapter as any).getDataSync = () => {
      throw new Error('Test');
    };

    await adapter.prefetchData({ userID: 'a' });
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://statsigapi.net/v1/sdk_exception',
    );
  });
});
