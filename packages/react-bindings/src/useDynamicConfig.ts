import { useContext, useMemo } from 'react';

import { DynamicConfig, StatsigUser } from '@statsig/client-core';

import StatsigContext from './StatsigContext';

type GetDynamicConfigOptions = {
  logExposure?: boolean;
  user: StatsigUser | null;
};

export default function (
  configName: string,
  options: GetDynamicConfigOptions = { logExposure: true, user: null },
): DynamicConfig {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const config = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getDynamicConfig(configName);
    }

    return onDeviceClient.getDynamicConfig(options.user, configName);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return config;
}
