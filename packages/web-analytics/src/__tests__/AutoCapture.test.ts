import fetchMock from 'jest-fetch-mock';

import { _getStatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { AutoCapture, runStatsigAutoCapture } from '../AutoCapture';

function getLastEvent(
  requests: Record<string, any>[],
  eventName: string,
): Record<string, any> {
  for (let ii = requests.length - 1; ii >= 0; ii--) {
    const req = requests[ii];
    if (req['events']) {
      for (let jj = req['events'].length - 1; jj >= 0; jj--) {
        const evt = req['events'][jj];
        if (evt.eventName === eventName) {
          return evt as Record<string, any>;
        }
      }
    }
  }
  return {};
}

function getLastPageViewEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::page_view');
}

function getLastPageViewEndEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::page_view_end');
}

function getLastSessionStartEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::session_start');
}

function getLastPerformanceEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::performance');
}

Object.defineProperty(window, 'innerWidth', {
  value: 4000,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 2000,
  writable: true,
});

describe('Autocapture Tests', () => {
  let autoCapture: AutoCapture;
  let client: StatsigClient;
  let pageViewResolver: ((v: unknown) => void) | null = null;

  const requestDataList: Record<string, any>[] = [];
  const resetLastLoggedPageViewUrl = () => {
    autoCapture['_previousLoggedPageViewUrl'] = null;
  };

  beforeAll(async () => {
    __STATSIG__ = { ..._getStatsigGlobal(), 'no-encode': 1 };
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);
      pageViewResolver && pageViewResolver(null);
      pageViewResolver = null;
      return '{}';
    });

    client = new StatsigClient('client-key', { userID: '' });
    await client.initializeAsync();
    autoCapture = runStatsigAutoCapture(client);
  });

  beforeEach(() => {
    resetLastLoggedPageViewUrl();
    requestDataList.length = 0;
  });

  it('disabled the correct events', async () => {
    autoCapture['_disabledEvents'] = { page_view: true };

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
      writable: true,
    });

    autoCapture['_tryLogPageView']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData).toEqual({});

    autoCapture['_disabledEvents'] = {};
  });

  it('has the required fields', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
      writable: true,
    });

    autoCapture['_tryLogPageView']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('http://foo.com/');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: 'http://foo.com/',
      hostname: 'foo.com',
      pathname: '/',
      screen_width: 0,
      screen_height: 0,
      viewport_width: 4000,
      viewport_height: 2000,
      isNewSession: 'true',
    });
  });

  it('has the right utm fields', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/?utm_source=source&utm_medium=medium&utm_campaign=campaign&utm_term=term&utm_content=content',
      },
      writable: true,
    });

    autoCapture['_tryLogPageView']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['metadata']).toMatchObject({
      utm_source: 'source',
      utm_medium: 'medium',
      utm_campaign: 'campaign',
      utm_term: 'term',
      utm_content: 'content',
    });
  });

  it('has the right search engine fields', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
      writable: true,
    });
    const searchEngineInputs = [
      {
        referrer: 'https://www.google.com/?q=search_term',
        searchEngine: 'google',
      },
      {
        referrer: 'https://www.yahoo.com/?p=search_term',
        searchEngine: 'yahoo',
      },
      {
        referrer: 'https://bing.com/?q=search_term',
        searchEngine: 'bing',
      },
    ];

    for (const input of searchEngineInputs) {
      Object.defineProperty(document, 'referrer', {
        value: input.referrer,
        writable: true,
      });

      resetLastLoggedPageViewUrl();
      autoCapture['_tryLogPageView']();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((f) => {
        pageViewResolver = f;
      });

      const eventData = getLastPageViewEvent(requestDataList);
      expect(eventData['eventName']).toMatch('auto_capture::page_view');
      expect(eventData['metadata']).toMatchObject({
        searchEngine: input.searchEngine,
        searchQuery: 'search_term',
        referrer: input.referrer,
      });
    }
  });

  it('has the right ad conversion ids', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/?fbclid=facebook&gclid=google&li_fat_id=linedin',
      },
      writable: true,
    });

    autoCapture['_tryLogPageView']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['metadata']).toMatchObject({
      fbclid: 'facebook',
      gclid: 'google',
      li_fat_id: 'linedin',
    });
  });

  it('session_start has the required fields', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
      writable: true,
    });

    autoCapture['_logSessionStart']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastSessionStartEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::session_start');
    expect(eventData['value']).toMatch('http://foo.com/');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: 'http://foo.com/',
    });
  });

  it('performance has the network information fields if defined', async () => {
    const mockConnection = {
      downlink: 10,
      effectiveType: '4g',
      rtt: 100,
      saveData: false,
    };
    Object.defineProperty(window, 'navigator', {
      value: { connection: mockConnection },
      writable: true,
    });

    autoCapture['_logPerformance']();
    await new Promise((r) => setTimeout(r, 2));
    await client.flush();

    const eventData = getLastPerformanceEvent(requestDataList);
    const metadata = eventData['metadata'];
    expect(metadata['effective_connection_type']).toEqual('4g');
    expect(metadata['rtt_ms']).toEqual(100);
    expect(metadata['downlink_kbps']).toEqual(10000);
    expect(metadata['downlink_mbps']).toEqual(10);
    expect(metadata['save_data']).toEqual(false);
  });

  it('performance does not have the network information fields if not defined', async () => {
    Object.defineProperty(window, 'navigator', {
      value: undefined,
      writable: true,
    });
    autoCapture['_logPerformance']();

    await new Promise((r) => setTimeout(r, 2));
    await client.flush();

    const eventData = getLastPerformanceEvent(requestDataList);
    const metadata = eventData['metadata'];
    expect(metadata['effective_connection_type']).toBeUndefined();
    expect(metadata['rtt_ms']).toBeUndefined();
    expect(metadata['downlink_kbps']).toBeUndefined();
    expect(metadata['downlink_mbps']).toBeUndefined();
    expect(metadata['save_data']).toBeUndefined();
  });

  it('page_view_end has scroll information and page view length', async () => {
    Object.defineProperty(document.body, 'scrollHeight', {
      value: 4000,
      writable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      value: 1000,
      writable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    const fiveSecondsAgo = Date.now() - 5000;
    autoCapture['_engagementManager'].setLastPageViewTime(fiveSecondsAgo);

    autoCapture['_tryLogPageViewEnd']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEndEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view_end');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: expect.any(String),
      lastScrollPercentage: 75, // (1000 + 2000) / 4000 * 100 = 75%
      maxScrollPercentage: 75, // (1000 + 2000) / 4000 * 100 = 75%
      lastScrollY: 1000,
      maxScrollY: 1000,
      pageViewLength: expect.any(Number),
      dueToInactivity: false,
    });
  });

  it('page_view_end due to inactivity has correct flag', async () => {
    autoCapture['_hasLoggedPageViewEnd'] = false;
    Object.defineProperty(document.body, 'scrollHeight', {
      value: 4000,
      writable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      value: 1000,
      writable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    const fiveSecondsAgo = Date.now() - 5000;
    autoCapture['_engagementManager'].setLastPageViewTime(fiveSecondsAgo);

    autoCapture['_tryLogPageViewEnd'](true);
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEndEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view_end');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: expect.any(String),
      lastScrollPercentage: 75, // (1000 + 2000) / 4000 * 100 = 75%
      maxScrollPercentage: 75, // (1000 + 2000) / 4000 * 100 = 75%
      lastScrollY: 1000,
      maxScrollY: 1000,
      pageViewLength: expect.any(Number),
      dueToInactivity: true,
    });
  });
});
