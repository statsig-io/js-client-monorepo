import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigDataAdapter,
  makeDynamicConfig,
  makeFeatureGate,
  makeLayer,
} from '@statsig/client-core';

const _noop = (): void => {
  // noop
};

const _noopAsync = (): Promise<void> => Promise.resolve();

const NOOP_DETAILS = { reason: 'Error' };

const _defaultEvaluation = <T>(type: 'gate' | 'config' | 'layer') => {
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

const _noopDataAdapter: StatsigDataAdapter = {
  _setInMemoryCache: _noop,
  attach: _noop,
  getDataSync: () => null,
  getDataAsync: () => Promise.resolve(null),
  setData: _noop,
  prefetchData: _noopAsync,
};

const _client: OnDeviceEvaluationsInterface &
  PrecomputedEvaluationsInterface & { isNoop: true } = {
  isNoop: true,
  loadingStatus: 'Uninitialized',
  initializeSync: _noop,
  initializeAsync: _noopAsync,
  shutdown: _noopAsync,
  updateRuntimeOptions: _noop,
  updateUserSync: _noop,
  updateUserAsync: _noopAsync,
  getCurrentUser: () => ({ userID: '' }),
  checkGate: () => false,
  getFeatureGate: _defaultEvaluation<FeatureGate>('gate'),
  getDynamicConfig: _defaultEvaluation<DynamicConfig>('config'),
  getExperiment: _defaultEvaluation<Experiment>('config'),
  getLayer: _defaultEvaluation<Layer>('layer'),
  logEvent: _noop,
  on: _noop,
  off: _noop,
  getDataAdapter: () => _noopDataAdapter,
};

export const NoopEvaluationsClient = _client;
