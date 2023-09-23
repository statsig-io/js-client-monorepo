import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
} from '@statsig-client/core';

export function isRemoteEvaluationClient(
  client: IStatsigLocalEvalClient | IStatsigRemoteEvalClient,
): client is IStatsigRemoteEvalClient {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning() {
  // eslint-disable-next-line no-console
  console.warn(
    'StatsigUser not provided for Local Evaluation. Returning default value.',
  );
}
