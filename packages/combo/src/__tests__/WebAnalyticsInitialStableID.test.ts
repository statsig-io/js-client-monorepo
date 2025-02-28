import fetchMock from 'jest-fetch-mock';

import { StatsigClient, StatsigUser } from '@statsig/js-client';
import {
  StatsigAutoCapturePlugin,
  runStatsigAutoCapture,
} from '@statsig/web-analytics';

describe('Plugin Stable ID Override Tests', () => {
  let client: StatsigClient;
  const user: StatsigUser = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterAll(async () => {
    await client.shutdown();
    fetchMock.mockClear();
  });

  it('Run auto capture includes initial user stable Id', async () => {
    client = new StatsigClient('client-key', user);
    runStatsigAutoCapture(client);
    await client.initializeAsync();

    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;
    expect(body.events).toHaveLength(1);

    const event = body.events[0];
    expect(event.eventName).toEqual('auto_capture::page_view');
    expect(event.user?.customIDs?.stableID).toEqual('a-stable-id');
    expect(body?.statsigMetadata?.stableID).toEqual('a-stable-id');
  });

  it('Auto capture plugin includes initial user stable Id', async () => {
    client = new StatsigClient('client-key', user, {
      plugins: [new StatsigAutoCapturePlugin()],
    });
    await client.initializeAsync();

    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;
    expect(body.events).toHaveLength(1);

    const event = body.events[0];
    expect(event.eventName).toEqual('auto_capture::page_view');
    expect(event.user?.customIDs?.stableID).toEqual('a-stable-id');
    expect(body?.statsigMetadata?.stableID).toEqual('a-stable-id');
  });
});
