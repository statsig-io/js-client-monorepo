import { useCallback, useContext, useMemo } from 'react';

import { Log, OnDeviceEvaluationsInterface } from '@statsig/client-core';

import { NoopOnDeviceEvalClient, isNoopClient } from './NoopOnDeviceEvalClient';
import StatsigContext from './StatsigContext';

type HositedFuncs = Pick<
  OnDeviceEvaluationsInterface,
  | 'checkGate'
  | 'getFeatureGate'
  | 'getDynamicConfig'
  | 'getExperiment'
  | 'getLayer'
  | 'logEvent'
>;

type Output = HositedFuncs & {
  client: OnDeviceEvaluationsInterface;
};

export function useStatsigOnDeviceEvalClient(): Output {
  const { client: anyClient, renderVersion } = useContext(StatsigContext);

  const client = useMemo(() => {
    if (isNoopClient(anyClient)) {
      Log.warn(
        'Attempting to retrieve a StatsigOnDeviceEvalClient but none was set.',
      );
      return NoopOnDeviceEvalClient;
    }

    return anyClient;
  }, [anyClient, renderVersion]);

  const deps = [client, renderVersion];

  const checkGate: HositedFuncs['checkGate'] = useCallback(
    (name, user, options) => {
      return client.checkGate(name, user, options);
    },
    deps,
  );

  const getFeatureGate: HositedFuncs['getFeatureGate'] = useCallback(
    (name, user, options) => {
      return client.getFeatureGate(name, user, options);
    },
    deps,
  );

  const getDynamicConfig: HositedFuncs['getDynamicConfig'] = useCallback(
    (name, user, options) => {
      return client.getDynamicConfig(name, user, options);
    },
    deps,
  );

  const getExperiment: HositedFuncs['getExperiment'] = useCallback(
    (name, user, options) => {
      return client.getExperiment(name, user, options);
    },
    deps,
  );

  const getLayer: HositedFuncs['getLayer'] = useCallback((name, options) => {
    return client.getLayer(name, options);
  }, deps);

  const logEvent: HositedFuncs['logEvent'] = useCallback(
    (
      eventName,
      user,
      value?: string | number,
      metadata?: Record<string, string>,
    ) => {
      if (typeof eventName === 'string') {
        return client.logEvent(eventName, user, value, metadata);
      }
      return client.logEvent(eventName, user);
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
      logEvent,
    };
  }, [
    client,
    checkGate,
    getFeatureGate,
    getDynamicConfig,
    getExperiment,
    getLayer,
    logEvent,
  ]);
}
