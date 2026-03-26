import { _getStatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { AutoCapture, runStatsigAutoCapture } from '../AutoCapture';
import { AutoCaptureEventName } from '../AutoCaptureEvent';

describe('AutoCaptureFiltering', () => {
  let client: StatsigClient;
  let spy: jest.Mock;
  let flushSpy: jest.Mock;

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    client = new StatsigClient('client-key', { userID: 'a-user' });
    _getStatsigGlobal().acInstances = {};
    spy = jest.fn();
    flushSpy = jest.fn().mockResolvedValue(undefined);
    client.logEvent = spy;
    client.flush = flushSpy;
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

  it('flushes pending web vitals even when page view events are filtered out', () => {
    const autoCapture = runStatsigAutoCapture(client, {
      eventFilterFunc: (event) =>
        event.eventName === AutoCaptureEventName.WEB_VITALS,
    }) as AutoCapture;

    autoCapture['_webVitalsManager']['_metricEvent'] = {
      url: 'http://localhost/',
      sanitizedUrl: 'http://localhost/',
      metrics: [
        {
          name: 'FCP',
          value: 123,
          delta: 123,
          id: 'fcp-id',
        },
      ],
      firstMetricTimestamp: 1,
    };

    autoCapture['_tryLogPageViewEnd']();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: AutoCaptureEventName.WEB_VITALS,
        metadata: expect.objectContaining({
          fcp_value: 123,
        }),
      }),
    );
    expect(flushSpy).toHaveBeenCalled();
  });
});
