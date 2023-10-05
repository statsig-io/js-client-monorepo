import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export function isPrecompoutedEvaluationsClient(
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
): client is PrecomputedEvaluationsInterface {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  Log.warn(
    'StatsigUser not provided for On Device Evaluation. Returning default value.',
  );
}
