import { useContext } from 'react';

import { Log, OnDeviceEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export default function (): OnDeviceEvaluationsInterface {
  const { client } = useContext(StatsigContext);

  if (!isPrecomputedEvaluationsClient(client)) {
    return client;
  }
  Log.warn(
    'Attempting to retrive a Statsig OnDeviceEvaluationsClient but none was set.',
  );
  return NoopEvaluationsClient;
}
