import {
  ErrorBoundary,
  Log,
  _getDocumentSafe,
  _getStatsigGlobal,
  _getWindowSafe,
  _isBrowserEnv,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import {
  _gatherEventData,
  _getSafeUrl,
  _getSanitizedPageUrl,
  _getTargetNode,
  _registerEventHandler,
  _shouldLogEvent,
} from './Utils';

export function runStatsigAutoCapture(client: StatsigClient): void {
  new AutoCapture(client);
}

export class AutoCapture {
  private _errorBoundary: ErrorBoundary;
  private _startTime = Date.now();
  private _deepestScroll = 0;

  constructor(private _client: StatsigClient) {
    const { sdkKey, errorBoundary } = _client.getContext();
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);

    const doc = _getDocumentSafe();

    if (_isBrowserEnv()) {
      __STATSIG__ = _getStatsigGlobal();
      const instances = __STATSIG__.acInstances ?? {};
      instances[sdkKey] = this;
      __STATSIG__.acInstances = instances;
    }

    if (doc?.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', () => this._initialize());
      return;
    }

    this._initialize();
  }

  private _addEventHandlers(): void {
    const win = _getWindowSafe();
    const doc = _getDocumentSafe();
    if (!win || !doc) {
      return;
    }

    const eventHandler = (event: Event) => {
      this._autoLogEvent(event || win.event);
    };

    _registerEventHandler(doc, 'click', eventHandler);
    _registerEventHandler(doc, 'submit', eventHandler);
    _registerEventHandler(win, 'error', eventHandler);
    _registerEventHandler(win, 'beforeunload', () => this._pageUnloadHandler());
    _registerEventHandler(win, 'scroll', () => this._scrollEventHandler());
  }

  private _autoLogEvent(event: Event) {
    let eventType = event.type?.toLowerCase();
    if (eventType === 'error' && event instanceof ErrorEvent) {
      this._logError(event);
      return;
    }

    const target = _getTargetNode(event);
    if (!target) {
      return;
    }

    if (!_shouldLogEvent(event, target)) {
      return;
    }

    if (eventType === 'submit') {
      eventType = 'form_submit';
    }
    const { value, metadata } = _gatherEventData(target);
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
      const url = _getSafeUrl();
      this._logAutoCaptureImmediately('page_view', _getSanitizedPageUrl(), {
        title: _getDocumentSafe()?.title,
        queryParams: Object.fromEntries(url.searchParams),
      });
    }, 1);
  }

  private _logPerformance() {
    const win = _getWindowSafe();

    if (
      typeof win?.performance === 'undefined' ||
      typeof win.performance.getEntriesByType !== 'function' ||
      typeof win.performance.getEntriesByName !== 'function'
    ) {
      return;
    }

    setTimeout(() => {
      const metadata: Record<string, unknown> = {};
      const navEntries = win.performance.getEntriesByType('navigation');
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

      const fpEntries = win.performance.getEntriesByName(
        'first-contentful-paint',
      );

      if (
        fpEntries &&
        fpEntries.length > 0 &&
        fpEntries[0] instanceof PerformancePaintTiming
      ) {
        metadata['first_contentful_paint_time_ms'] = fpEntries[0].startTime;
      }

      this._enqueueAutoCapture('performance', _getSanitizedPageUrl(), metadata);
    }, 1);
  }

  private _pageUnloadHandler() {
    this._logAutoCaptureImmediately('page_view_end', _getSanitizedPageUrl(), {
      scrollDepth: this._deepestScroll,
      pageViewLength: Date.now() - this._startTime,
    });
  }

  private _enqueueAutoCapture(
    name: string,
    value: string,
    metadata: Record<string, unknown>,
  ) {
    this._getSessionIdFromClient()
      .then((sessionID) => {
        const event = {
          eventName: `auto_capture::${name}`,
          value,
          metadata: {
            sessionID,
            page_url: _getWindowSafe()?.location?.href ?? '',
            ...metadata,
          },
        };

        this._client.logEvent(event);
      })
      .catch((err) => {
        this._errorBoundary.logError('AC::enqueue', err);
      });
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
    const scrollHeight = _getDocumentSafe()?.body.scrollHeight ?? 1;
    const win = _getWindowSafe();
    const scrollY = win?.scrollY ?? 1;
    const innerHeight = win?.innerHeight ?? 1;

    this._deepestScroll = Math.max(
      this._deepestScroll,
      Math.min(100, Math.round(((scrollY + innerHeight) / scrollHeight) * 100)),
    );
  }

  private async _getSessionIdFromClient() {
    const x = await this._client.getAsyncContext();
    return x.sessionID;
  }
}
