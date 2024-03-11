import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigDataAdapter,
  StatsigUser,
  makeDynamicConfig,
  makeFeatureGate,
  makeLayer,
} from '@statsig/client-core';

const noop = (): void => {
  // noop
};

const NOOP_DETAILS = { reason: 'Error' };

const defaultEvaluation = <T>(type: 'gate' | 'config' | 'layer') => {
  return (...args: unknown[]): T => {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);

    switch (type) {
      case 'gate':
        return makeFeatureGate(name, NOOP_DETAILS) as T;
      case 'config':
        return makeDynamicConfig(name, NOOP_DETAILS) as T;
      case 'layer':
        return makeLayer(name, NOOP_DETAILS) as T;
    }
  };
};

const noopDataAdapter: StatsigDataAdapter = {
  _setInMemoryCache: noop,
  attach: noop,
  getDataSync: () => null,
  getDataAsync: () => Promise.resolve(null),
};

const client: OnDeviceEvaluationsInterface &
  PrecomputedEvaluationsInterface & { isNoop: true } = {
  isNoop: true,
  loadingStatus: 'Uninitialized',
  initializeSync: noop,
  initializeAsync: () => Promise.resolve(),
  shutdown: () => Promise.resolve(),
  updateUserSync: noop,
  updateUserAsync: (_u: StatsigUser) => Promise.resolve(),
  getCurrentUser: () => ({ userID: '' }),
  checkGate: () => false,
  getFeatureGate: defaultEvaluation<FeatureGate>('gate'),
  getDynamicConfig: defaultEvaluation<DynamicConfig>('config'),
  getExperiment: defaultEvaluation<Experiment>('config'),
  getLayer: defaultEvaluation<Layer>('layer'),
  logEvent: noop,
  on: noop,
  off: noop,
  getDataAdapter: () => noopDataAdapter,
};

export const NoopEvaluationsClient = client;
