import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  DynamicConfig,
  EvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseConfigOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export function useConfigImpl(
  hook: 'useExperiment' | 'useDynamicConfig',
  configName: string,
  options: UseConfigOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): DynamicConfig {
  const { client, renderVersion } = useContext(StatsigContext);

  const config = useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getDynamicConfig(configName, options);
    }

    if (options.user != null) {
      return client.getDynamicConfig(configName, options.user, options);
    }

    const type = hook === 'useDynamicConfig' ? 'dynamic config' : 'experiment';
    Log.warn(
      `${hook} hook failed to find a valid Statsig client for ${type} '${configName}'.`,
    );
    return NoopEvaluationsClient.getDynamicConfig(configName, options);
  }, [configName, renderVersion, options]);

  return config;
}
