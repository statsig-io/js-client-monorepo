import { Log } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import {
  gatherEventData,
  getSafeUrl,
  getSanitizedPageUrl,
  getTargetNode,
  getWebSessionId,
  registerEventHandler,
  shouldLogEvent,
} from './Utils';

export function runStatsigAutoCapture(client: StatsigClient): void {
  new AutoCapture(client);
}

export class AutoCapture {
  private _startTime = Date.now();
  private _deepestScroll = 0;

  constructor(private _client: StatsigClient) {
    const { sdkKey } = _client.getContext();

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.acInstances ?? {};
    instances[sdkKey] = this;
    __STATSIG__.acInstances = instances;

    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._initialize());
      return;
    }

    this._initialize();
  }

  private _addEventHandlers(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const eventHandler = (event: Event) => {
      this._autoLogEvent(event || window.event);
    };

    registerEventHandler(document, 'click', eventHandler);
    registerEventHandler(document, 'submit', eventHandler);
    registerEventHandler(window, 'error', eventHandler);
    registerEventHandler(window, 'beforeunload', () =>
      this._pageUnloadHandler(),
    );
    registerEventHandler(window, 'scroll', () => this._scrollEventHandler());
  }

  private _autoLogEvent(event: Event) {
    let eventType = event.type?.toLowerCase();
    if (eventType === 'error' && event instanceof ErrorEvent) {
      this._logError(event);
      return;
    }

    const target = getTargetNode(event);
    if (!target) {
      return;
    }

    if (!shouldLogEvent(event, target)) {
      return;
    }

    if (eventType === 'submit') {
      eventType = 'form_submit';
    }
    const { value, metadata } = gatherEventData(target);
    this._enqueueAutoCapture(eventType, value, metadata);
  }

  private _initialize() {
    this._addEventHandlers();
    this._logPageView();
    this._logPerformance();
  }

  private _logError(event: ErrorEvent) {
    const error: unknown = event?.error || {};
    let errorStr: unknown = error;

    if (typeof error === 'object') {
      try {
        errorStr = JSON.stringify(error);
      } catch (e) {
        errorStr =
          typeof error?.toString === 'function'
            ? error.toString()
            : 'Unknown Error';
      }
    }

    this._enqueueAutoCapture('error', event.message, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error_str: errorStr,
    });
  }

  private _logPageView() {
    setTimeout(() => {
      const url = getSafeUrl();
      this._logAutoCaptureImmediately('page_view', getSanitizedPageUrl(), {
        title: document?.title,
        queryParams: Object.fromEntries(url.searchParams),
      });
    }, 1);
  }

  private _logPerformance() {
    if (
      typeof window === 'undefined' ||
      typeof window.performance === 'undefined' ||
      typeof window.performance.getEntriesByType !== 'function' ||
      typeof window.performance.getEntriesByName !== 'function'
    ) {
      return;
    }

    setTimeout(() => {
      const metadata: Record<string, unknown> = {};
      const navEntries = window.performance.getEntriesByType('navigation');
      if (
        navEntries &&
        navEntries.length > 0 &&
        navEntries[0] instanceof PerformanceNavigationTiming
      ) {
        const nav = navEntries[0];
        metadata['load_time_ms'] = nav.duration;
        metadata['dom_interactive_time_ms'] =
          nav.domInteractive - nav.startTime;
        metadata['redirect_count'] = nav.redirectCount;
        metadata['transfer_bytes'] = nav.transferSize;
      }

      const fpEntries = window.performance.getEntriesByName(
        'first-contentful-paint',
      );

      if (
        fpEntries &&
        fpEntries.length > 0 &&
        fpEntries[0] instanceof PerformancePaintTiming
      ) {
        metadata['first_contentful_paint_time_ms'] = fpEntries[0].startTime;
      }

      this._enqueueAutoCapture('performance', getSanitizedPageUrl(), metadata);
    }, 1);
  }

  private _pageUnloadHandler() {
    this._logAutoCaptureImmediately('page_view_end', getSanitizedPageUrl(), {
      scrollDepth: this._deepestScroll,
      pageViewLength: Date.now() - this._startTime,
    });
  }

  private _enqueueAutoCapture(
    name: string,
    value: string,
    metadata: Record<string, unknown>,
  ) {
    const event = {
      eventName: `auto_capture::${name}`,
      value,
      metadata: {
        sessionId: getWebSessionId(this._client.getContext().sdkKey),
        page_url: window?.location?.href || '',
        ...metadata,
      },
    };

    this._client.logEvent(event);
    Log.debug('Enqueued Event', event);
  }

  private _logAutoCaptureImmediately(
    name: string,
    value: string,
    metadata: Record<string, unknown>,
  ) {
    this._enqueueAutoCapture(name, value, metadata);
    this._client.flush().catch((e) => {
      Log.error(e);
    });
  }

  private _scrollEventHandler() {
    const scrollHeight = document.body.scrollHeight || 1;
    this._deepestScroll = Math.max(
      this._deepestScroll,
      Math.min(
        100,
        Math.round(
          ((window.scrollY + window.innerHeight) / scrollHeight) * 100,
        ),
      ),
    );
  }
}
