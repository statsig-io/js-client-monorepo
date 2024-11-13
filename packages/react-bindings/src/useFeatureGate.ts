import { useContext, useMemo } from 'react';

import {
  FeatureGate,
  FeatureGateEvaluationOptions,
  Log,
} from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type useFeatureGateOptions = FeatureGateEvaluationOptions;

export default function (
  gateName: string,
  options?: useFeatureGateOptions,
): FeatureGate {
  const { client, renderVersion } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useFeatureGate hook failed to find a valid StatsigClient for gate '${gateName}'.`,
      );
      return NoopEvaluationsClient.getFeatureGate(gateName, options);
    }

    return client.getFeatureGate(gateName, options);
  }, [
    gateName,
    client,
    renderVersion,
    ...(options ? Object.values(options) : []),
  ]);

  return gate;
}
