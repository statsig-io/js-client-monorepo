import { Log } from './Log';
import { NetworkCore } from './NetworkCore';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigEventInternal, isExposureEvent } from './StatsigEvent';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';

const DEFAULT_QUEUE_SIZE = 50;
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

const MAX_DEDUPER_KEYS = 1000;
const DEDUPER_WINDOW_DURATION_MS = 60_000;

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

export class EventLogger {
  private _queue: (StatsigEventInternal & StatsigEventExtras)[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;
  private _lastExposureMap: Record<string, number> = {};

  private _maxQueueSize: number;

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

    try {
      await this._sendEvents(events);
    } catch {
      Log.warn('Failed to flush events.');
    }
  }

  private async _sendEvents(
    events: StatsigEventInternal[],
  ): Promise<SendEventsResponse> {
    const api = this._options?.api ?? DEFAULT_API;
    const result = await this._network.post({
      sdkKey: this._sdkKey,
      url: `${api}/rgstr`,
      data: {
        events,
      },
      retries: 3,
    });

    if (result) {
      const response = JSON.parse(result) as SendEventsResponse;
      this._emitter({
        event: 'logs_flushed',
        events,
      });
      return response;
    }

    return { success: false };
  }
}
