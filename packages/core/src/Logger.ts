import { StatsigEventInternal } from './StatsigEvent';
import { NetworkCore } from './NetworkCore';

export class Logger {
  private _queue: StatsigEventInternal[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;

  constructor(private _network: NetworkCore) {
    this._flushTimer = setInterval(() => this._flush(), 10_000);
  }

  enqueue(event: StatsigEventInternal) {
    this._queue.push(event);

    if (this._queue.length > 10) {
      this._flush();
    }
  }

  async shutdown(): Promise<void> {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }

    await this._flush();
  }

  private async _flush(): Promise<void> {
    if (this._queue.length === 0) {
      return;
    }

    const events = this._queue;
    this._queue = [];

    this._network.sendEvents(events).catch(() => {
      // todo
    });
  }
}
