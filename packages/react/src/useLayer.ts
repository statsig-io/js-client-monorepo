import { Layer, StatsigUser, emptyLayer } from '@statsig/core';
import { useContext, useMemo } from 'react';
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
    if ('updateUser' in client) {
      return client.getLayer(layerName);
    }

    if (options.user == null) {
      console.log(
        'StatsigUser not provided for Local Evaluation. Returning default value.',
      );
      return emptyLayer(layerName);
    }

    return client.getLayer(options.user, layerName);
  }, [client.loadingStatus, options]);

  return {
    layer,
  };
}
