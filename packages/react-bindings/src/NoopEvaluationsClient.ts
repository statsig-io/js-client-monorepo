import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  emptyDynamicConfig,
  emptyFeatureGate,
  emptyLayer,
} from '@sigstat/core';

const noop = (): void => {
  // noop
};

const defaultEvaluation = <T>(type: 'gate' | 'config' | 'layer') => {
  return (...args: unknown[]): T => {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    const evalArgs = { name, source: 'Error' };

    switch (type) {
      case 'gate':
        return emptyFeatureGate(evalArgs) as T;
      case 'config':
        return emptyDynamicConfig(evalArgs) as T;
      case 'layer':
        return emptyLayer(evalArgs) as T;
    }
  };
};

const client: OnDeviceEvaluationsInterface &
  PrecomputedEvaluationsInterface & { isNoop: true } = {
  isNoop: true,
  loadingStatus: 'Uninitialized',
  initialize: () => Promise.resolve(),
  shutdown: () => Promise.resolve(),
  updateUser: () => Promise.resolve(),
  checkGate: () => false,
  getFeatureGate: defaultEvaluation<FeatureGate>('gate'),
  getDynamicConfig: defaultEvaluation<DynamicConfig>('config'),
  getExperiment: defaultEvaluation<Experiment>('config'),
  getLayer: defaultEvaluation<Layer>('layer'),
  logEvent: noop,
  on: noop,
  off: noop,
};

export const NoopEvaluationsClient = client;
