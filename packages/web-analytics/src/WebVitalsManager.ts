import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { ErrorBoundary, Log, _getWindowSafe } from '@statsig/client-core';

import { AutoCaptureEventName } from './AutoCaptureEvent';
import { _getSafeUrlString, _getSanitizedPageUrl } from './utils/commonUtils';

const VALID_METRIC_NAMES = ['CLS', 'FCP', 'INP', 'LCP', 'TTFB'];

type WebVitalsMetric = {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
};

export class WebVitalsManager {
  private _isInitialized = false;
  private _metricEvent: {
    url: string;
    sanitizedUrl: string;
    metrics: WebVitalsMetric[];
    firstMetricTimestamp: number | undefined;
  };

  constructor(
    private _enqueueFn: (
      eventName: AutoCaptureEventName,
      value: string,
      metadata: Record<string, unknown>,
    ) => void,
    private _errorBoundary: ErrorBoundary,
  ) {
    this._metricEvent = {
      url: _getSafeUrlString(),
      sanitizedUrl: _getSanitizedPageUrl(),
      metrics: [],
      firstMetricTimestamp: undefined,
    };
  }

  public startTracking(): void {
    try {
      if (this._isInitialized) {
        return;
      }

      const protocol = _getWindowSafe()?.location?.protocol;
      if (protocol !== 'https:' && protocol !== 'http:') {
        return;
      }

      onCLS((metric) => this._handleMetric(metric));
      onFCP((metric) => this._handleMetric(metric));
      onINP((metric) => this._handleMetric(metric));
      onLCP((metric) => this._handleMetric(metric));
      onTTFB((metric) => this._handleMetric(metric));

      this._isInitialized = true;
    } catch (error) {
      Log.error('Error starting web vitals tracking', error);
      this._errorBoundary.logError('autoCapture:WebVitalsManager', error);
    }
  }

  private _handleMetric(metric: unknown): void {
    if (this._metricEvent.firstMetricTimestamp === undefined) {
      this._metricEvent.firstMetricTimestamp = Date.now();
    }

    if (
      metric === undefined ||
      (metric as WebVitalsMetric)?.name === undefined
    ) {
      return;
    }

    const currentUrl = _getSafeUrlString();

    if (currentUrl === '') {
      // If the URL is not valid, we don't want to track the metric
      return;
    }

    if (!VALID_METRIC_NAMES.includes((metric as WebVitalsMetric).name)) {
      return;
    }

    if (currentUrl !== this._metricEvent.url) {
      this._enqueueWebVitalsAutoCaptureEvent();
      this._metricEvent.url = currentUrl;
    }

    const metricData = metric as WebVitalsMetric;

    this._metricEvent.metrics.push({
      name: metricData.name,
      value: metricData.value,
      delta: metricData.delta,
      id: metricData.id,
    });

    if (this._metricEvent.metrics.length === VALID_METRIC_NAMES.length) {
      this._enqueueWebVitalsAutoCaptureEvent();
    }
  }

  private _enqueueWebVitalsAutoCaptureEvent(): void {
    if (
      this._metricEvent.url === '' ||
      this._metricEvent.metrics.length === 0
    ) {
      return;
    }

    const flattenedMetrics: Record<string, unknown> = {};

    this._metricEvent.metrics.forEach((metric) => {
      const prefix = metric.name.toLowerCase();
      flattenedMetrics[`${prefix}_value`] = metric.value;
      flattenedMetrics[`${prefix}_delta`] = metric.delta;
      flattenedMetrics[`${prefix}_id`] = metric.id;
    });

    this._enqueueFn(
      AutoCaptureEventName.WEB_VITALS,
      this._metricEvent.sanitizedUrl,
      {
        ...flattenedMetrics,
        first_metric_timestamp: this._metricEvent.firstMetricTimestamp,
      },
    );

    this._metricEvent = {
      url: _getSafeUrlString(),
      sanitizedUrl: _getSanitizedPageUrl(),
      metrics: [],
      firstMetricTimestamp: undefined,
    };
  }
}
