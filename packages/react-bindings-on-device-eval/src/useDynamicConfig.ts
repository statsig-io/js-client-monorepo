import { useContext, useMemo } from 'react';

import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  StatsigUser,
} from '@statsig/client-core';
import { Log } from '@statsig/client-core';

import { NoopOnDeviceEvalClient, isNoopClient } from './NoopOnDeviceEvalClient';
import StatsigContext from './StatsigContext';

export type UseDynamicConfigOptions = DynamicConfigEvaluationOptions;

export default function (
  configName: string,
  user: StatsigUser,
  options?: UseDynamicConfigOptions,
): DynamicConfig {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useDynamicConfig hook failed to find a valid StatsigOnDeviceEvalClient for dynamic config '${configName}'.`,
      );
      return NoopOnDeviceEvalClient.getDynamicConfig(configName, user, options);
    }

    return client.getDynamicConfig(configName, user, options);
  }, [configName, client, renderVersion, options]);
}
