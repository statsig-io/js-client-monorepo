import { useContext, useMemo } from 'react';

import { Layer, StatsigUser } from '@statsig/client-core';

import StatsigContext from './StatsigContext';

type GetLayerOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  layerName: string,
  options: GetLayerOptions = { logExposure: true, user: null },
): Layer {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getLayer(layerName);
    }

    return onDeviceClient.getLayer(options.user, layerName);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return layer;
}
