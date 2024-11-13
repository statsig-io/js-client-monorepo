import { useContext, useMemo } from 'react';

import { FeatureGateEvaluationOptions, Log } from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type useFeatureGateOptions = FeatureGateEvaluationOptions;

export default function (
  gateName: string,
  options?: useFeatureGateOptions,
): boolean {
  const { client, renderVersion } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useGateValue hook failed to find a valid StatsigClient for gate '${gateName}'.`,
      );
      return NoopEvaluationsClient.checkGate(gateName, options);
    }

    return client.checkGate(gateName, options);
  }, [
    gateName,
    client,
    renderVersion,
    ...(options ? Object.values(options) : []),
  ]);

  return gate;
}
