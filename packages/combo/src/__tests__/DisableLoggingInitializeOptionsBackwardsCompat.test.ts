import 'jest-fetch-mock';

import { StatsigClient } from '@statsig/js-client';

jest.mock('@statsig/client-core', () => {
  const actual = jest.requireActual('@statsig/client-core');
  return {
    ...actual,
    _isServerEnv: () => false,
  };
});

function getLogEventCalls(): typeof fetchMock.mock.calls {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).includes('rgstr'),
  );
}

describe('DisableLogging Initialization Time', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it('backwards compatible to the old logging option at initialize time', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      {
        disableLogging: true,
      },
    );

    client.initializeSync();
    client.logEvent('test-event111');

    await client.flush();
    expect(getLogEventCalls()).toHaveLength(0);
  });
});
