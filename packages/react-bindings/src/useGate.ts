import { useContext, useMemo } from 'react';

import { FeatureGate, StatsigUser, emptyFeatureGate } from '@sigstat/core';

import {
  isRemoteEvaluationClient,
  logMissingStatsigUserWarning,
} from './RemoteVsLocalUtil';
import StatsigContext from './StatsigContext';

type CheckGateOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  gateName: string,
  options: CheckGateOptions = { logExposure: true, user: null },
): FeatureGate {
  const { client } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (isRemoteEvaluationClient(client)) {
      return client.getFeatureGate(gateName);
    }

    if (options.user == null) {
      logMissingStatsigUserWarning();
      return emptyFeatureGate(gateName);
    }

    return client.getFeatureGate(options.user, gateName);
  }, [client.loadingStatus, options]);

  return gate;
}
