import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  EvaluationOptions,
  Layer,
  StatsigUser,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export type UseLayerOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  layerName: string,
  options: UseLayerOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): Layer {
  const { precomputedClient, onDeviceClient } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (options.user == null) {
      return precomputedClient.getLayer(layerName, options);
    }

    return onDeviceClient.getLayer(layerName, options.user, options);
  }, [precomputedClient.loadingStatus, onDeviceClient.loadingStatus, options]);

  return layer;
}
