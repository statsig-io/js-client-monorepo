import { StatsigClient } from '@statsig/js-client';

import { runStatsigAutoCapture } from '../AutoCapture';
import { AutoCaptureEventName } from '../AutoCaptureEvent';

describe('AutoCaptureFiltering', () => {
  let client: StatsigClient;
  let spy: jest.Mock;

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    client = new StatsigClient('client-key', { userID: 'a-user' });
    spy = jest.fn();
    client.logEvent = spy;
  });

  it('filters out events', () => {
    runStatsigAutoCapture(client, {
      eventFilterFunc: (event) =>
        event.eventName !== AutoCaptureEventName.SESSION_START &&
        event.eventName !== AutoCaptureEventName.PAGE_VIEW,
    });

    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('includes only allowed events', () => {
    runStatsigAutoCapture(client, {
      eventFilterFunc: (event) =>
        event.eventName === AutoCaptureEventName.SESSION_START ||
        event.eventName === AutoCaptureEventName.PAGE_VIEW,
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('includes duplicate page views when no filter is provided', () => {
    runStatsigAutoCapture(client);

    spy.mockClear();

    window.history.pushState({}, '', '/my_path');
    window.history.pushState({}, '', '/my_path?again=1');

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('filters out duplicate page views when a filter is provided', () => {
    const seen: Record<string, boolean> = {};

    runStatsigAutoCapture(client, {
      eventFilterFunc: (event) => {
        if (event.eventName !== AutoCaptureEventName.PAGE_VIEW) {
          return true;
        }

        if (event.metadata && typeof event.metadata['page_url'] === 'string') {
          const url = new URL(event.metadata['page_url']);
          if (seen[url.pathname]) {
            return false;
          }

          seen[url.pathname] = true;
        }

        return true;
      },
    });

    spy.mockClear();

    window.history.pushState({}, '', '/my_path');
    window.history.pushState({}, '', '/my_path?again=1');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'auto_capture::page_view',
        value: 'http://localhost/my_path',
      }),
    );
  });
});
