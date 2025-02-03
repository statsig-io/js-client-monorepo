import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGate,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  OverrideAdapter,
  SpecsDataAdapter,
  StatsigUser,
  StatsigUserInternal,
  _makeFeatureGate,
} from '@statsig/client-core';
import { Evaluator, SpecStore } from '@statsig/on-device-eval-core';

import { StatsigLocalSpecsDataAdapter } from './StatsigLocalSpecsDataAdapter';

export class OnDeviceEvalAdapter implements OverrideAdapter {
  private _dataAdapter: SpecsDataAdapter;
  private _store: SpecStore;
  private _evaluator: Evaluator;

  constructor() {
    this._dataAdapter = new StatsigLocalSpecsDataAdapter();
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
  }

  setData(data: string): void {
    this._dataAdapter.setData(data);
    const result = this._dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);
  }

  getGateOverride?(
    current: FeatureGate,
    user: StatsigUserInternal,
    _options?: FeatureGateEvaluationOptions,
  ): FeatureGate | null {
    if (current.details.reason.includes('Network')) {
      return null;
    }

    const name = current.name;
    const { evaluation, details } = this._evaluator.evaluateGate(name, user);
    details.reason = '[OnDevice]' + details.reason;
    return _makeFeatureGate(name, details, evaluation);
  }

  getDynamicConfigOverride?(
    current: DynamicConfig,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig | null {
    return null;
  }

  getExperimentOverride?(
    current: Experiment,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment | null {
    return null;
  }

  getLayerOverride?(
    current: Layer,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer | null {
    return null;
  }
}
