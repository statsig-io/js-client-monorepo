import { useContext, useMemo } from 'react';

import { FeatureGate, StatsigUser } from '@statsig/client-core';

import StatsigContext from './StatsigContext';

type CheckGateOptions = {
  logExposure?: boolean;
  user: StatsigUser | null;
};

export default function (
  gateName: string,
  options: CheckGateOptions = { logExposure: true, user: null },
): FeatureGate {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const gate = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getFeatureGate(gateName);
    }

    return onDeviceClient.getFeatureGate(options.user, gateName);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return gate;
}
