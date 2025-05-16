/**
 * @jest-environment node
 */
import fetchMock from 'jest-fetch-mock';

import { StatsigClient } from '@statsig/js-client';

fetchMock.enableMocks();

function getLogEventCalls(): typeof fetchMock.mock.calls {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).includes('rgstr'),
  );
}

describe('Event Logger Non Browser', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it("doesn't log in server environments by default", async () => {
    const client = new StatsigClient('my-key', {}, {});
    client.initializeSync();

    client.logEvent('electron-app-event-dropped');
    await client.flush();

    expect(getLogEventCalls()).toHaveLength(0);
  });

  it('does log in server environments when option set to always', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      { loggingEnabled: 'always' },
    );
    client.initializeSync();

    client.logEvent('electron-app-event-logged');
    await client.flush();

    expect(getLogEventCalls()).toHaveLength(1);
  });
});
