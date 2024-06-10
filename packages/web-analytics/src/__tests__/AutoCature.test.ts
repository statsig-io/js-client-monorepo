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

function getLastSessionStartEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::session_start');
}

describe('Autocapture Tests', () => {
  let autoCapture: AutoCapture;
  let pageViewResolver: ((v: unknown) => void) | null = null;
  const requestDataList: Record<string, any>[] = [];

  beforeAll(async () => {
    __STATSIG__ = { ..._getStatsigGlobal(), 'no-encode': 1 };
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);
      pageViewResolver && pageViewResolver(null);
      pageViewResolver = null;
      return '{}';
    });

    const client = new StatsigClient('client-key', { userID: '' });
    autoCapture = runStatsigAutoCapture(client);
    await client.initializeAsync();
  });

  beforeEach(() => {
    requestDataList.length = 0;
  });

  it('has the required fields', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
      writable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 4000,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 2000,
      writable: true,
    });
    autoCapture['_logPageView']();
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('http://foo.com/');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: 'http://foo.com/',
      referrer: '',
      screen_width: 'unknown',
      screen_height: 'unknown',
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

    autoCapture['_logPageView']();
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

      autoCapture['_logPageView']();
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

    autoCapture['_logPageView']();
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
});
