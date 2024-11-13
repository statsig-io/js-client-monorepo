import { useContext, useMemo } from 'react';

import {
  Log,
  ParameterStore,
  ParameterStoreEvaluationOptions,
} from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type useParameterStoreOptions = ParameterStoreEvaluationOptions;

export default function (
  storeName: string,
  options?: useParameterStoreOptions,
): ParameterStore {
  const { client, renderVersion } = useContext(StatsigContext);

  const store = useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useParameterStore hook failed to find a valid StatsigClient for parameter store '${storeName}'.`,
      );
      return NoopEvaluationsClient.getParameterStore(storeName, options);
    }

    return client.getParameterStore(storeName, options);
  }, [
    storeName,
    client,
    renderVersion,
    ...(options ? Object.values(options) : []),
  ]);

  return store;
}
