import { useContext, useMemo } from 'react';

import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
} from '@statsig/client-core';
import { Log } from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type UseDynamicConfigOptions = DynamicConfigEvaluationOptions;

export default function (
  configName: string,
  options?: UseDynamicConfigOptions,
): DynamicConfig {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useDynamicConfig hook failed to find a valid StatsigClient for dynamic config '${configName}'.`,
      );
      return NoopEvaluationsClient.getDynamicConfig(configName, options);
    }

    return client.getDynamicConfig(configName, options);
  }, [configName, client, renderVersion, options]);
}
