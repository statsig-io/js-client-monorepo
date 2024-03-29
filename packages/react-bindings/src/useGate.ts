import { useContext, useMemo } from 'react';

import {
  FeatureGate,
  FeatureGateEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseGateOptions = FeatureGateEvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  gateName: string,
  options?: UseGateOptions,
): FeatureGate {
  const { client, renderVersion } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getFeatureGate(gateName, options);
    }

    if (options?.user != null) {
      return client.getFeatureGate(gateName, options.user, options);
    }

    Log.warn(
      `useGate hook failed to find a valid Statsig client for gate '${gateName}'.`,
    );
    return NoopEvaluationsClient.getFeatureGate(gateName, options);
  }, [gateName, renderVersion, options]);

  return gate;
}
