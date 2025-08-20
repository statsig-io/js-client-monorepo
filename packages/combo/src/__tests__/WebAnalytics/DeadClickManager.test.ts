import fetchMock from 'jest-fetch-mock';

import { StatsigClient, _getStatsigGlobal } from '@statsig/js-client';
import {
  AutoCaptureEventName,
  runStatsigAutoCapture,
} from '@statsig/web-analytics';
import { DeadClickConfig } from '@statsig/web-analytics/src/DeadClickManager';

describe('DeadClickManager', () => {
  let client: StatsigClient;
  const requestDataList: Record<string, any>[] = [];
  let deadClickResolver: ((v: unknown) => void) | null = null;

  function getLastDeadClickEvent(
    requests: Record<string, any>[],
  ): Record<string, any> {
    for (let ii = requests.length - 1; ii >= 0; ii--) {
      const req = requests[ii];
      if (req['events']) {
        for (let jj = req['events'].length - 1; jj >= 0; jj--) {
          const evt = req['events'][jj];
          if (evt.eventName === AutoCaptureEventName.DEAD_CLICK) {
            return evt as Record<string, any>;
          }
        }
      }
    }
    return {};
  }

  function getAllDeadClickEvents(
    requests: Record<string, any>[],
  ): Record<string, any>[] {
    const events: Record<string, any>[] = [];
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      if (req['events']) {
        for (let j = 0; j < req['events'].length; j++) {
          const evt = req['events'][j];
          if (evt.eventName === AutoCaptureEventName.DEAD_CLICK) {
            events.push(evt as Record<string, any>);
          }
        }
      }
    }
    return events;
  }

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.DEAD_CLICK) {
            deadClickResolver && deadClickResolver(null);
            deadClickResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    Object.defineProperty(window, 'innerWidth', {
      value: 4000,
      writable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 2000,
      writable: true,
    });
  });

  beforeEach(async () => {
    fetchMock.resetMocks();
    DeadClickConfig.CLICK_CHECK_TIMEOUT = 25;
    DeadClickConfig.SCROLL_DELAY_MS = 25;
    DeadClickConfig.SELECTION_CHANGE_DELAY_MS = 25;
    DeadClickConfig.MUTATION_DELAY_MS = 25;
    DeadClickConfig.ABSOLUTE_DEAD_CLICK_TIMEOUT = 30;

    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.DEAD_CLICK) {
            deadClickResolver && deadClickResolver(null);
            deadClickResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com',
        protocol: 'https:',
      },
      writable: true,
    });

    client = new StatsigClient(
      'client-key',
      { userID: 'test-user' },
      {
        loggingIntervalMs: 100,
      },
    );
    await client.initializeAsync();
    _getStatsigGlobal().acInstances = {};

    jest.clearAllMocks();
    requestDataList.length = 0;
    deadClickResolver = null;
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
    deadClickResolver = null;
  });

  it('should detect dead click when no scroll, selection change, or mutation occurs', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    runStatsigAutoCapture(client);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    div.dispatchEvent(clickEvent);

    await new Promise((f) => {
      deadClickResolver = f;
    });

    const eventData = getLastDeadClickEvent(requestDataList);
    expect(eventData['eventName']).toBe(AutoCaptureEventName.DEAD_CLICK);
    expect(eventData['metadata']).toMatchObject({
      scrollTimeout: false,
      selectionChangeTimeout: false,
      mutationTimeout: false,
      absoluteTimeout: true,
    });
  });

  it('should not detect dead click when scroll occurs quickly', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    runStatsigAutoCapture(client);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    div.dispatchEvent(clickEvent);

    await new Promise((resolve) => setTimeout(resolve, 1));
    const scrollEvent = new Event('scroll', { bubbles: true });
    window.dispatchEvent(scrollEvent);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const eventData = getAllDeadClickEvents(requestDataList);
    expect(eventData).toHaveLength(0);
  });

  it('should not detect dead click when selection change occurs quickly', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    runStatsigAutoCapture(client);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    div.dispatchEvent(clickEvent);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const selectionEvent = new Event('selectionchange', { bubbles: true });
    window.dispatchEvent(selectionEvent);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const eventData = getAllDeadClickEvents(requestDataList);
    expect(eventData).toHaveLength(0);
  });

  it('should not detect dead click when mutation occurs quickly', async () => {
    runStatsigAutoCapture(client);

    const button = document.createElement('button');
    document.body.appendChild(button);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    button.dispatchEvent(clickEvent);

    await new Promise((resolve) => setTimeout(resolve, 1));

    const newElement = document.createElement('span');
    newElement.textContent = 'New element';
    button.appendChild(newElement);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const eventData = getAllDeadClickEvents(requestDataList);
    expect(eventData).toHaveLength(0);
  });

  it('should not track clicks on interactive elements', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    runStatsigAutoCapture(client);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    button.dispatchEvent(clickEvent);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const eventData = getAllDeadClickEvents(requestDataList);
    expect(eventData).toHaveLength(0);
  });

  it('should include proper metadata in dead click events', async () => {
    const div = document.createElement('div');
    div.textContent = 'Test Div';
    div.className = 'test-div';
    div.id = 'test-div-id';
    document.body.appendChild(div);

    runStatsigAutoCapture(client);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    div.dispatchEvent(clickEvent);

    await new Promise((f) => {
      deadClickResolver = f;
    });

    const eventData = getLastDeadClickEvent(requestDataList);
    expect(eventData['eventName']).toBe(AutoCaptureEventName.DEAD_CLICK);
    expect(eventData['metadata']).toMatchObject({
      scrollTimeout: false,
      selectionChangeTimeout: false,
      mutationTimeout: false,
      absoluteTimeout: true,
      absoluteDelayMs: expect.any(Number), // other delays are undefined
      tagName: 'div',
      selector: expect.any(String),
      classList: expect.any(Array),
      class: 'test-div',
      id: 'test-div-id',
    });
  });
});
