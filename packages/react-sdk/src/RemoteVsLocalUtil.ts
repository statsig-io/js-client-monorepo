import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export function isRemoteEvaluationClient(
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
): client is PrecomputedEvaluationsInterface {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  // eslint-disable-next-line no-console
  console.warn(
    'StatsigUser not provided for Local Evaluation. Returning default value.',
  );
}
