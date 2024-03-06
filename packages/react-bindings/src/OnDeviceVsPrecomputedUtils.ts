import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

export function isPrecomputedEvaluationsClient(
  client:
    | OnDeviceEvaluationsInterface
    | PrecomputedEvaluationsInterface
    | { isNoop: true },
): client is PrecomputedEvaluationsInterface {
  if ('isNoop' in client) {
    return false;
  }

  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  Log.warn(
    'StatsigUser not provided for On Device Evaluation. Returning default value.',
  );
}
