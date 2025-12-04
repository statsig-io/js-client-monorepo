import { EventBatch } from './EventBatch';
import { EventRetryConstants } from './EventRetryConstants';
import { StatsigEventInternal } from './StatsigEvent';

export class BatchQueue {
  private _batches: EventBatch[] = [];
  private _batchSize: number;

  constructor(batchSize: number = EventRetryConstants.DEFAULT_BATCH_SIZE) {
    this._batchSize = batchSize;
  }

  requeueBatch(batch: EventBatch): number {
    return this._enqueueBatch(batch);
  }

  hasFullBatch(): boolean {
    return this._batches.some(
      (batch) => batch.events.length >= this._batchSize,
    );
  }

  takeNextBatch(): EventBatch | null {
    return this._batches.shift() ?? null;
  }

  takeAllBatches(): EventBatch[] {
    const batches = this._batches;
    this._batches = [];
    return batches;
  }

  createBatches(events: StatsigEventInternal[]): number {
    let i = 0;
    let droppedCount = 0;
    while (i < events.length) {
      const chunk = events.slice(i, i + this._batchSize);
      droppedCount += this._enqueueBatch(new EventBatch(chunk));
      i += this._batchSize;
    }

    return droppedCount;
  }

  private _enqueueBatch(batch: EventBatch): number {
    this._batches.push(batch);

    let droppedEventCount = 0;
    while (this._batches.length > EventRetryConstants.MAX_PENDING_BATCHES) {
      const dropped = this._batches.shift();
      if (dropped) {
        droppedEventCount += dropped.events.length;
      }
    }

    return droppedEventCount;
  }
}
