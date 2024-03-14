import { useContext } from 'react';

import { Log, PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export function useStatsigClient(): PrecomputedEvaluationsInterface {
  const { client } = useContext(StatsigContext);

  if (isPrecomputedEvalClient(client)) {
    return client;
  }

  Log.warn('Attempting to retrive a Statsig StatsigClient but none was set.');
  return NoopEvaluationsClient;
}
