import { Log } from './Log';
import { NetworkCore } from './NetworkCore';
import { StatsigEventInternal, isExposureEvent } from './StatsigEvent';

const MAX_QUEUE = 700;
const MIN_QUEUE = 50;
const MAX_DEDUPER_KEYS = 1000;
const _60_SECONDS = 60_000;
const _10_SECONDS = 10_000;

type SendEventsResponse = {
  success: boolean;
};

export class EventLogger {
  private _queue: StatsigEventInternal[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;
  private _lastExposureMap: Record<string, number> = {};
  private _queueLimit = MIN_QUEUE;

  constructor(private _network: NetworkCore) {
    this._flushTimer = setInterval(() => this._flushAndForget(), _10_SECONDS);
  }

  enqueue(event: StatsigEventInternal): void {
    if (!this._shouldLogEvent(event)) {
      return;
    }

    this._queue.push(event);

    if (this._queue.length > this._queueLimit) {
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

    if (previous && now - previous < _60_SECONDS) {
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

    this._queueLimit = Math.min(this._queueLimit + MIN_QUEUE, MAX_QUEUE);

    try {
      await this._sendEvents(events);
    } catch {
      Log.warn('Failed to flush events.');
    }

    this._queueLimit = Math.max(this._queueLimit - MIN_QUEUE, MIN_QUEUE);
  }

  private async _sendEvents(
    events: StatsigEventInternal[],
  ): Promise<SendEventsResponse> {
    const result = await this._network.post<SendEventsResponse>({
      url: `rgstr`,
      data: {
        events,
      },
      retries: 3,
    });

    return result ?? { success: false };
  }
}
