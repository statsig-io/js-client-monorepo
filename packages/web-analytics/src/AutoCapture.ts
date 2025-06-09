import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  StatsigPlugin,
  StatsigSession,
  _getDocumentSafe,
  _getStatsigGlobal,
  _getWindowSafe,
  _isServerEnv,
} from '@statsig/client-core';

import { AutoCaptureEvent, AutoCaptureEventName } from './AutoCaptureEvent';
import { EngagementManager } from './EngagementManager';
import {
  _getSafeNetworkInformation,
  _getSafeUrl,
  _getSanitizedPageUrl,
  _getTargetNode,
  _registerEventHandler,
  _shouldLogEvent,
} from './commonUtils';
import { _gatherEventData } from './eventUtils';
import { _gatherAllMetadata } from './metadataUtils';

const AUTO_EVENT_MAPPING: Record<string, AutoCaptureEventName> = {
  submit: AutoCaptureEventName.FORM_SUBMIT,
  click: AutoCaptureEventName.CLICK,
} as const;

export type AutoCaptureOptions = {
  eventFilterFunc?: (event: AutoCaptureEvent) => boolean;
};

export class StatsigAutoCapturePlugin
  implements StatsigPlugin<PrecomputedEvaluationsInterface>
{
  readonly __plugin = 'auto-capture';

  constructor(private _options?: AutoCaptureOptions) {}

  bind(client: PrecomputedEvaluationsInterface): void {
    runStatsigAutoCapture(client, this._options);
  }
}

export function runStatsigAutoCapture(
  client: PrecomputedEvaluationsInterface,
  options?: AutoCaptureOptions,
): AutoCapture {
  return new AutoCapture(client, options);
}

export class AutoCapture {
  private _errorBoundary: ErrorBoundary;
  private _disabledEvents: Record<string, boolean> = {};
  private _previousLoggedPageViewUrl: URL | null = null;
  private _eventFilterFunc?: (event: AutoCaptureEvent) => boolean;
  private _hasLoggedPageViewEnd = false;
  private _engagementManager: EngagementManager;

  constructor(
    private _client: PrecomputedEvaluationsInterface,
    options?: AutoCaptureOptions,
  ) {
    const { sdkKey, errorBoundary, values } = _client.getContext();
    this._disabledEvents = values?.auto_capture_settings?.disabled_events ?? {};
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);
    this._client.$on('values_updated', () => {
      const values = this._client.getContext().values;
      this._disabledEvents =
        values?.auto_capture_settings?.disabled_events ?? this._disabledEvents;
    });
    this._engagementManager = new EngagementManager();

    this._eventFilterFunc = options?.eventFilterFunc;

    const doc = _getDocumentSafe();

    if (!_isServerEnv()) {
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

    const eventHandler = (event: Event, userAction = true) => {
      this._autoLogEvent(event || win.event);
      if (userAction) {
        this._engagementManager.bumpInactiveTimer();
      }
    };

    _registerEventHandler(doc, 'click', (e) => eventHandler(e));
    _registerEventHandler(doc, 'submit', (e) => eventHandler(e));
    _registerEventHandler(win, 'error', (e) => eventHandler(e, false));
    _registerEventHandler(win, 'pagehide', () => this._tryLogPageViewEnd());
    _registerEventHandler(win, 'beforeunload', () => this._tryLogPageViewEnd());
  }

  private _addPageViewTracking() {
    const win = _getWindowSafe();
    const doc = _getDocumentSafe();
    if (!win || !doc) {
      return;
    }

    _registerEventHandler(win, 'popstate', () => this._tryLogPageView());

    window.history.pushState = new Proxy(window.history.pushState, {
      apply: (target, thisArg, [state, unused, url]) => {
        target.apply(thisArg, [state, unused, url]);
        this._tryLogPageView();
      },
    });

    this._tryLogPageView();
  }

  private _autoLogEvent(event: Event) {
    const eventType = event.type?.toLowerCase();
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

    const eventName = AUTO_EVENT_MAPPING[eventType];
    if (!eventName) {
      return;
    }

    const { value, metadata } = _gatherEventData(target);
    const allMetadata = _gatherAllMetadata(_getSafeUrl());
    this._enqueueAutoCapture(eventName, value, {
      ...allMetadata,
      ...metadata,
    });
  }

  private _initialize() {
    this._engagementManager.startInactivityTracking(() =>
      this._tryLogPageViewEnd(true),
    );
    this._addEventHandlers();
    this._addPageViewTracking();
    this._logSessionStart();
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

    this._enqueueAutoCapture(AutoCaptureEventName.ERROR, event.message, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error_str: errorStr,
    });
  }

  private _logSessionStart() {
    const session = this._getSessionFromClient();

    try {
      if (!this._isNewSession(session)) {
        return;
      }

      this._enqueueAutoCapture(
        AutoCaptureEventName.SESSION_START,
        _getSanitizedPageUrl(),
        { sessionID: session.data.sessionID },
        { flushImmediately: true },
      );
    } catch (err) {
      this._errorBoundary.logError('AC::logSession', err);
    }
  }

  private _tryLogPageView() {
    const url = _getSafeUrl();

    const last = this._previousLoggedPageViewUrl;
    if (last && url.href === last.href) {
      return;
    }

    this._engagementManager.setLastPageViewTime(Date.now());

    this._previousLoggedPageViewUrl = url;
    this._hasLoggedPageViewEnd = false;

    const payload = _gatherAllMetadata(url);

    this._enqueueAutoCapture(
      AutoCaptureEventName.PAGE_VIEW,
      _getSanitizedPageUrl(),
      payload,
      {
        flushImmediately: true,
        addNewSessionMetadata: true,
      },
    );
    this._engagementManager.bumpInactiveTimer();
  }

  private _tryLogPageViewEnd(dueToInactivity = false) {
    if (this._hasLoggedPageViewEnd) {
      return;
    }

    this._hasLoggedPageViewEnd = true;
    const scrollMetrics = this._engagementManager.getScrollMetrics();
    const pageViewLength = this._engagementManager.getPageViewLength();

    this._enqueueAutoCapture(
      AutoCaptureEventName.PAGE_VIEW_END,
      _getSanitizedPageUrl(),
      {
        ...scrollMetrics,
        pageViewLength,
        dueToInactivity,
      },
      {
        flushImmediately: true,
      },
    );
  }

  private _logPerformance() {
    const win = _getWindowSafe();
    if (!win || !win.performance) {
      return;
    }

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

      const networkInfo = _getSafeNetworkInformation();

      if (networkInfo) {
        metadata['effective_connection_type'] = networkInfo.effectiveType;
        metadata['rtt_ms'] = networkInfo.rtt;
        metadata['downlink_kbps'] = networkInfo.downlink;
        metadata['save_data'] = networkInfo.saveData;
      }

      this._enqueueAutoCapture(
        AutoCaptureEventName.PERFORMANCE,
        _getSanitizedPageUrl(),
        metadata,
      );
    }, 1);
  }

  private _enqueueAutoCapture(
    eventName: AutoCaptureEventName,
    value: string,
    metadata: Record<string, unknown>,
    options?: { flushImmediately?: boolean; addNewSessionMetadata?: boolean },
  ) {
    const subname = eventName.slice('auto_capture::'.length);
    if (this._disabledEvents[eventName] || this._disabledEvents[subname]) {
      return;
    }

    const session = this._getSessionFromClient();
    try {
      const logMetadata: Record<string, string> = {
        sessionID: session.data.sessionID,
        page_url: _getWindowSafe()?.location?.href ?? '',
        ...metadata,
      };

      if (options?.addNewSessionMetadata) {
        logMetadata['isNewSession'] = String(this._isNewSession(session));
      }

      const event: AutoCaptureEvent = {
        eventName,
        value,
        metadata: logMetadata,
      };

      if (this._eventFilterFunc && !this._eventFilterFunc(event)) {
        return;
      }

      this._client.logEvent(event);

      if (options?.flushImmediately) {
        this._client.flush().catch((e) => {
          Log.error(e);
        });
      }
    } catch (err) {
      this._errorBoundary.logError('AC::enqueue', err);
    }
  }

  private _isNewSession(session: StatsigSession) {
    // within the last second
    return Math.abs(session.data.startTime - Date.now()) < 1000;
  }

  private _getSessionFromClient() {
    return this._client.getContext().session;
  }
}
