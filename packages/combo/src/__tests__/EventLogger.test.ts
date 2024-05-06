import 'jest-fetch-mock';
import { anyObject, anyStringContaining } from 'statsig-test-helpers';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

const timeout = async (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

describe('Event Logger', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it('does not immediately flush logged events', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      { loggingIntervalMs: 999, loggingBufferMaxSize: 999 },
    );

    client.logEvent('one');
    await timeout(2);

    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it('calls flush on a set interval', async () => {
    const client = new StatsigClient('my-key', {}, { loggingIntervalMs: 1 });

    client.logEvent('one');
    await timeout(2);

    expect(fetchMock.mock.calls[0]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);

    client.logEvent('two');
    await timeout(2);

    expect(fetchMock.mock.calls[1]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);
  });

  it('flushes when backgrounded', async () => {
    const client = new StatsigClient('my-key', {}, { loggingIntervalMs: 1 });

    client.logEvent('one');

    _notifyVisibilityChanged('background');
    await timeout(1);

    expect(fetchMock.mock.calls[0]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);
  });
});
