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
    (client as any)._logger = 1;
    expect(() => client.checkGate('test_public')).not.toThrow();
  });
});
