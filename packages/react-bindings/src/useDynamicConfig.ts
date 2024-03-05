import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  DynamicConfig,
  EvaluationOptions,
  StatsigUser,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export type UseDynamicConfigOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  configName: string,
  options: UseDynamicConfigOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): DynamicConfig {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const config = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getDynamicConfig(configName, options);
    }

    return onDeviceClient.getDynamicConfig(configName, options.user, options);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return config;
}
