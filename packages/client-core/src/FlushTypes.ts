/* eslint-disable no-restricted-syntax */
export enum FlushType {
  ScheduledMaxTime = 'scheduled:max_time',
  ScheduledFullBatch = 'scheduled:full_batch',
  Limit = 'limit',
  Manual = 'manual',
  Shutdown = 'shutdown',
}
