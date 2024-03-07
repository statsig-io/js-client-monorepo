import { DJB2 } from './Hashing';
import { Log } from './Log';
import { NetworkCore } from './NetworkCore';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal, isExposureEvent } from './StatsigEvent';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { getObjectFromStorage, setObjectInStorage } from './StorageProvider';
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
  private _lastExposureMap: Record<string, number> = {};

  private _maxQueueSize: number;
  private _failedLogs: EventQueue;

  constructor(
    private _sdkKey: string,
    private _emitter: StatsigClientEmitEventFunc,
    private _network: NetworkCore,
    private _options: StatsigOptionsCommon | null,
  ) {
    this._maxQueueSize = _options?.loggingBufferMaxSize ?? DEFAULT_QUEUE_SIZE;

    const flushInterval =
      _options?.loggingIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this._flushTimer = setInterval(() => this._flushAndForget(), flushInterval);

    VisibilityChangeObserver.add(this);

    this._failedLogs = [];
    this._retryFailedLogs();
  }

  enqueue(event: StatsigEventInternal): void {
    if (!this._shouldLogEvent(event)) {
      return;
    }

    if (event.user) {
      event.user = { ...event.user };
      delete event.user.privateAttributes;
    }

    const { sdkType, sdkVersion } = StatsigMetadataProvider.get();

    this._queue.push({
      ...event,
      ...{ statsigMetadata: { sdkType, sdkVersion } },
    });

    if (this._queue.length > this._maxQueueSize) {
      this._flushAndForget();
    }
  }

  reset(): void {
    this._lastExposureMap = {};
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

    await this._flush();
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
    const previous = this._lastExposureMap[key];
    const now = Date.now();

    if (previous && now - previous < DEDUPER_WINDOW_DURATION_MS) {
      return false;
    }

    if (Object.keys(this._lastExposureMap).length > MAX_DEDUPER_KEYS) {
      this._lastExposureMap = {};
    }

    this._lastExposureMap[key] = now;
    return true;
  }

  private _flushAndForget() {
    this._flush().catch(() => {
      // noop
    });
  }

  private async _flush(): Promise<void> {
    if (this._queue.length === 0) {
      return;
    }

    const events = this._queue;
    this._queue = [];

    await this._sendEvents(events);
  }

  private async _sendEvents(events: EventQueue): Promise<void> {
    try {
      const isInForeground = VisibilityChangeObserver.isCurrentlyVisible();
      const api = this._options?.api ?? DEFAULT_API;

      const response =
        !isInForeground && this._isBeaconSupported()
          ? this._sendEventsViaBeacon(api, events)
          : await this._sendEventsViaPost(api, events);

      if (response.success) {
        this._emitter({
          event: 'logs_flushed',
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
    api: string,
    events: StatsigEventInternal[],
  ): Promise<SendEventsResponse> {
    const result = await this._network.post({
      sdkKey: this._sdkKey,
      data: {
        events,
      },
      url: `${api}/rgstr`,
      retries: 3,
      params: {
        // ec = Event Count
        ec: String(events.length),
      },
    });

    if (result) {
      return JSON.parse(result) as SendEventsResponse;
    }

    return { success: false };
  }

  private _sendEventsViaBeacon(
    api: string,
    events: StatsigEventInternal[],
  ): SendEventsResponse {
    return {
      success: this._network.beacon({
        sdkKey: this._sdkKey,
        data: {
          events,
        },
        url: `${api}/log_event_beacon`,
      }),
    };
  }

  private _isBeaconSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator?.sendBeacon === 'function'
    );
  }

  private _saveFailedLogsToStorage(events: EventQueue) {
    this._failedLogs.push(...events);
    while (this._failedLogs.length > MAX_FAILED_LOGS) {
      this._failedLogs.shift();
    }

    const storageKey = this._getStorageKey();

    setObjectInStorage(storageKey, this._failedLogs).catch(() => {
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

      await this._sendEvents(events);
    })().catch(() => {
      Log.warn('Unable to flush stored logs');
    });
  }

  private _getStorageKey() {
    return `STATSIG_FAILED_LOG:${DJB2(this._sdkKey)}`;
  }
}
