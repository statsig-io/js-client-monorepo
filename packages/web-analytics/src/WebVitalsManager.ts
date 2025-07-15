import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

import { _getWindowSafe } from '@statsig/client-core';

import { AutoCaptureEventName } from './AutoCaptureEvent';
import { _getSafeUrlString } from './utils/commonUtils';

const VALID_METRIC_NAMES = ['CLS', 'FCP', 'LCP', 'TTFB'];

type WebVitalsMetric = {
  name: 'CLS' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
};

export class WebVitalsManager {
  private _isInitialized = false;
  constructor(
    private _enqueueFn: (
      eventName: AutoCaptureEventName,
      value: string,
      metadata: Record<string, unknown>,
    ) => void,
  ) {}

  public startTracking(): void {
    if (this._isInitialized) {
      return;
    }

    const protocol = _getWindowSafe()?.location?.protocol;
    if (protocol !== 'https:' && protocol !== 'http:') {
      return;
    }

    onCLS((metric) => this._handleMetric(metric));
    onFCP((metric) => this._handleMetric(metric));
    onLCP((metric) => this._handleMetric(metric));
    onTTFB((metric) => this._handleMetric(metric));
    this._isInitialized = true;
  }

  private _handleMetric(metric: unknown): void {
    if (metric === undefined || (metric as any)?.name === undefined) {
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

    this._enqueueWebVitalsAutoCaptureEvent(
      metric as WebVitalsMetric,
      currentUrl,
    );
  }

  private _enqueueWebVitalsAutoCaptureEvent(
    metric: WebVitalsMetric,
    url: string,
  ): void {
    if (url === '') {
      return;
    }

    this._enqueueFn(AutoCaptureEventName.WEB_VITALS, url, {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
    });
  }
}
