import fetchMock from 'jest-fetch-mock';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { StatsigClient, _getStatsigGlobal } from '@statsig/js-client';
import {
  AutoCaptureEventName,
  runStatsigAutoCapture,
} from '@statsig/web-analytics';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

describe('WebVitalsManager', () => {
  let client: StatsigClient;
  const requestDataList: Record<string, any>[] = [];
  let webVitalsResolver: ((v: unknown) => void) | null = null;

  const mockMetric = {
    name: 'CLS' as const,
    value: 0.1,
    delta: 0.05,
    id: 'metric-1',
  };

  // Helper function to get callbacks after AutoCapture is initialized
  function getCallbacks() {
    const clsCalls = (onCLS as jest.Mock).mock.calls;
    const fcpCalls = (onFCP as jest.Mock).mock.calls;
    const inpCalls = (onINP as jest.Mock).mock.calls;
    const lcpCalls = (onLCP as jest.Mock).mock.calls;
    const ttfbCalls = (onTTFB as jest.Mock).mock.calls;

    return {
      clsCallback: clsCalls.length > 0 ? clsCalls[0][0] : jest.fn(),
      fcpCallback: fcpCalls.length > 0 ? fcpCalls[0][0] : jest.fn(),
      inpCallback: inpCalls.length > 0 ? inpCalls[0][0] : jest.fn(),
      lcpCallback: lcpCalls.length > 0 ? lcpCalls[0][0] : jest.fn(),
      ttfbCallback: ttfbCalls.length > 0 ? ttfbCalls[0][0] : jest.fn(),
    };
  }

  // Helper function to call the appropriate callback for a metric
  function callMetricCallback(metricName: string, metric: any) {
    const { clsCallback, fcpCallback, inpCallback, lcpCallback, ttfbCallback } =
      getCallbacks();

    switch (metricName) {
      case 'CLS':
        clsCallback(metric);
        break;
      case 'FCP':
        fcpCallback(metric);
        break;
      case 'INP':
        inpCallback(metric);
        break;
      case 'LCP':
        lcpCallback(metric);
        break;
      case 'TTFB':
        ttfbCallback(metric);
        break;
      default:
        throw new Error(`Unknown metric name: ${metricName}`);
    }
  }

  function getLastWebVitalEvent(
    requests: Record<string, any>[],
  ): Record<string, any> {
    for (let ii = requests.length - 1; ii >= 0; ii--) {
      const req = requests[ii];
      if (req['events']) {
        for (let jj = req['events'].length - 1; jj >= 0; jj--) {
          const evt = req['events'][jj];
          if (evt.eventName === AutoCaptureEventName.WEB_VITALS) {
            return evt as Record<string, any>;
          }
        }
      }
    }
    return {};
  }

  function triggerWebVitalsEnqueue() {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/new-url',
        protocol: 'https:',
      },
      writable: true,
    });

    callMetricCallback('CLS', { ...mockMetric, name: 'CLS' });
  }

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      // Check if any web vitals events were sent
      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.WEB_VITALS) {
            webVitalsResolver && webVitalsResolver(null);
            webVitalsResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    // Mock window and document
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
    // Reset fetch mock before each test
    fetchMock.resetMocks();
    fetchMock.mockResponse(async (r: Request) => {
      const reqData = (await r.json()) as Record<string, any>;
      requestDataList.push(reqData);

      // Check if any web vitals events were sent
      if (reqData['events']) {
        for (const evt of reqData['events']) {
          if (evt.eventName === AutoCaptureEventName.WEB_VITALS) {
            webVitalsResolver && webVitalsResolver(null);
            webVitalsResolver = null;
            break;
          }
        }
      }
      return '{}';
    });

    // Reset window location to default
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
        loggingBufferMaxSize: 1,
      },
    );
    await client.initializeAsync();
    _getStatsigGlobal().acInstances = {};

    jest.clearAllMocks();
    requestDataList.length = 0;
    webVitalsResolver = null;
  });

  afterEach(async () => {
    // Clean up client after each test
    if (client) {
      await client.shutdown();
    }
    // Reset any pending promises
    webVitalsResolver = null;
  });

  describe('WebVitalsManager Integration', () => {
    it('should register web vitals callbacks when AutoCapture is initialized', () => {
      runStatsigAutoCapture(client);

      expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(onFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onINP).toHaveBeenCalledWith(expect.any(Function));
      expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not register callbacks when protocol is not http or https', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'file://example.com',
          protocol: 'file:',
        },
        writable: true,
      });

      runStatsigAutoCapture(client);

      expect(onCLS).not.toHaveBeenCalled();
      expect(onFCP).not.toHaveBeenCalled();
      expect(onINP).not.toHaveBeenCalled();
      expect(onLCP).not.toHaveBeenCalled();
      expect(onTTFB).not.toHaveBeenCalled();
    });

    it('should ignore metrics when URL is empty', async () => {
      runStatsigAutoCapture(client);

      // Set empty URL
      Object.defineProperty(window, 'location', {
        value: {
          href: '',
          protocol: 'https:',
        },
        writable: true,
      });

      // Try to add metrics
      callMetricCallback('CLS', { ...mockMetric, name: 'CLS' });
      callMetricCallback('FCP', { ...mockMetric, name: 'FCP' });
      triggerWebVitalsEnqueue();

      await new Promise((f) => setTimeout(f, 150));

      // Should not send any events
      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toEqual({});
    });

    it('should ignore invalid metric names', async () => {
      runStatsigAutoCapture(client);

      callMetricCallback('CLS', { ...mockMetric, name: 'CLS' });
      callMetricCallback('FCP', { ...mockMetric, name: 'FCP' });
      callMetricCallback('LCP', { ...mockMetric, name: 'LCP' });
      callMetricCallback('TTFB', { ...mockMetric, name: 'INVALID' });
      triggerWebVitalsEnqueue();

      await new Promise((f) => {
        webVitalsResolver = f;
      });

      // Should not send any events
      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toBeDefined();
      expect(eventData['metadata'].cls_value).toBe(0.1);
      expect(eventData['metadata'].fcp_value).toBe(0.1);
      expect(eventData['metadata'].lcp_value).toBe(0.1);
      expect(eventData['metadata'].invalid_value).toBeUndefined();
    });

    it('should handle invalid URLs gracefully', async () => {
      runStatsigAutoCapture(client);

      // Set invalid URL
      Object.defineProperty(window, 'location', {
        value: {
          href: 'not-a-valid-url',
          protocol: 'https:',
        },
        writable: true,
      });

      // Try to add metrics
      callMetricCallback('CLS', { ...mockMetric, name: 'CLS' });
      callMetricCallback('FCP', { ...mockMetric, name: 'FCP' });

      // Should not send any events
      expect(requestDataList.length).toBe(0);
    });

    it('should batch enqueue metrics', async () => {
      runStatsigAutoCapture(client);

      callMetricCallback('CLS', { ...mockMetric, name: 'CLS', value: 0.1 });
      callMetricCallback('FCP', { ...mockMetric, name: 'FCP', value: 1200 });
      triggerWebVitalsEnqueue();

      await new Promise((f) => {
        webVitalsResolver = f;
      });

      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toBeDefined();
      expect(eventData['metadata'].cls_value).toBe(0.1);
      expect(eventData['metadata'].cls_delta).toBe(0.05);
      expect(eventData['metadata'].fcp_value).toBe(1200);
      expect(eventData['metadata'].fcp_delta).toBe(0.05);
    });

    it('should handle multiple metrics of the same type', async () => {
      runStatsigAutoCapture(client);

      // Add two CLS metrics (we send both)
      callMetricCallback('CLS', { ...mockMetric, name: 'CLS', value: 0.05 });
      callMetricCallback('CLS', { ...mockMetric, name: 'CLS', value: 0.15 });
      triggerWebVitalsEnqueue();

      await new Promise((f) => {
        webVitalsResolver = f;
      });

      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toBeDefined();
      expect(eventData['metadata'].cls_value).toBe(0.15);
    });

    it('should handle metric with more than required properties', async () => {
      runStatsigAutoCapture(client);

      const fullMetric = {
        name: 'CLS' as const,
        value: 0.25,
        delta: 0.1,
        id: 'metric-123',
        entries: [{ startTime: 1000, value: 0.25 }],
        navigationType: 'navigate',
      };

      callMetricCallback('CLS', fullMetric);
      triggerWebVitalsEnqueue();

      await new Promise((f) => {
        webVitalsResolver = f;
      });
      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toBeDefined();

      expect(eventData['metadata'].cls_value).toBe(0.25);
      expect(eventData['metadata'].cls_delta).toBe(0.1);
      expect(eventData['metadata'].cls_id).toBe('metric-123');
    });

    it('should handle metrics with less than required properties on page change', async () => {
      runStatsigAutoCapture(client);

      const metricWithEmptyEntries = {
        name: 'FCP' as const,
        value: 1200,
        id: 'metric-456',
      };

      callMetricCallback('FCP', metricWithEmptyEntries);
      triggerWebVitalsEnqueue();

      await new Promise((f) => {
        webVitalsResolver = f;
      });

      const eventData = getLastWebVitalEvent(requestDataList);
      expect(eventData).toBeDefined();

      expect(eventData['metadata'].fcp_value).toBe(1200);
      expect(eventData['metadata'].fcp_delta).toBeUndefined();
      expect(eventData['metadata'].fcp_id).toBe('metric-456');
    });
  });

  it('should only initialize web vitals listeners once on the same client', async () => {
    const client = new StatsigClient('client-key', { userID: 'test-user' });

    (onCLS as jest.Mock).mockClear();
    (onFCP as jest.Mock).mockClear();
    (onINP as jest.Mock).mockClear();
    (onLCP as jest.Mock).mockClear();
    (onTTFB as jest.Mock).mockClear();

    runStatsigAutoCapture(client);
    runStatsigAutoCapture(client);

    expect(onCLS).toHaveBeenCalledTimes(1);
    expect(onFCP).toHaveBeenCalledTimes(1);
    expect(onINP).toHaveBeenCalledTimes(1);
    expect(onLCP).toHaveBeenCalledTimes(1);
    expect(onTTFB).toHaveBeenCalledTimes(1);
  });
});
