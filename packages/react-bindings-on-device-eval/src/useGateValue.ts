import { useContext, useMemo } from 'react';

import {
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
): boolean {
  const { client, renderVersion } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useGateValue hook failed to find a valid StatsigOnDeviceEvalClient for gate '${gateName}'.`,
      );
      return NoopOnDeviceEvalClient.checkGate(gateName, user, options);
    }

    return client.checkGate(gateName, user, options);
  }, [gateName, client, renderVersion, options]);

  return gate;
}
