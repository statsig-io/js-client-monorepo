import { useContext } from 'react';

import { Log, OnDeviceEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export function useStatsigOnDeviceEvalClient(): OnDeviceEvaluationsInterface {
  const { client } = useContext(StatsigContext);

  if (!isPrecomputedEvalClient(client)) {
    return client;
  }
  Log.warn(
    'Attempting to retrive a Statsig StatsigOnDeviceEvalClient but none was set.',
  );
  return NoopEvaluationsClient;
}
