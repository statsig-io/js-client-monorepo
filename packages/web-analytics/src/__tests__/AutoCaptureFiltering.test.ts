import { _getStatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { runStatsigAutoCapture } from '../AutoCapture';
import { AutoCaptureEventName } from '../AutoCaptureEvent';

describe('AutoCaptureFiltering', () => {
  let client: StatsigClient;
  let spy: jest.Mock;

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    client = new StatsigClient('client-key', { userID: 'a-user' });
    _getStatsigGlobal().acInstances = {};
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
});
