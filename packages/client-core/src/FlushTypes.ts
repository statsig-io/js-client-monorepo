export const FlushTypeValues = {
  ScheduledMaxTime: 'scheduled:max_time',
  ScheduledFullBatch: 'scheduled:full_batch',
  Limit: 'limit',
  Manual: 'manual',
  Shutdown: 'shutdown',
} as const;

export type FlushType = (typeof FlushTypeValues)[keyof typeof FlushTypeValues];
