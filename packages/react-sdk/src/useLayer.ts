import { useContext, useMemo } from 'react';

import { Layer, StatsigUser, emptyLayer } from '@sigstat/core';

import {
  isRemoteEvaluationClient,
  logMissingStatsigUserWarning,
} from './RemoteVsLocalUtil';
import StatsigContext from './StatsigContext';

export type LayerResult = {
  layer: Layer;
};

type GetLayerOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  layerName: string,
  options: GetLayerOptions = { logExposure: true, user: null },
): LayerResult {
  const { client } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (isRemoteEvaluationClient(client)) {
      return client.getLayer(layerName);
    }

    if (options.user == null) {
      logMissingStatsigUserWarning();
      return emptyLayer(layerName);
    }

    return client.getLayer(options.user, layerName);
  }, [client.loadingStatus, options]);

  return {
    layer,
  };
}
