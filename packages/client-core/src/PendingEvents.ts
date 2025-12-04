import { Log } from './Log';
import { StatsigEventInternal } from './StatsigEvent';

export class PendingEvents {
  private _pendingEvents: StatsigEventInternal[] = [];
  private _maxEventsCapacity: number;
  private _batchSize: number;

  constructor(maxEventsCapacity: number, batchSize: number) {
    this._maxEventsCapacity = maxEventsCapacity;
    this._batchSize = batchSize;
  }

  addToPendingEventsQueue(event: StatsigEventInternal): void {
    this._pendingEvents.push(event);
    Log.debug('Enqueued Event:', event);
  }

  hasEventsForFullBatch(): boolean {
    return this._pendingEvents.length >= this._batchSize;
  }
}
