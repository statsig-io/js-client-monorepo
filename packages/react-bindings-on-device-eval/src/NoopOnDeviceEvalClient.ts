import {
  DynamicConfig,
  ErrorBoundary,
  EvaluationsDataAdapter,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  SpecsDataAdapter,
  StatsigUpdateDetails,
  Storage,
  _makeDynamicConfig,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';

const noopInitializeDetails: StatsigUpdateDetails = {
  success: false,
  error: Error('NoClient'),
  duration: 0,
  source: 'Uninitialized',
  sourceUrl: null,
};

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
  session: {
    data: { sessionID: '', startTime: 0, lastUpdate: 0 },
    sdkKey: '',
  },
  stableID: '',
  storageProvider: Storage,
};

const _client: OnDeviceEvaluationsInterface & { isNoop: true } = {
  isNoop: true,
  loadingStatus: 'Uninitialized',
  initializeSync: () => noopInitializeDetails,
  initializeAsync: () => Promise.resolve(noopInitializeDetails),
  shutdown: _noopAsync,
  flush: _noopAsync,
  updateRuntimeOptions: _noop,
  getContext: () => ({
    ...context,
  }),
  checkGate: () => false,
  getFeatureGate: _defaultEvaluation<FeatureGate>('gate'),
  getDynamicConfig: _defaultEvaluation<DynamicConfig>('config'),
  getExperiment: _defaultEvaluation<Experiment>('config'),
  getLayer: _defaultEvaluation<Layer>('layer'),
  logEvent: _noop,
  on: _noop,
  off: _noop,
  $on: _noop,
  $emt: _noop,
  dataAdapter: _noopDataAdapter,
};

export const NoopOnDeviceEvalClient = _client;

export function isNoopClient(client: OnDeviceEvaluationsInterface): boolean {
  return 'isNoop' in client;
}
