import { useContext, useMemo } from 'react';

import {
  Layer,
  LayerEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseLayerOptions = LayerEvaluationOptions & {
  user: StatsigUser | null;
};

export default function (layerName: string, options?: UseLayerOptions): Layer {
  const { client, renderVersion } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getLayer(layerName, options);
    }

    if (options?.user != null) {
      return client.getLayer(layerName, options.user, options);
    }

    Log.warn(
      `useLayer hook failed to find a valid Statsig client for layer '${layerName}'.`,
    );
    return NoopEvaluationsClient.getLayer(layerName, options);
  }, [layerName, client, renderVersion, options]);

  return layer;
}
