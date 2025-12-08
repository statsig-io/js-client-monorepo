import { BatchQueue } from './BatchedEventsQueue';
import { _getUserStorageKey } from './CacheKey';
import { ErrorBoundary } from './ErrorBoundary';
import { EventRetryConstants } from './EventRetryConstants';
import { FlushCoordinator } from './FlushCoordinator';
import { _DJB2 } from './Hashing';
import { Log } from './Log';
import { Endpoint } from './NetworkConfig';
import { NetworkCore } from './NetworkCore';
import { PendingEvents } from './PendingEvents';
import { _getCurrentPageUrlSafe, _isServerEnv } from './SafeJs';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal, _isExposureEvent } from './StatsigEvent';
import {
  LogEventCompressionMode,
  LoggingEnabledOption,
  NetworkConfigCommon,
  StatsigOptionsCommon,
} from './StatsigOptionsCommon';
import {
  Storage,
  _getObjectFromStorage,
  _setObjectInStorage,
} from './StorageProvider';
import { UrlConfiguration } from './UrlConfiguration';
import { _subscribeToVisiblityChanged } from './VisibilityObserving';

const MAX_DEDUPER_KEYS = 1000;
const DEDUPER_WINDOW_DURATION_MS = 600_000;
const EVENT_LOGGER_MAP: Record<string, EventLogger | undefined> = {};

type StatsigEventExtras = {
  statsigMetadata?: {
    currentPage?: string;
  };
};

export class EventLogger {
  private _pendingEvents: PendingEvents;
  private _batchQueue: BatchQueue;
  private _flushCoordinator: FlushCoordinator;

  private _lastExposureTimeMap: Record<string, number> = {};
  private _nonExposedChecks: Record<string, number> = {};
  private _loggingEnabled: LoggingEnabledOption;
  private _logEventUrlConfig: UrlConfiguration;
  private _isShuttingDown = false;
  private _storageKey: string | null = null;

  private static _safeFlushAndForget(sdkKey: string) {
    EVENT_LOGGER_MAP[sdkKey]?.flush().catch(() => {
      // noop
    });
  }

  constructor(
    private _sdkKey: string,
    private _emitter: StatsigClientEmitEventFunc,
    private _network: NetworkCore,
    private _options: StatsigOptionsCommon<NetworkConfigCommon> | null,
    private _errorBoundary: ErrorBoundary,
  ) {
    this._loggingEnabled =
      _options?.loggingEnabled ??
      (_options?.disableLogging === true
        ? LoggingEnabledOption.disabled
        : LoggingEnabledOption.browserOnly);
    if (_options?.loggingEnabled && _options.disableLogging !== undefined) {
      Log.warn(
        'Detected both loggingEnabled and disableLogging options. loggingEnabled takes precedence - please remove disableLogging.',
      );
    }

    const config = _options?.networkConfig;
    this._logEventUrlConfig = new UrlConfiguration(
      Endpoint._rgstr,
      config?.logEventUrl,
      config?.api,
      config?.logEventFallbackUrls,
    );

    const batchSize =
      _options?.loggingBufferMaxSize ?? EventRetryConstants.DEFAULT_BATCH_SIZE;

    this._pendingEvents = new PendingEvents(batchSize);
    this._batchQueue = new BatchQueue(batchSize);

    this._flushCoordinator = new FlushCoordinator(
      this._batchQueue,
      this._pendingEvents,
      () => this.appendAndResetNonExposedChecks(),
      this._sdkKey,
      this._network,
      this._emitter,
      this._logEventUrlConfig,
      this._options,
      this._loggingEnabled,
      this._errorBoundary,
    );
  }

  setLogEventCompressionMode(mode: LogEventCompressionMode): void {
    this._flushCoordinator.setLogEventCompressionMode(mode);
  }

  setLoggingEnabled(loggingEnabled: LoggingEnabledOption): void {
    const wasDisabled = this._loggingEnabled === 'disabled';
    const isNowEnabled = loggingEnabled !== 'disabled';

    this._loggingEnabled = loggingEnabled;
    this._flushCoordinator.setLoggingEnabled(loggingEnabled);

    if (wasDisabled && isNowEnabled) {
      const events = this._loadStoredEvents();
      Log.debug(`Loaded ${events.length} stored event(s) from storage`);
      if (events.length > 0) {
        events.forEach((event) => {
          this._flushCoordinator.addEvent(event);
        });
        this.flush().catch((error) => {
          Log.warn('Failed to flush events after enabling logging:', error);
        });
      }
    }
  }

  enqueue(event: StatsigEventInternal): void {
    if (!this._shouldLogEvent(event)) {
      return;
    }

    const normalizedEvent = this._normalizeEvent(event);

    if (this._loggingEnabled === 'disabled') {
      this._storeEventToStorage(normalizedEvent);
      return;
    }
    this._flushCoordinator.addEvent(normalizedEvent);
    this._flushCoordinator.checkQuickFlush();
  }

  incrementNonExposureCount(name: string): void {
    const current = this._nonExposedChecks[name] ?? 0;
    this._nonExposedChecks[name] = current + 1;
  }

  reset(): void {
    // attempt to flush any remaining events
    this.flush().catch(() => {
      // noop
    });
    this._lastExposureTimeMap = {};
  }

  start(): void {
    const isServerEnv = _isServerEnv();

    if (isServerEnv && this._options?.loggingEnabled !== 'always') {
      return;
    }

    EVENT_LOGGER_MAP[this._sdkKey] = this;

    if (!isServerEnv) {
      _subscribeToVisiblityChanged((visibility) => {
        if (visibility === 'background') {
          EventLogger._safeFlushAndForget(this._sdkKey);
        } else if (visibility === 'foreground') {
          this._flushCoordinator.startScheduledFlushCycle();
        }
      });
    }

    this._flushCoordinator.loadAndRetryShutdownFailedEvents().catch((error) => {
      Log.warn('Failed to load failed shutdown events:', error);
    });

    this._flushCoordinator.startScheduledFlushCycle();
  }

  async stop(): Promise<void> {
    this._isShuttingDown = true;
    await this._flushCoordinator.processShutdown();
    delete EVENT_LOGGER_MAP[this._sdkKey];
  }

  async flush(): Promise<void> {
    return this._flushCoordinator.processManualFlush();
  }

  appendAndResetNonExposedChecks(): void {
    if (Object.keys(this._nonExposedChecks).length === 0) {
      return;
    }

    const event = this._normalizeEvent({
      eventName: 'statsig::non_exposed_checks',
      user: null,
      time: Date.now(),
      metadata: {
        checks: { ...this._nonExposedChecks },
      },
    });

    this._flushCoordinator.addEvent(event);
    this._nonExposedChecks = {};
  }

  private _shouldLogEvent(event: StatsigEventInternal): boolean {
    if (this._options?.loggingEnabled !== 'always' && _isServerEnv()) {
      return false;
    }

    if (!_isExposureEvent(event)) {
      return true;
    }

    const user = event.user ? event.user : { statsigEnvironment: undefined };
    const userKey = _getUserStorageKey(this._sdkKey, user);

    const metadata = event.metadata ? event.metadata : {};

    const key = [
      event.eventName,
      userKey,
      metadata['gate'],
      metadata['config'],
      metadata['ruleID'],
      metadata['allocatedExperiment'],
      metadata['parameterName'],
      String(metadata['isExplicitParameter']),
      metadata['reason'],
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

  private _getCurrentPageUrl(): string | undefined {
    if (this._options?.includeCurrentPageUrlWithEvents === false) {
      return;
    }

    return _getCurrentPageUrlSafe();
  }
  private _getStorageKey(): string {
    if (!this._storageKey) {
      this._storageKey = `statsig.pending_events.${_DJB2(this._sdkKey)}`;
    }
    return this._storageKey;
  }

  private _storeEventToStorage(event: StatsigEventInternal): void {
    const storageKey = this._getStorageKey();

    try {
      let existingEvents = this._getEventsFromStorage(storageKey);
      existingEvents.push(event);

      if (existingEvents.length > EventRetryConstants.MAX_LOCAL_STORAGE) {
        existingEvents = existingEvents.slice(
          -EventRetryConstants.MAX_LOCAL_STORAGE,
        );
      }

      _setObjectInStorage(storageKey, existingEvents);
    } catch (error) {
      Log.warn('Unable to save events to storage');
    }
  }

  private _getEventsFromStorage(storageKey: string): StatsigEventInternal[] {
    try {
      const events = _getObjectFromStorage<StatsigEventInternal[]>(storageKey);
      if (Array.isArray(events)) {
        return events;
      }
      return [];
    } catch {
      return [];
    }
  }

  private _loadStoredEvents(): StatsigEventInternal[] {
    const storageKey = this._getStorageKey();
    const events = this._getEventsFromStorage(storageKey);

    if (events.length > 0) {
      Storage.removeItem(storageKey);
    }

    return events;
  }

  private _normalizeEvent(event: StatsigEventInternal): StatsigEventInternal {
    if (event.user) {
      event.user = { ...event.user };
      delete event.user.privateAttributes;
    }

    const extras: StatsigEventExtras = {};
    const currentPage = this._getCurrentPageUrl();
    if (currentPage) {
      extras.statsigMetadata = { currentPage };
    }

    return {
      ...event,
      ...extras,
    };
  }
}
