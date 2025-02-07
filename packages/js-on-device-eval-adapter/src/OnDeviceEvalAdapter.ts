import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  EvaluationDetails,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGate,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  OverrideAdapter,
  ParamStoreConfig,
  ParameterStore,
  ParameterStoreEvaluationOptions,
  StatsigUserInternal,
  _makeDataAdapterResult,
  _makeDynamicConfig,
  _makeExperiment,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';
import { Evaluator, SpecStore } from '@statsig/on-device-eval-core';

type AnyStatsigType = FeatureGate | DynamicConfig | Experiment | Layer;
type EvaluationFn<E> = (
  name: string,
  user: StatsigUserInternal,
) => { evaluation: E; details: EvaluationDetails };

export class OnDeviceEvalAdapter implements OverrideAdapter {
  private _store: SpecStore;
  private _evaluator: Evaluator;

  constructor(data: string | null) {
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);

    if (data != null) {
      this.setData(data);
    }
  }

  setData(data: string): void {
    const result = _makeDataAdapterResult('Bootstrap', data, null);
    this._store.setValuesFromDataAdapter(result);
  }

  getGateOverride(
    current: FeatureGate,
    user: StatsigUserInternal,
    _options?: FeatureGateEvaluationOptions,
  ): FeatureGate | null {
    return this._evaluate(
      current,
      user,
      this._evaluator.evaluateGate.bind(this._evaluator),
      _makeFeatureGate,
    );
  }

  getDynamicConfigOverride(
    current: DynamicConfig,
    user: StatsigUserInternal,
    _options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig | null {
    return this._evaluate(
      current,
      user,
      this._evaluator.evaluateConfig.bind(this._evaluator),
      _makeDynamicConfig,
    );
  }

  getExperimentOverride(
    current: Experiment,
    user: StatsigUserInternal,
    _options?: ExperimentEvaluationOptions,
  ): Experiment | null {
    return this._evaluate(
      current,
      user,
      this._evaluator.evaluateConfig.bind(this._evaluator),
      _makeExperiment,
    );
  }

  getLayerOverride(
    current: Layer,
    user: StatsigUserInternal,
    _options?: LayerEvaluationOptions,
  ): Layer | null {
    return this._evaluate(
      current,
      user,
      this._evaluator.evaluateLayer.bind(this._evaluator),
      _makeLayer,
    );
  }

  getParamStoreOverride(
    current: ParameterStore,
    _options?: ParameterStoreEvaluationOptions,
  ): { config: ParamStoreConfig; details: EvaluationDetails } | null {
    if (!this._shouldTryOnDeviceEval(current.details)) {
      return null;
    }
    const { config, details: newDetails } = this._evaluator.getParamStoreConfig(
      current.name,
    );

    newDetails.reason = '[OnDevice]' + newDetails.reason;
    return { config: config ?? {}, details: newDetails };
  }

  private _evaluate<T extends AnyStatsigType, E>(
    current: T,
    user: StatsigUserInternal,
    evaluateFn: EvaluationFn<E>,
    makeFn: (name: string, details: EvaluationDetails, evaluation: E) => T,
  ): T | null {
    if (!this._shouldTryOnDeviceEval(current.details)) {
      return null;
    }

    const name = current.name;
    const { evaluation, details } = evaluateFn(name, user);
    details.reason = '[OnDevice]' + details.reason;

    return makeFn(name, details, evaluation);
  }

  private _shouldTryOnDeviceEval(details: EvaluationDetails): boolean {
    const values = this._store.getValues();
    if (values == null) {
      return false;
    }

    if (!details.lcut) {
      return true;
    }

    return values.time > details.lcut;
  }
}
