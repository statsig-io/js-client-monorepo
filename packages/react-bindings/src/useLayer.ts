import { useContext, useMemo } from 'react';

import { Layer, LayerEvaluationOptions, Log } from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type UseLayerOptions = LayerEvaluationOptions;

export default function (layerName: string, options?: UseLayerOptions): Layer {
  const { client, renderVersion } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useLayer hook failed to find a valid Statsig client for layer '${layerName}'.`,
      );
      return NoopEvaluationsClient.getLayer(layerName, options);
    }

    return client.getLayer(layerName, options);
  }, [layerName, client, renderVersion, options]);

  return layer;
}
