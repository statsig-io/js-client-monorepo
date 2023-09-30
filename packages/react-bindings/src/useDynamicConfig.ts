import { useContext, useMemo } from 'react';

import { DynamicConfig, StatsigUser, emptyDynamicConfig } from '@sigstat/core';

import {
  isRemoteEvaluationClient,
  logMissingStatsigUserWarning,
} from './RemoteVsLocalUtil';
import StatsigContext from './StatsigContext';

type GetDynamicConfigOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  configName: string,
  options: GetDynamicConfigOptions = { logExposure: true, user: null },
): DynamicConfig {
  const { client } = useContext(StatsigContext);

  const config = useMemo(() => {
    if (isRemoteEvaluationClient(client)) {
      return client.getDynamicConfig(configName);
    }

    if (options.user == null) {
      logMissingStatsigUserWarning();
      return emptyDynamicConfig(configName);
    }

    return client.getDynamicConfig(options.user, configName);
  }, [client.loadingStatus, options]);

  return config;
}
