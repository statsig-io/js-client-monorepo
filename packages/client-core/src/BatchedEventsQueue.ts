import { EventBatch } from './EventBatch';
import { EventRetryConstants } from './EventRetryConstants';
import { StatsigEventInternal } from './StatsigEvent';

export class BatchQueue {
  private _batches: EventBatch[] = [];

  requeueBatch(batch: EventBatch): number {
    return this._enqueueBatch(batch);
  }

  hasFullBatch(): boolean {
    return this._batches.some(
      (batch) => batch.events.length >= EventRetryConstants.DEFAULT_BATCH_SIZE,
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
      const chunk = events.slice(i, i + EventRetryConstants.DEFAULT_BATCH_SIZE);
      droppedCount += this._enqueueBatch(new EventBatch(chunk));
      i += EventRetryConstants.DEFAULT_BATCH_SIZE;
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
