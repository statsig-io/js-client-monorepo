import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

export function isStatsigClient(
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
): client is PrecomputedEvaluationsInterface {
  if (isNoopClient(client)) {
    return false;
  }

  return 'updateUserSync' in client;
}

export function isNoopClient(
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
): boolean {
  return 'isNoop' in client;
}

export function logMissingStatsigUserWarning(): void {
  Log.warn(
    'StatsigUser not provided for On Device Evaluation. Returning default value.',
  );
}
