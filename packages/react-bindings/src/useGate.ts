import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  EvaluationOptions,
  FeatureGate,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseGateOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  gateName: string,
  options: UseGateOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): FeatureGate {
  const { client } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isPrecomputedEvaluationsClient(client)) {
      return client.getFeatureGate(gateName, options);
    }

    if (options.user != null) {
      return client.getFeatureGate(gateName, options.user, options);
    }

    Log.warn(
      `useGate hook failed to find a valid Statsig client for gate '${gateName}'.`,
    );
    return NoopEvaluationsClient.getFeatureGate(gateName, options);
  }, [client.loadingStatus, options]);

  return gate;
}
