import {
  OnDeviceEvalutationsInterface,
  PrecomputedEvalutationsInterface,
} from '@sigstat/core';

export function isRemoteEvaluationClient(
  client: OnDeviceEvalutationsInterface | PrecomputedEvalutationsInterface,
): client is PrecomputedEvalutationsInterface {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  // eslint-disable-next-line no-console
  console.warn(
    'StatsigUser not provided for Local Evaluation. Returning default value.',
  );
}
