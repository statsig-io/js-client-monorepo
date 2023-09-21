import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
} from '@statsig/core';

export function isRemoteEvaluationClient(
  client: IStatsigLocalEvalClient | IStatsigRemoteEvalClient,
): client is IStatsigRemoteEvalClient {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning() {
  console.warn(
    'StatsigUser not provided for Local Evaluation. Returning default value.',
  );
}
