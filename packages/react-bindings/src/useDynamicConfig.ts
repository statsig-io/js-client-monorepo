import { useContext, useMemo } from 'react';

import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  StatsigUser,
} from '@statsig/client-core';
import { Log } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseDynamicConfigOptions = DynamicConfigEvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  configName: string,
  options?: UseDynamicConfigOptions,
): DynamicConfig {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getDynamicConfig(configName, options);
    }

    if (options?.user != null) {
      return client.getDynamicConfig(configName, options.user, options);
    }

    Log.warn(
      `useDynamicConfig hook failed to find a valid Statsig client for dynamic config '${configName}'.`,
    );
    return NoopEvaluationsClient.getDynamicConfig(configName, options);
  }, [configName, renderVersion, options]);
}
