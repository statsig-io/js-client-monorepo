import { useContext, useMemo } from 'react';
import StatsigContext from './StatsigContext';
import {
  DynamicConfig,
  StatsigUser,
  emptyDynamicConfig,
} from '@dloomb-client/core';
import {
  isRemoteEvaluationClient,
  logMissingStatsigUserWarning,
} from './RemoteVsLocalUtil';

export type DynamicConfigResult = {
  config: DynamicConfig;
};

type GetDynamicConfigOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  configName: string,
  options: GetDynamicConfigOptions = { logExposure: true, user: null },
): DynamicConfigResult {
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

  return {
    config,
  };
}
