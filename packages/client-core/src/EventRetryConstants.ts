export const EventRetryConstants = {
  MAX_RETRY_ATTEMPTS: 5,

  DEFAULT_BATCH_SIZE: 100,

  MAX_PENDING_BATCHES: 10,

  TICK_INTERVAL_MS: 1000,

  QUICK_FLUSH_WINDOW_MS: 200,

  get MAX_QUEUED_EVENTS(): number {
    return this.DEFAULT_BATCH_SIZE * this.MAX_PENDING_BATCHES;
  },
} as const;
