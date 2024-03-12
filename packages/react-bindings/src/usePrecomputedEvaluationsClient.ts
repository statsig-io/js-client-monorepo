import { useContext } from 'react';

import { Log, PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export function usePrecomputedEvaluationsClient(): PrecomputedEvaluationsInterface {
  const { client } = useContext(StatsigContext);

  if (isPrecomputedEvaluationsClient(client)) {
    return client;
  }

  Log.warn(
    'Attempting to retrive a Statsig PrecomputedEvaluationsClient but none was set.',
  );
  return NoopEvaluationsClient;
}
