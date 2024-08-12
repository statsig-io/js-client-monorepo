import {
  DynamicConfig,
  ErrorBoundary,
  EvaluationsDataAdapter,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  ParameterStore,
  PrecomputedEvaluationsInterface,
  SpecsDataAdapter,
  _makeDynamicConfig,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';

const _noop = (): void => {
  // noop
};

const _noopAsync = (): Promise<void> => Promise.resolve();

const NOOP_DETAILS = { reason: 'Error:NoClient' };

const _defaultEvaluation = <T>(
  type: 'gate' | 'config' | 'layer' | 'param_store',
) => {
  return (...args: unknown[]): T => {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);

    switch (type) {
      case 'gate':
        return _makeFeatureGate(name, NOOP_DETAILS, null) as T;
      case 'config':
        return _makeDynamicConfig(name, NOOP_DETAILS, null) as T;
      case 'layer':
        return _makeLayer(name, NOOP_DETAILS, null) as T;
      case 'param_store':
        return { name } as T;
    }
  };
};

const _noopDataAdapter: EvaluationsDataAdapter & SpecsDataAdapter = {
  __primeInMemoryCache: _noop,
  attach: _noop,
  getDataSync: () => null,
  getDataAsync: () => Promise.resolve(null),
  setData: _noop,
  setDataLegacy: _noop,
  prefetchData: _noopAsync,
};

const context = {
  sdkKey: '',
  options: {},
  values: null,
  user: { userID: '' },
  errorBoundary: {} as ErrorBoundary,
};

const _client: OnDeviceEvaluationsInterface &
  PrecomputedEvaluationsInterface & { isNoop: true } = {
  isNoop: true,
  loadingStatus: 'Uninitialized',
  initializeSync: _noop,
  initializeAsync: _noopAsync,
  shutdown: _noopAsync,
  flush: _noopAsync,
  updateRuntimeOptions: _noop,
  updateUserSync: _noop,
  updateUserAsync: _noopAsync,
  getContext: () => ({
    ...context,
  }),
  getAsyncContext: async () => ({
    ...context,
    session: {
      data: { sessionID: '', startTime: 0, lastUpdate: 0 },
      sdkKey: '',
    },
    stableID: '',
  }),
  checkGate: () => false,
  getFeatureGate: _defaultEvaluation<FeatureGate>('gate'),
  getDynamicConfig: _defaultEvaluation<DynamicConfig>('config'),
  getExperiment: _defaultEvaluation<Experiment>('config'),
  getLayer: _defaultEvaluation<Layer>('layer'),
  getParameterStore: _defaultEvaluation<ParameterStore>('param_store'),
  logEvent: _noop,
  on: _noop,
  off: _noop,
  $on: _noop,
  $emt: _noop,
  dataAdapter: _noopDataAdapter,
};

export const NoopEvaluationsClient = _client;
