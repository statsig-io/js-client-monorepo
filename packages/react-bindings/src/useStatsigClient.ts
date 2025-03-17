import { useCallback, useContext, useMemo } from 'react';

import { Log, PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

type HositedFuncs = Pick<
  PrecomputedEvaluationsInterface,
  | 'checkGate'
  | 'getFeatureGate'
  | 'getDynamicConfig'
  | 'getExperiment'
  | 'getLayer'
  | 'getParameterStore'
  | 'logEvent'
>;

type Output = HositedFuncs & {
  client: PrecomputedEvaluationsInterface;
};

export function useStatsigClient(): Output {
  const { client: anyClient, renderVersion } = useContext(StatsigContext);

  const client = useMemo(() => {
    if (isNoopClient(anyClient)) {
      Log.warn('Attempting to retrieve a StatsigClient but none was set.');
      return NoopEvaluationsClient;
    }

    return anyClient;
  }, [anyClient, renderVersion]);

  const deps = [client, renderVersion];

  const checkGate: HositedFuncs['checkGate'] = useCallback((name, options) => {
    return client.checkGate(name, options);
  }, deps);

  const getFeatureGate: HositedFuncs['getFeatureGate'] = useCallback(
    (name, options) => {
      return client.getFeatureGate(name, options);
    },
    deps,
  );

  const getDynamicConfig: HositedFuncs['getDynamicConfig'] = useCallback(
    (name, options) => {
      return client.getDynamicConfig(name, options);
    },
    deps,
  );

  const getExperiment: HositedFuncs['getExperiment'] = useCallback(
    (name, options) => {
      return client.getExperiment(name, options);
    },
    deps,
  );

  const getLayer: HositedFuncs['getLayer'] = useCallback((name, options) => {
    return client.getLayer(name, options);
  }, deps);

  const getParameterStore: HositedFuncs['getParameterStore'] = useCallback(
    (name, options) => {
      return client.getParameterStore(name, options);
    },
    deps,
  );

  const logEvent: HositedFuncs['logEvent'] = useCallback(
    (eventName, value?: string | number, metadata?: Record<string, string>) => {
      if (typeof eventName === 'string') {
        return client.logEvent(eventName, value, metadata);
      }
      return client.logEvent(eventName);
    },
    deps,
  );

  return useMemo(() => {
    return {
      client,
      checkGate,
      getFeatureGate,
      getDynamicConfig,
      getExperiment,
      getLayer,
      getParameterStore,
      logEvent,
    };
  }, [
    client,
    checkGate,
    getFeatureGate,
    getDynamicConfig,
    getExperiment,
    getLayer,
    getParameterStore,
    logEvent,
  ]);
}
