import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  EvaluationOptions,
  FeatureGate,
  StatsigUser,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export type UseGateOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  gateName: string,
  options: UseGateOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): FeatureGate {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getFeatureGate(gateName, options);
    }

    return onDeviceClient.getFeatureGate(gateName, options.user, options);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return gate;
}
