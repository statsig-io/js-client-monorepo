import { Log } from './Log';
import { StatsigEventInternal } from './StatsigEvent';

export class PendingEvents {
  private _pendingEvents: StatsigEventInternal[] = [];
  private _batchSize: number;

  constructor(batchSize: number) {
    this._batchSize = batchSize;
  }

  addToPendingEventsQueue(event: StatsigEventInternal): void {
    this._pendingEvents.push(event);
    Log.debug('Enqueued Event:', event);
  }

  hasEventsForFullBatch(): boolean {
    return this._pendingEvents.length >= this._batchSize;
  }

  takeAll(): StatsigEventInternal[] {
    const events = this._pendingEvents;
    this._pendingEvents = [];
    return events;
  }

  isEmpty(): boolean {
    return this._pendingEvents.length === 0;
  }
}
