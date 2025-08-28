import fetchMock from 'jest-fetch-mock';

import {
  LogEventCompressionMode,
  StatsigClient,
  StatsigUser,
  _getStatsigGlobal,
} from '@statsig/js-client';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

describe('AnalyticsOnlyMetadata', () => {
  let client: StatsigClient;

  const user: StatsigUser = {
    userID: 'a-user',
  };
  const firstTouchMetadata = {
    $s_utm_source: 'source',
    $s_utm_medium: 'medium',
    $s_utm_campaign: 'campaign',
    $s_utm_term: 'term',
    $s_utm_content: 'content',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    _getStatsigGlobal().acInstances = {};
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/?utm_source=source&utm_medium=medium&utm_campaign=campaign&utm_term=term&utm_content=content',
      },
      writable: true,
    });
  });

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should add analytics only metadata to the user in log event', async () => {
    client = new StatsigClient('client-key', user, {
      logEventCompressionMode: LogEventCompressionMode.Disabled,
    });
    await client.initializeAsync();

    client.updateUserWithAnalyticsOnlyMetadata({
      test: 'test',
    });

    client.logEvent('custom_event', 1, {
      event_metadata: 'metadata',
    });

    await client.flush();

    const request = fetchMock.mock.calls[1];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;
    expect(body.events).toHaveLength(2);

    const customEvent = body.events[1];
    expect(customEvent.user.analyticsOnlyMetadata.test).toEqual('test');
  });

  it('should add first touch metadata to the user in auto capture', async () => {
    client = new StatsigClient('client-key', user, {
      logEventCompressionMode: LogEventCompressionMode.Disabled,
    });
    runStatsigAutoCapture(client);
    await client.initializeAsync();

    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;
    expect(body.events).toHaveLength(1);

    const event = body.events[0];
    expect(event.eventName).toEqual('auto_capture::page_view');
    expect(event.user?.analyticsOnlyMetadata).toEqual({
      ...firstTouchMetadata,
    });
  });

  it('saves first touch metadata even if updateUserWithAnalyticsOnlyMetadata is called', async () => {
    client = new StatsigClient('client-key', user, {
      logEventCompressionMode: LogEventCompressionMode.Disabled,
      disableStatsigEncoding: true,
    });
    runStatsigAutoCapture(client);
    await client.initializeAsync();

    client.updateUserWithAnalyticsOnlyMetadata({
      test: 'test',
    });

    client.logEvent('custom_event', 1, {
      event_metadata: 'metadata',
    });

    await client.flush();

    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;
    expect(body.events).toHaveLength(1);

    const pageViewEvent = body.events[0];
    expect(pageViewEvent.user?.analyticsOnlyMetadata).toEqual({
      ...firstTouchMetadata,
    });

    const lastLogEventRequest =
      fetchMock.mock.calls[fetchMock.mock.calls.length - 1]; // page_view flush, session start flush, initialize request, all events flush
    const lastLogEventBody = JSON.parse(
      String(lastLogEventRequest[1]?.body ?? ''),
    ) as any;

    const customEvent = lastLogEventBody.events[1];
    expect(customEvent.eventName).toEqual('custom_event');
    expect(customEvent.user?.analyticsOnlyMetadata).toEqual({
      ...firstTouchMetadata,
      test: 'test',
    });
  });

  it('should retain first touch metadata after update user', async () => {
    client = new StatsigClient('client-key', user, {
      logEventCompressionMode: LogEventCompressionMode.Disabled,
    });
    runStatsigAutoCapture(client);
    await client.initializeAsync();

    client.updateUserSync(
      {
        userID: 'b-user',
      },
      { disableBackgroundCacheRefresh: true },
    );

    client.logEvent('custom_event', 1, {
      event_metadata: 'metadata',
    });

    await client.flush();

    const request = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;

    const customEvent = body.events.find(
      (event: any) => event.eventName === 'custom_event',
    );
    expect(customEvent.eventName).toEqual('custom_event');
    expect(customEvent.user.userID).toEqual('b-user');
    expect(customEvent.user?.analyticsOnlyMetadata).toEqual({
      ...firstTouchMetadata,
    });
  });

  it('should not attach analytics only metadata to the user if no first touch metadata is present', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com',
      },
      writable: true,
    });

    client = new StatsigClient('client-key', user, {
      logEventCompressionMode: LogEventCompressionMode.Disabled,
    });
    runStatsigAutoCapture(client);
    await client.initializeAsync();

    client.logEvent('custom_event', 1, {
      event_metadata: 'metadata',
    });

    await client.flush();

    const request = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const body = JSON.parse(String(request[1]?.body ?? '')) as any;

    const customEvent = body.events.find(
      (event: any) => event.eventName === 'custom_event',
    );
    expect(customEvent.eventName).toEqual('custom_event');
    expect(customEvent.user.userID).toEqual('a-user');
    expect(customEvent.user.analyticsOnlyMetadata).toBeUndefined();
  });
});
