import { useContext, useMemo } from 'react';

import {
  DEFAULT_EVAL_OPTIONS,
  EvaluationOptions,
  Layer,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseLayerOptions = EvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  layerName: string,
  options: UseLayerOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): Layer {
  const { client } = useContext(StatsigContext);

  const layer = useMemo(() => {
    if (isPrecomputedEvaluationsClient(client)) {
      return client.getLayer(layerName, options);
    }

    if (options.user != null) {
      return client.getLayer(layerName, options.user, options);
    }

    Log.warn(
      `useLayer hook failed to find a valid Statsig client for layer '${layerName}'.`,
    );
    return NoopEvaluationsClient.getLayer(layerName, options);
  }, [client.loadingStatus, options]);

  return layer;
}
