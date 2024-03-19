import { DJB2 } from './Hashing';
import { Log } from './Log';
import { NetworkCore } from './NetworkCore';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal, isExposureEvent } from './StatsigEvent';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import {
  Storage,
  getObjectFromStorage,
  setObjectInStorage,
} from './StorageProvider';
import { typedJsonParse } from './TypedJsonParse';
import { _getOverridableUrl } from './UrlOverrides';
import {
  Visibility,
  VisibilityChangeObserver,
} from './VisibilityChangeObserver';

const DEFAULT_QUEUE_SIZE = 50;
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

const MAX_DEDUPER_KEYS = 1000;
const DEDUPER_WINDOW_DURATION_MS = 60_000;
const MAX_FAILED_LOGS = 500;

const DEFAULT_API = 'https://api.statsig.com/v1';
const DEFAULT_ENDPOINT = '/rgstr';
const DEFAULT_BEACON_ENDPOINT = '/log_event_beacon';
const QUICK_FLUSH_WINDOW_MS = 200;

type SendEventsResponse = {
  success: boolean;
};

type StatsigEventExtras = {
  statsigMetadata: {
    sdkType: string;
    sdkVersion: string;
  };
};

type EventQueue = (StatsigEventInternal & StatsigEventExtras)[];

export class EventLogger {
  private _queue: EventQueue = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;
  private _lastExposureTimeMap: Record<string, number> = {};
  private _nonExposedChecks: Record<string, number> = {};
  private _maxQueueSize: number;
  private _hasRunQuickFlush = false;
  private _creationTime = Date.now();
  private _isLoggingDisabled: boolean;
  private _logEventUrl: string;
  private _logEventBeaconUrl: string;

  constructor(
    private _sdkKey: string,
    private _emitter: StatsigClientEmitEventFunc,
    private _network: NetworkCore,
    private _options: StatsigOptionsCommon | null,
  ) {
    this._isLoggingDisabled = _options?.disableLogging === true;
    this._maxQueueSize = _options?.loggingBufferMaxSize ?? DEFAULT_QUEUE_SIZE;

    const flushInterval =
      _options?.loggingIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this._flushTimer = setInterval(() => this._flushAndForget(), flushInterval);

    this._logEventUrl = _getOverridableUrl(
      _options?.logEventUrl,
      _options?.api,
      DEFAULT_ENDPOINT,
      DEFAULT_API,
    );

    this._logEventBeaconUrl = _getOverridableUrl(
      _options?.logEventBeaconUrl,
      _options?.api,
      DEFAULT_BEACON_ENDPOINT,
      DEFAULT_API,
    );

    VisibilityChangeObserver.add(this);

    this._retryFailedLogs();
  }

  setLoggingDisabled(isDisabled: boolean): void {
    this._isLoggingDisabled = isDisabled;
  }

  enqueue(event: StatsigEventInternal): void {
    if (!this._shouldLogEvent(event)) {
      return;
    }

    this._normalizeAndAppendEvent(event);

    this._quickFlushIfNeeded();

    if (this._queue.length > this._maxQueueSize) {
      this._flushAndForget();
    }
  }

  incrementNonExposureCount(name: string): void {
    const current = this._nonExposedChecks[name] ?? 0;
    this._nonExposedChecks[name] = current + 1;
  }

  reset(): void {
    this._lastExposureTimeMap = {};
  }

  onVisibilityChanged(visibility: Visibility): void {
    if (visibility === 'background') {
      this._flushAndForget();
    }
  }

  async shutdown(): Promise<void> {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }

    await this.flush();
  }

  async flush(): Promise<void> {
    this._appendAndResetNonExposedChecks();

    if (this._queue.length === 0) {
      return;
    }

    const events = this._queue;
    this._queue = [];

    await this._sendEvents(events);
  }

  /**
   * We 'Quick Flush' following the very first event enqueued
   * within the quick flush window
   */
  private _quickFlushIfNeeded() {
    if (this._hasRunQuickFlush) {
      return;
    }
    this._hasRunQuickFlush = true;

    if (Date.now() - this._creationTime > QUICK_FLUSH_WINDOW_MS) {
      return;
    }

    setTimeout(() => this._flushAndForget(), QUICK_FLUSH_WINDOW_MS);
  }

  private _shouldLogEvent(event: StatsigEventInternal): boolean {
    if (!isExposureEvent(event)) {
      return true;
    }

    const key = [
      event.eventName,
      event.user?.userID,
      event.metadata?.['gate'],
      event.metadata?.['config'],
      event.metadata?.['ruleID'],
    ].join('|');
    const previous = this._lastExposureTimeMap[key];
    const now = Date.now();

    if (previous && now - previous < DEDUPER_WINDOW_DURATION_MS) {
      return false;
    }

    if (Object.keys(this._lastExposureTimeMap).length > MAX_DEDUPER_KEYS) {
      this._lastExposureTimeMap = {};
    }

    this._lastExposureTimeMap[key] = now;
    return true;
  }

  private _flushAndForget() {
    this.flush().catch(() => {
      // noop
    });
  }

  private async _sendEvents(events: EventQueue): Promise<void> {
    if (this._isLoggingDisabled) {
      this._saveFailedLogsToStorage(events);
      return;
    }

    try {
      const isInForeground = VisibilityChangeObserver.isCurrentlyVisible();

      const response =
        !isInForeground && this._network.isBeaconSupported()
          ? await this._sendEventsViaBeacon(events)
          : await this._sendEventsViaPost(events);

      if (response.success) {
        this._emitter({
          name: 'logs_flushed',
          events,
        });
      } else {
        this._saveFailedLogsToStorage(events);
      }
    } catch {
      Log.warn('Failed to flush events.');
    }
  }

  private async _sendEventsViaPost(
    events: StatsigEventInternal[],
  ): Promise<SendEventsResponse> {
    const result = await this._network.post({
      sdkKey: this._sdkKey,
      data: {
        events,
      },
      url: this._logEventUrl,
      retries: 3,
      params: {
        // ec = Event Count
        ec: String(events.length),
      },
    });

    const response = result?.body
      ? typedJsonParse<SendEventsResponse>(
          result.body,
          'success',
          'Failed to parse SendEventsResponse',
        )
      : null;

    return { success: response?.success === true };
  }

  private async _sendEventsViaBeacon(
    events: StatsigEventInternal[],
  ): Promise<SendEventsResponse> {
    return {
      success: await this._network.beacon({
        sdkKey: this._sdkKey,
        data: {
          events,
        },
        url: this._logEventBeaconUrl,
      }),
    };
  }

  private _saveFailedLogsToStorage(events: EventQueue) {
    while (events.length > MAX_FAILED_LOGS) {
      events.shift();
    }

    const storageKey = this._getStorageKey();

    setObjectInStorage(storageKey, events).catch(() => {
      Log.warn('Unable to save failed logs to storage');
    });
  }

  private _retryFailedLogs() {
    const storageKey = this._getStorageKey();
    (async () => {
      const events = await getObjectFromStorage<EventQueue>(storageKey);
      if (!events) {
        return;
      }

      await Storage.removeItem(storageKey);
      await this._sendEvents(events);
    })().catch(() => {
      Log.warn('Failed to flush stored logs');
    });
  }

  private _getStorageKey() {
    return `statsig.failed_logs.${DJB2(this._sdkKey)}`;
  }

  private _normalizeAndAppendEvent(event: StatsigEventInternal) {
    if (event.user) {
      event.user = { ...event.user };
      delete event.user.privateAttributes;
    }

    const { sdkType, sdkVersion } = StatsigMetadataProvider.get();

    this._queue.push({
      ...event,
      ...{ statsigMetadata: { sdkType, sdkVersion } },
    });
  }

  private _appendAndResetNonExposedChecks() {
    if (Object.keys(this._nonExposedChecks).length === 0) {
      return;
    }

    this._normalizeAndAppendEvent({
      eventName: 'statsig::non_exposed_checks',
      user: null,
      time: Date.now(),
      metadata: {
        checks: { ...this._nonExposedChecks },
      },
    });

    this._nonExposedChecks = {};
  }
}
