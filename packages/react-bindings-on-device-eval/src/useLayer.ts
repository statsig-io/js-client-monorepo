import { useContext, useMemo } from 'react';

import {
  Layer,
  LayerEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopOnDeviceEvalClient, isNoopClient } from './NoopOnDeviceEvalClient';
import StatsigContext from './StatsigContext';

export type UseLayerOptions = LayerEvaluationOptions;

export default function (
  layerName: string,
  user: StatsigUser,
  options?: UseLayerOptions,
): Layer {
  const { client, renderVersion } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useLayer hook failed to find a valid StatsigOnDeviceEvalClient for layer '${layerName}'.`,
      );
      return NoopOnDeviceEvalClient.getLayer(layerName, user, options);
    }

    return client.getLayer(layerName, user, options);
  }, [layerName, client, renderVersion, options]);

  return layer;
}
