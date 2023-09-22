import { StatsigEventInternal } from './StatsigEvent';
import { NetworkCore } from './NetworkCore';

export class Logger {
  private _queue: StatsigEventInternal[] = [];
  private _flushTimer: ReturnType<typeof setInterval> | null;

  constructor(private _network: NetworkCore) {
    this._flushTimer = setInterval(() => this._flushAndForget(), 10_000);
  }

  enqueue(event: StatsigEventInternal) {
    this._queue.push(event);

    if (this._queue.length > 10) {
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
      await this._network.sendEvents(events);
    } catch {
      // @todo
    }
  }
}
