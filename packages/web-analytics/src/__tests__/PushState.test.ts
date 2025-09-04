import fetchMock from 'jest-fetch-mock';

import { _getStatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { runStatsigAutoCapture } from '../AutoCapture';
import { getLastPageViewEvent } from './utils';

describe('PushState Tests', () => {
  let client: StatsigClient;
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

    client = new StatsigClient('client-key', { userID: '123' });
    await client.initializeAsync();
    runStatsigAutoCapture(client);
  });

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    requestDataList.length = 0;
  });

  it('logs page view when pushState is called', async () => {
    window.history.pushState({}, '', '/new-page');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/new-page');
    expect(eventData['metadata']).toMatchObject({
      page_url: expect.stringContaining('/new-page'),
    });
  });

  it('logs page view when replaceState is called', async () => {
    window.history.replaceState({}, '', '/replaced-page');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/replaced-page');
    expect(eventData['metadata']).toMatchObject({
      page_url: expect.stringContaining('/replaced-page'),
    });
  });

  it('handles multiple consecutive pushState calls', async () => {
    requestDataList.length = 0;
    window.history.pushState({}, '', '/page1');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    window.history.pushState({}, '', '/page2');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    window.history.pushState({}, '', '/page3');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const pageViewEvents = requestDataList.flatMap(
      (req) =>
        req['events']?.filter(
          (event: any) => event.eventName === 'auto_capture::page_view',
        ) || [],
    );

    expect(pageViewEvents.length).toBeGreaterThanOrEqual(3);
    expect(pageViewEvents[0].value).toContain('/page1');
    expect(pageViewEvents[1].value).toContain('/page2');
    expect(pageViewEvents[2].value).toContain('/page3');
  });
  it('handles pushState with custom state object', async () => {
    const customState = { userId: '123', page: 'dashboard' };
    window.history.pushState(customState, 'Dashboard', '/dashboard');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/dashboard');
    expect(eventData['metadata']).toMatchObject({
      page_url: expect.stringContaining('/dashboard'),
    });
  });

  it('handles pushState with query parameters', async () => {
    requestDataList.length = 0;
    window.history.pushState({}, '', '/search?q=test&page=1');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/search');
    expect(eventData['metadata']).toMatchObject({
      page_url: expect.stringContaining('/search?q=test&page=1'),
      q: 'test',
      page: '1',
    });
  });

  it('handles pushState with hash fragments', async () => {
    window.history.pushState({}, '', '/page#section1');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/page');
    expect(eventData['metadata']).toMatchObject({
      page_url: expect.stringContaining('/page#section1'),
    });
  });

  it('maintains proxy after multiple AutoCapture instances', async () => {
    const client2 = new StatsigClient('client-key-2', {
      userID: 'another-user',
    });
    await client2.initializeAsync();
    runStatsigAutoCapture(client2);

    requestDataList.length = 0;

    window.history.pushState({}, '', '/test-page');

    await new Promise((f) => {
      pageViewResolver = f;
    });

    const eventData = getLastPageViewEvent(requestDataList);
    expect(eventData['eventName']).toMatch('auto_capture::page_view');
    expect(eventData['value']).toMatch('/test-page');

    await client2.shutdown();
  });

  it('does not log pageview for same path with different URL parameters', async () => {
    requestDataList.length = 0;

    window.history.pushState({}, '', '/search');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const firstEventData = getLastPageViewEvent(requestDataList);
    expect(firstEventData['eventName']).toMatch('auto_capture::page_view');
    expect(firstEventData['value']).toMatch('/search');

    requestDataList.length = 0;

    window.history.pushState({}, '', '/search?q=test&page=1');

    await new Promise((resolve) => setTimeout(resolve, 100));

    const pageViewEvent = getLastPageViewEvent(requestDataList);
    expect(pageViewEvent).toEqual({});
  });

  it('does not log pageview for same path with different hash fragments', async () => {
    requestDataList.length = 0;

    window.history.pushState({}, '', '/page');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const firstEventData = getLastPageViewEvent(requestDataList);
    expect(firstEventData['eventName']).toMatch('auto_capture::page_view');
    expect(firstEventData['value']).toMatch('/page');

    requestDataList.length = 0;

    window.history.pushState({}, '', '/page#section1');

    await new Promise((resolve) => setTimeout(resolve, 100));

    const pageViewEvent = getLastPageViewEvent(requestDataList);
    expect(pageViewEvent).toEqual({});
  });

  it('does not log pageview for same path with both query params and hash changes', async () => {
    requestDataList.length = 0;

    window.history.pushState({}, '', '/dashboard');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const firstEventData = getLastPageViewEvent(requestDataList);
    expect(firstEventData['eventName']).toMatch('auto_capture::page_view');
    expect(firstEventData['value']).toMatch('/dashboard');

    requestDataList.length = 0;

    window.history.pushState(
      {},
      '',
      '/dashboard?tab=settings&view=grid#profile',
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const pageViewEvent = getLastPageViewEvent(requestDataList);
    expect(pageViewEvent).toEqual({});
  });

  it('logs pageview when pathname actually changes', async () => {
    requestDataList.length = 0;

    window.history.pushState({}, '', '/search');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const firstEventData = getLastPageViewEvent(requestDataList);
    expect(firstEventData['eventName']).toMatch('auto_capture::page_view');
    expect(firstEventData['value']).toMatch('/search');

    requestDataList.length = 0;

    window.history.pushState({}, '', '/results');
    await new Promise((f) => {
      pageViewResolver = f;
    });

    const secondEventData = getLastPageViewEvent(requestDataList);
    expect(secondEventData['eventName']).toMatch('auto_capture::page_view');
    expect(secondEventData['value']).toMatch('/results');
  });
});
