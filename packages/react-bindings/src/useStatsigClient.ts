import { useCallback, useContext, useMemo } from 'react';

import { Log, PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

type HositedFuncs = Pick<
  PrecomputedEvaluationsInterface,
  | 'checkGate'
  | 'getFeatureGate'
  | 'getDynamicConfig'
  | 'getExperiment'
  | 'getLayer'
  | 'logEvent'
>;

export function useStatsigClient(): HositedFuncs & {
  client: PrecomputedEvaluationsInterface;
} {
  const { client: anyClient, renderVersion } = useContext(StatsigContext);

  const client = useMemo(() => {
    if (isPrecomputedEvalClient(anyClient)) {
      return anyClient;
    }

    Log.warn('Attempting to retrieve a StatsigClient but none was set.');
    return NoopEvaluationsClient;
  }, [anyClient, renderVersion]);

  const deps = [client, renderVersion];

  return useMemo(() => {
    return {
      client,
      checkGate: useCallback((name, options) => {
        return client.checkGate(name, options);
      }, deps),
      getFeatureGate: useCallback((name, options) => {
        return client.getFeatureGate(name, options);
      }, deps),
      getDynamicConfig: useCallback((name, options) => {
        return client.getDynamicConfig(name, options);
      }, deps),
      getExperiment: useCallback((name, options) => {
        return client.getExperiment(name, options);
      }, deps),
      getLayer: useCallback((name, options) => {
        return client.getLayer(name, options);
      }, deps),
      logEvent: useCallback(
        (
          eventName,
          value?: string | number,
          metadata?: Record<string, string>,
        ) => {
          if (typeof eventName === 'string') {
            return client.logEvent(eventName, value, metadata);
          }
          return client.logEvent(eventName);
        },
        deps,
      ),
    };
  }, deps);
}
