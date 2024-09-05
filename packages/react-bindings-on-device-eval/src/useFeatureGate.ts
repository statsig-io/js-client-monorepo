import { useContext, useMemo } from 'react';

import {
  FeatureGate,
  FeatureGateEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopOnDeviceEvalClient, isNoopClient } from './NoopOnDeviceEvalClient';
import StatsigContext from './StatsigContext';

export type useFeatureGateOptions = FeatureGateEvaluationOptions;

export default function (
  gateName: string,
  user: StatsigUser,
  options?: useFeatureGateOptions,
): FeatureGate {
  const { client, renderVersion } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useFeatureGate hook failed to find a valid StatsigOnDeviceEvalClient for gate '${gateName}'.`,
      );
      return NoopOnDeviceEvalClient.getFeatureGate(gateName, user, options);
    }

    return client.getFeatureGate(gateName, user, options);
  }, [gateName, client, renderVersion, options]);

  return gate;
}
