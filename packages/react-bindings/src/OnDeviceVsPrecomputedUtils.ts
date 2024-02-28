import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

export function isPrecomputedEvaluationsClient(
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
): client is PrecomputedEvaluationsInterface {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  Log.warn(
    'StatsigUser not provided for On Device Evaluation. Returning default value.',
  );
}
