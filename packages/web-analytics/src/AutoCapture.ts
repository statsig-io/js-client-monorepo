import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  StatsigPlugin,
  StatsigSession,
  StatsigUser,
  _getDocumentSafe,
  _getStatsigGlobal,
  _getWindowSafe,
  _isServerEnv,
} from '@statsig/client-core';

import { AutoCaptureEvent, AutoCaptureEventName } from './AutoCaptureEvent';
import { AutoCaptureOptions } from './AutoCaptureOptions';
import { ConsoleLogManager } from './ConsoleLogManager';
import DeadClickManager from './DeadClickManager';
import { EngagementManager } from './EngagementManager';
import RageClickManager from './RageClickManager';
import { WebVitalsManager } from './WebVitalsManager';
import {
  _getSafeUrl,
  _getSanitizedPageUrl,
  _getTargetNode,
  _registerEventHandler,
  _sanitizeString,
  _shouldLogEvent,
} from './utils/commonUtils';
import { _gatherEventData } from './utils/eventUtils';
import {
  _gatherAllMetadata,
  _getNetworkInfo,
  _getPossibleFirstTouchMetadata,
} from './utils/metadataUtils';

const AUTO_EVENT_MAPPING: Record<string, AutoCaptureEventName> = {
  submit: AutoCaptureEventName.FORM_SUBMIT,
  click: AutoCaptureEventName.CLICK,
  copy: AutoCaptureEventName.COPY,
  cut: AutoCaptureEventName.COPY,
} as const;

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
  const { sdkKey } = client.getContext();

  if (!_isServerEnv()) {
    const global = _getStatsigGlobal();
    const instances = global.acInstances ?? {};

    if (instances[sdkKey]) {
      return instances[sdkKey] as AutoCapture;
    }
  }

  return new AutoCapture(client, options);
}

export class AutoCapture {
  private _errorBoundary: ErrorBoundary;
  private _disabledEvents: Record<string, boolean> = {};
  private _previousLoggedPageViewUrl: URL | null = null;
  private _eventFilterFunc?: (event: AutoCaptureEvent) => boolean;
  private _hasLoggedPageViewEnd = false;
  private _engagementManager: EngagementManager;
  private _rageClickManager: RageClickManager;
  private _pageViewLogged = false;
  private _webVitalsManager: WebVitalsManager;
  private _deadClickManager: DeadClickManager;
  private _consoleLogManager: ConsoleLogManager;

  constructor(
    private _client: PrecomputedEvaluationsInterface,
    options?: AutoCaptureOptions,
  ) {
    const { sdkKey, errorBoundary, values } = _client.getContext();
    this._disabledEvents = values?.auto_capture_settings?.disabled_events ?? {};
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this, 'autoCapture:');
    this._client.$on('values_updated', () => {
      const values = this._client.getContext().values;
      this._disabledEvents =
        values?.auto_capture_settings?.disabled_events ?? this._disabledEvents;
    });
    this._engagementManager = new EngagementManager();
    this._rageClickManager = new RageClickManager();
    this._webVitalsManager = new WebVitalsManager(
      this._enqueueAutoCapture.bind(this),
      errorBoundary,
    );
    this._deadClickManager = new DeadClickManager(
      this._enqueueAutoCapture.bind(this),
      errorBoundary,
    );
    this._consoleLogManager = new ConsoleLogManager(
      this._enqueueAutoCapture.bind(this),
      errorBoundary,
      options?.consoleLogAutoCaptureSettings ?? { enabled: false },
    );
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
      const e = event || _getWindowSafe()?.event;
      this._autoLogEvent(e);

      if (userAction) {
        this._engagementManager.bumpInactiveTimer();
      }

      if (e.type === 'click' && e instanceof MouseEvent) {
        const isRageClick = this._rageClickManager.isRageClick(
          e.clientX,
          e.clientY,
          Date.now(),
        );
        if (isRageClick) {
          this._logRageClick(e);
        }
      }
    };

    _registerEventHandler(doc, 'click', (e) => eventHandler(e));
    _registerEventHandler(doc, 'submit', (e) => eventHandler(e));
    _registerEventHandler(doc, 'copy', (e) => eventHandler(e));
    _registerEventHandler(doc, 'cut', (e) => eventHandler(e));
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

    window.history.replaceState = new Proxy(window.history.replaceState, {
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

    const eventName = AUTO_EVENT_MAPPING[eventType];
    if (!eventName) {
      return;
    }

    const isCopyEvent = eventName === AutoCaptureEventName.COPY;
    if (!_shouldLogEvent(event, target, isCopyEvent)) {
      return;
    }

    const metadata: Record<string, unknown> = {};

    if (isCopyEvent) {
      const selectedText = _getWindowSafe()?.getSelection()?.toString();
      if (!selectedText) {
        return;
      }
      metadata['selectedText'] = _sanitizeString(selectedText);
      const clipType = (event as ClipboardEvent).type || 'clipboard';
      metadata['clipType'] = clipType;
    }

    const { value, metadata: eventMetadata } = _gatherEventData(target);
    Object.assign(metadata, eventMetadata);

    const allMetadata = _gatherAllMetadata(_getSafeUrl());
    this._enqueueAutoCapture(eventName, value, {
      ...allMetadata,
      ...metadata,
    });
  }

  private _initialize() {
    this._webVitalsManager.startTracking();
    this._deadClickManager.startTracking();
    this._consoleLogManager.startTracking();
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
        {
          sessionID: session.data.sessionID,
          ..._gatherAllMetadata(_getSafeUrl()),
        },
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

    this._hasLoggedPageViewEnd = false;

    const payload = _gatherAllMetadata(url);
    if (this._previousLoggedPageViewUrl) {
      payload['last_page_view_url'] = this._previousLoggedPageViewUrl.href;
    }

    if (!this._pageViewLogged) {
      this._updateClientWithPossibleFirstTouchMetadata();
      this._pageViewLogged = true;
    }

    this._enqueueAutoCapture(
      AutoCaptureEventName.PAGE_VIEW,
      _getSanitizedPageUrl(),
      payload,
      {
        flushImmediately: true,
        addNewSessionMetadata: true,
      },
    );
    this._previousLoggedPageViewUrl = url;
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

  private _logRageClick(e: MouseEvent) {
    const { value, metadata } = _gatherEventData(e.target as HTMLElement);

    this._enqueueAutoCapture(AutoCaptureEventName.RAGE_CLICK, value, {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      ..._gatherAllMetadata(_getSafeUrl()),
      ...metadata,
    });
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

      this._enqueueAutoCapture(
        AutoCaptureEventName.PERFORMANCE,
        _getSanitizedPageUrl(),
        {
          ...metadata,
          ..._getNetworkInfo(),
        },
      );
    }, 1);
  }

  private _enqueueAutoCapture(
    eventName: AutoCaptureEventName,
    value: string | null,
    metadata: Record<string, unknown>,
    options?: { flushImmediately?: boolean; addNewSessionMetadata?: boolean },
  ) {
    if (!value) {
      return;
    }

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
        this._flushImmediately();
      }
    } catch (err) {
      this._errorBoundary.logError('AC::enqueue', err);
    }
  }

  private _updateClientWithPossibleFirstTouchMetadata() {
    const typedClient = this._client as unknown as {
      _user: StatsigUser;
      _possibleFirstTouchMetadata: Record<string, string | number>;
    };

    typedClient._possibleFirstTouchMetadata =
      _getPossibleFirstTouchMetadata(_getSafeUrl());

    // Only update user if first touch metadata is not empty
    if (Object.keys(typedClient._possibleFirstTouchMetadata).length > 0) {
      typedClient._user = {
        ...typedClient._user,
        analyticsOnlyMetadata: {
          ...typedClient._possibleFirstTouchMetadata,
          ...typedClient._user.analyticsOnlyMetadata,
        },
      };
    }
  }

  private _flushImmediately(): void {
    this._client.flush().catch((e) => {
      Log.error(e);
    });
  }

  private _isNewSession(session: StatsigSession) {
    // within the last second
    return Math.abs(session.data.startTime - Date.now()) < 1000;
  }

  private _getSessionFromClient() {
    return this._client.getContext().session;
  }

  public static getAllMetadata(): Record<string, string | number> {
    return _gatherAllMetadata(_getSafeUrl());
  }
}
