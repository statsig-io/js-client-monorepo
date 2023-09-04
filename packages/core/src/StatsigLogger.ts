import { StatsigEvent } from './StatsigEvent';

export interface LoggerNetworking {
  sendEvents(events: StatsigEvent[]): Promise<unknown>;
}

export class StatsigLogger {
  private _queue: StatsigEvent[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;

  constructor(private _network: LoggerNetworking) {
    this._flushTimer = setInterval(() => this._flush(), 10_000);
  }

  enqueue(event: StatsigEvent) {
    this._queue.push(event);

    if (this._queue.length > 10) {
      this._flush();
    }
  }

  private _flush() {
    if (this._queue.length === 0) {
      return;
    }

    const events = this._queue;
    this._queue = [];

    this._network.sendEvents(events).catch(() => {});
  }
}
