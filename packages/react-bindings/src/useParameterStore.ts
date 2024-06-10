import { useContext, useMemo } from 'react';

import {
  Log,
  ParameterStore,
  ParameterStoreEvaluationOptions,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type useParameterStoreOptions = ParameterStoreEvaluationOptions & {
  user?: StatsigUser;
};

export default function (
  storeName: string,
  options?: useParameterStoreOptions,
): ParameterStore {
  const { client, renderVersion } = useContext(StatsigContext);

  const store = useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getParameterStore(storeName, options);
    }

    if (options?.user != null) {
      Log.warn(
        `useParameterStore hook is not yet supported by StatsigOnDeviceEvalClient.`,
      );
    } else {
      Log.warn(
        `useParameterStore hook failed to find a valid Statsig client for parameter store '${storeName}'.`,
      );
    }

    return NoopEvaluationsClient.getParameterStore(storeName, options);
  }, [storeName, client, renderVersion, options]);

  return store;
}
