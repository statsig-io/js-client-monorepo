import {
  IStatsigOnDeviceEvalClient,
  IStatsigRemoteServerEvalClient,
} from '@statsig-client/core';

export function isRemoteEvaluationClient(
  client: IStatsigOnDeviceEvalClient | IStatsigRemoteServerEvalClient,
): client is IStatsigRemoteServerEvalClient {
  return 'updateUser' in client;
}

export function logMissingStatsigUserWarning(): void {
  // eslint-disable-next-line no-console
  console.warn(
    'StatsigUser not provided for Local Evaluation. Returning default value.',
  );
}
