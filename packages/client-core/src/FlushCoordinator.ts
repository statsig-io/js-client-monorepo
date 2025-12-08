import { BatchQueue } from './BatchedEventsQueue';
import { ErrorBoundary } from './ErrorBoundary';
import { EventBatch } from './EventBatch';
import { EventRetryConstants } from './EventRetryConstants';
import { EventSender } from './EventSender';
import { FlushInterval } from './FlushInterval';
import { FlushType } from './FlushTypes';
import { _DJB2 } from './Hashing';
import { Log } from './Log';
import { NetworkCore, RETRYABLE_CODES } from './NetworkCore';
import { PendingEvents } from './PendingEvents';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal } from './StatsigEvent';
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

type PrepareFlushCallBack = () => void;

export class FlushCoordinator {
  private _flushInterval: FlushInterval;
  private _batchQueue: BatchQueue;
  private _pendingEvents: PendingEvents;
  private _eventSender: EventSender;

  private _onPrepareFlush: PrepareFlushCallBack;

  private _errorBoundary: ErrorBoundary;

  private _cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private _maxIntervalTimer: ReturnType<typeof setTimeout> | null = null;
  private _hasRunQuickFlush = false;
  private _currentFlushPromise: Promise<void> | null = null;
  private _creationTime = Date.now();

  private _sdkKey: string;
  private _storageKey: string | null = null;

  constructor(
    batchQueue: BatchQueue,
    pendingEvents: PendingEvents,
    onPrepareFlush: PrepareFlushCallBack,
    // For Event Sender
    sdkKey: string,
    network: NetworkCore,
    emitter: StatsigClientEmitEventFunc,
    logEventUrlConfig: UrlConfiguration,
    options: StatsigOptionsCommon<NetworkConfigCommon> | null,
    loggingEnabled: LoggingEnabledOption,
    errorBoundary: ErrorBoundary,
  ) {
    this._flushInterval = new FlushInterval();
    this._batchQueue = batchQueue;
    this._pendingEvents = pendingEvents;
    this._onPrepareFlush = onPrepareFlush;
    this._errorBoundary = errorBoundary;
    this._sdkKey = sdkKey;

    this._eventSender = new EventSender(
      sdkKey,
      network,
      emitter,
      logEventUrlConfig,
      options,
      loggingEnabled,
    );
  }

  setLoggingEnabled(loggingEnabled: LoggingEnabledOption): void {
    this._eventSender.setLoggingEnabled(loggingEnabled);
  }

  setLogEventCompressionMode(mode: LogEventCompressionMode): void {
    this._eventSender.setLogEventCompressionMode(mode);
  }

  startScheduledFlushCycle(): void {
    this._scheduleNextFlush();
  }

  stopScheduledFlushCycle(): void {
    this._clearAllTimers();
  }

  addEvent(event: StatsigEventInternal): void {
    this._pendingEvents.addToPendingEventsQueue(event);
    if (this._pendingEvents.hasEventsForFullBatch()) {
      this.processLimitFlush();
    }
  }

  async processManualFlush(): Promise<void> {
    if (this._currentFlushPromise) {
      await this._currentFlushPromise;
    }

    this._currentFlushPromise = this._executeFlush(FlushType.Manual).finally(
      () => {
        this._currentFlushPromise = null;
        this._scheduleNextFlush();
      },
    );

    return this._currentFlushPromise;
  }

  async processShutdown(): Promise<void> {
    if (this._currentFlushPromise) {
      await this._currentFlushPromise;
    }

    this._currentFlushPromise = this._executeFlush(FlushType.Shutdown)
      .catch((error) => {
        Log.error(`Error during shutdown flush: ${error}`);
      })
      .finally(() => {
        this._currentFlushPromise = null;
      });

    return this._currentFlushPromise;
  }

  private async _executeFlush(flushType: FlushType) {
    this._clearAllTimers();

    try {
      this._prepareQueueForFlush(flushType);
      const batches = this._batchQueue.takeAllBatches();
      if (batches.length === 0) {
        return;
      }
      await Promise.all(
        batches.map((batch) => this._processOneBatch(batch, flushType)),
      );
    } finally {
      this._scheduleNextFlush();
    }
  }

  checkQuickFlush(): void {
    if (this._hasRunQuickFlush) {
      return;
    }

    if (
      Date.now() - this._creationTime >
      EventRetryConstants.QUICK_FLUSH_WINDOW_MS
    ) {
      return;
    }

    this._hasRunQuickFlush = true;

    setTimeout(() => {
      this.processManualFlush().catch((error) => {
        Log.warn('Quick flush failed:', error);
      });
    }, EventRetryConstants.QUICK_FLUSH_WINDOW_MS);
  }

  private _attemptScheduledFlush(): void {
    if (this._currentFlushPromise) {
      this._scheduleNextFlush();
      return;
    }
    const shouldFlushBySize = this.containsAtLeastOneFullBatch();
    const shouldFlushByTime = this._flushInterval.hasReachedMaxInterval();

    if (!shouldFlushBySize && !shouldFlushByTime) {
      this._scheduleNextFlush();
      return;
    }

    this._flushInterval.markFlushAttempt();

    let flushType: FlushType;
    if (shouldFlushBySize) {
      flushType = FlushType.ScheduledFullBatch;
    } else {
      flushType = FlushType.ScheduledMaxTime;
    }

    this._currentFlushPromise = this._processNextBatch(flushType)
      .then(() => {
        //This discards boolean result. Main goal here is to track completion
      })
      .catch((error) => {
        Log.error('Error during scheduled flush:', error);
      })
      .finally(() => {
        this._currentFlushPromise = null;
        this._scheduleNextFlush();
      });
  }

  processLimitFlush(): void {
    if (!this._flushInterval.hasCompletelyRecoveredFromBackoff()) {
      return;
    }
    if (this._currentFlushPromise) {
      return;
    }

    this._currentFlushPromise = this._processLimitFlushInternal()
      .catch((error) => {
        Log.error(`Error during limit flush`, error);
      })
      .finally(() => {
        this._currentFlushPromise = null;
        this._scheduleNextFlush();
      });
  }

  private async _processLimitFlushInternal(): Promise<void> {
    const success = await this._processNextBatch(FlushType.Limit);
    if (!success) {
      return;
    }

    while (
      this._flushInterval.hasCompletelyRecoveredFromBackoff() &&
      this.containsAtLeastOneFullBatch()
    ) {
      const success = await this._processNextBatch(FlushType.Limit);
      if (!success) {
        break;
      }
    }
  }

  private _scheduleNextFlush(): void {
    this._clearAllTimers();

    const cooldownDelay = Math.max(
      0,
      this._flushInterval.getTimeUntilNextFlush(),
    );

    this._cooldownTimer = setTimeout(() => {
      this._cooldownTimer = null;
      this._attemptScheduledFlush();
    }, cooldownDelay);

    const maxIntervalDelay = Math.max(
      0,
      this._flushInterval.getTimeTillMaxInterval(),
    );

    this._maxIntervalTimer = setTimeout(() => {
      this._maxIntervalTimer = null;
      this._attemptScheduledFlush();
    }, maxIntervalDelay);
  }

  private _clearAllTimers(): void {
    if (this._cooldownTimer !== null) {
      clearTimeout(this._cooldownTimer);
      this._cooldownTimer = null;
    }
    if (this._maxIntervalTimer !== null) {
      clearTimeout(this._maxIntervalTimer);
      this._maxIntervalTimer = null;
    }
  }

  private async _processNextBatch(flushType: FlushType): Promise<boolean> {
    this._prepareQueueForFlush(flushType);

    const batch = this._batchQueue.takeNextBatch();
    if (!batch) {
      return false;
    }
    return this._processOneBatch(batch, flushType);
  }

  private async _processOneBatch(
    batch: EventBatch,
    flushType: FlushType,
  ): Promise<boolean> {
    const result = await this._eventSender.sendBatch(batch);

    if (result.success) {
      this._flushInterval.adjustForSuccess();
      return true;
    }

    this._flushInterval.adjustForFailure();
    this._handleFailure(batch, flushType, result.statusCode);
    return false;
  }

  private _prepareQueueForFlush(flushType: FlushType): void {
    this._onPrepareFlush();

    const droppedCount = this.convertPendingEventsToBatches();
    if (droppedCount > 0) {
      Log.warn(`Dropped ${droppedCount} events`);
      this._errorBoundary.logDroppedEvents(
        droppedCount,
        `Batch queue limit reached`,
        {
          loggingInterval: this._flushInterval.getCurrentIntervalMs(),
          batchSize: this._batchQueue.batchSize(),
          maxPendingBatches: EventRetryConstants.MAX_PENDING_BATCHES,
          flushType: flushType,
        },
      );
    }
  }

  containsAtLeastOneFullBatch(): boolean {
    return (
      this._pendingEvents.hasEventsForFullBatch() ||
      this._batchQueue.hasFullBatch()
    );
  }

  convertPendingEventsToBatches(): number {
    if (this._pendingEvents.isEmpty()) {
      return 0;
    }
    const allEvents = this._pendingEvents.takeAll();
    return this._batchQueue.createBatches(allEvents);
  }

  private _handleFailure(
    batch: EventBatch,
    flushType: FlushType,
    statusCode: number,
  ): void {
    if (flushType === FlushType.Shutdown) {
      Log.warn(
        `${flushType} flush failed during shutdown. ` +
          `${batch.events.length} event(s) will be saved to storage for retry in next session.`,
      );
      this._saveShutdownFailedEventsToStorage(batch.events);
      this._errorBoundary.logEventRequestFailure(
        batch.events.length,
        `flush failed during shutdown - saved to storage`,
        flushType,
        statusCode,
      );
      return;
    }

    if (!RETRYABLE_CODES.has(statusCode)) {
      Log.warn(
        `${flushType} flush failed after ${batch.attempts} attempt(s). ` +
          `${batch.events.length} event(s) will be dropped. Non-retryable error: ${statusCode}`,
      );
      this._errorBoundary.logEventRequestFailure(
        batch.events.length,
        `non-retryable error`,
        flushType,
        statusCode,
      );
      return;
    }

    if (batch.attempts >= EventRetryConstants.MAX_RETRY_ATTEMPTS) {
      Log.warn(
        `${flushType} flush failed after ${batch.attempts} attempt(s). ` +
          `${batch.events.length} event(s) will be dropped.`,
      );
      this._errorBoundary.logEventRequestFailure(
        batch.events.length,
        `max retry attempts exceeded`,
        flushType,
        statusCode,
      );
      return;
    }

    batch.incrementAttempts();
    const droppedCount = this._batchQueue.requeueBatch(batch);

    if (droppedCount > 0) {
      Log.warn(
        `Failed to requeue batch : dropped ${droppedCount} events due to full queue`,
      );
      this._errorBoundary.logDroppedEvents(
        droppedCount,
        `Batch queue limit reached`,
        {
          loggingInterval: this._flushInterval.getCurrentIntervalMs(),
          batchSize: this._batchQueue.batchSize(),
          maxPendingBatches: EventRetryConstants.MAX_PENDING_BATCHES,
          flushType: flushType,
        },
      );
    }
  }

  async loadAndRetryShutdownFailedEvents(): Promise<void> {
    const storageKey = this._getStorageKey();

    try {
      const events = this._getShutdownFailedEventsFromStorage(storageKey);
      if (events.length === 0) {
        return;
      }

      Log.debug(
        `Loading ${events.length} failed shutdown event(s) from storage for retry`,
      );

      Storage.removeItem(storageKey);

      events.forEach((event) => {
        this.addEvent(event);
      });

      await this.processManualFlush();
    } catch (error) {
      Log.warn('Failed to load and retry failed shutdown events:', error);
    }
  }

  private _getStorageKey(): string {
    if (!this._storageKey) {
      this._storageKey = `statsig.failed_shutdown_events.${_DJB2(this._sdkKey)}`;
    }
    return this._storageKey;
  }

  private _saveShutdownFailedEventsToStorage(
    events: StatsigEventInternal[],
  ): void {
    const storageKey = this._getStorageKey();

    try {
      const existingEvents =
        this._getShutdownFailedEventsFromStorage(storageKey);
      let allEvents = [...existingEvents, ...events];

      if (allEvents.length > EventRetryConstants.MAX_LOCAL_STORAGE) {
        allEvents = allEvents.slice(-EventRetryConstants.MAX_LOCAL_STORAGE);
      }

      _setObjectInStorage(storageKey, allEvents);
      Log.debug(
        `Saved ${events.length} failed shutdown event(s) to storage (total stored: ${allEvents.length})`,
      );
    } catch (error) {
      Log.warn('Unable to save failed shutdown events to storage:', error);
    }
  }

  private _getShutdownFailedEventsFromStorage(
    storageKey: string,
  ): StatsigEventInternal[] {
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
}
