import fetchMock from 'jest-fetch-mock';

import { LogLevel, StatsigClientEventData } from '@statsig/client-core';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';

describe('Init Network Failure', () => {
  const user = { userID: 'a-user' };
  const events: StatsigClientEventData[] = [];

  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    client = new PrecomputedEvaluationsClient('client-key', user, {
      logLevel: LogLevel.Debug,
    });

    fetchMock.enableMocks();
    fetchMock.mockReject(new Error('Unsupported Media'));

    client.on('error', (data) => events.push(data));

    await client.initialize();
  });

  it('retries 3 times', () => {
    expect(fetchMock.mock.calls).toHaveLength(3);
  });

  it('is still usable', () => {
    expect(client.loadingStatus).toBe('Ready');
  });

  it('logs a client event', () => {
    expect(events).toEqual([
      { error: expect.any(Error) as unknown, event: 'error' },
    ]);
  });
});
