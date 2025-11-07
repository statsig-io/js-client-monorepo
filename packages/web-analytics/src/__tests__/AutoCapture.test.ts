import fetchMock from 'jest-fetch-mock';
import { nullthrows } from 'statsig-test-helpers';

import { _getStatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { AutoCapture, runStatsigAutoCapture } from '../AutoCapture';
import {
  getLastPageViewEndEvent,
  getLastPageViewEvent,
  getLastPerformanceEvent,
  getLastSessionStartEvent,
} from './utils';

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
    autoCapture = nullthrows(runStatsigAutoCapture(client));
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

  it('page_view_end has correct meaningfulEngagementOccurred flag when outbound link was clicked', async () => {
    autoCapture['_hasLoggedPageViewEnd'] = false;

    // Create an outbound link element
    const outboundLink = document.createElement('a');
    outboundLink.setAttribute('href', 'https://example.com');
    outboundLink.textContent = 'External Link';
    document.body.appendChild(outboundLink);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    outboundLink.dispatchEvent(clickEvent);

    autoCapture['_tryLogPageViewEnd'](false);
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEndEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view_end');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: expect.any(String),
      meaningfulEngagementOccurred: true,
    });

    document.body.removeChild(outboundLink);
  });

  it('page_view_end has correct meaningfulEngagementOccurred flag when statsig-ctr-capture element was clicked', async () => {
    autoCapture['_hasLoggedPageViewEnd'] = false;

    // Create a button with statsig-ctr-capture class
    const ctrButton = document.createElement('button');
    ctrButton.className = 'btn statsig-ctr-capture primary';
    ctrButton.textContent = 'CTR Button';
    document.body.appendChild(ctrButton);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    ctrButton.dispatchEvent(clickEvent);

    autoCapture['_tryLogPageViewEnd'](false);
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEndEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view_end');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: expect.any(String),
      meaningfulEngagementOccurred: true,
    });

    document.body.removeChild(ctrButton);
  });

  it('page_view_end has correct meaningfulEngagementOccurred flag when no outbound link was clicked', async () => {
    autoCapture['_hasLoggedPageViewEnd'] = false;

    const internalLink = document.createElement('a');
    internalLink.setAttribute('href', window.location.href + '/some-page');
    internalLink.textContent = 'Internal Link';
    document.body.appendChild(internalLink);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    internalLink.dispatchEvent(clickEvent);

    autoCapture['_tryLogPageViewEnd'](false);
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEndEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view_end');
    expect(eventData['metadata']).toMatchObject({
      sessionID: expect.any(String),
      page_url: expect.any(String),
      meaningfulEngagementOccurred: false,
    });

    document.body.removeChild(internalLink);
  });
});
