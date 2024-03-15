import {
  DEFAULT_EVAL_OPTIONS,
  DataAdapterResult,
  DynamicConfig,
  EvaluationOptions,
  Experiment,
  FeatureGate,
  Layer,
  Log,
  OnDeviceEvaluationsInterface,
  SpecsDataAdapter,
  StatsigClientBase,
  StatsigEvent,
  StatsigUser,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  makeDynamicConfig,
  makeFeatureGate,
  makeLayer,
  monitorClass,
  normalizeUser,
} from '@statsig/client-core';

import Evaluator from './Evaluator';
import Network from './Network';
import SpecStore, { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';
import { StatsigSpecsDataAdapter } from './StatsigSpecsDataAdapter';

declare global {
  interface Window {
    statsigConfigSpecs: DownloadConfigSpecsResponse | undefined;
  }
}

export default class StatsigOnDeviceEvalClient
  extends StatsigClientBase<SpecsDataAdapter>
  implements OnDeviceEvaluationsInterface
{
  private _network: Network;
  private _options: StatsigOptions;
  private _store: SpecStore;
  private _evaluator: Evaluator;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const network = new Network(options);
    super(
      sdkKey,
      options?.dataAdapter ?? new StatsigSpecsDataAdapter(),
      network,
      options,
    );

    monitorClass(this._errorBoundary, this);
    monitorClass(this._errorBoundary, network);

    this._options = options ?? {};
    this._network = network;
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
  }

  initializeSync(): void {
    this._store.reset();

    const result = this.dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();

    this._setStatus('Ready', result);

    this._runPostUpdate(result);
  }

  async initializeAsync(): Promise<void> {
    this._store.reset();

    this._setStatus('Loading', null);

    let result = this.dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);

    result = await this.dataAdapter.getDataAsync(result);
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);
  }

  async shutdown(): Promise<void> {
    await this._logger.shutdown();
  }

  checkGate(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): boolean {
    return this.getFeatureGate(name, user, options).value;
  }

  getFeatureGate(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): FeatureGate {
    user = normalizeUser(user, this._options.environment);
    const { result, details } = this._evaluator.evaluateGate(name, user);

    const gate = makeFeatureGate(
      name,
      details,
      result?.rule_id,
      result?.bool_value,
    );

    this._enqueueExposure(
      options,
      createGateExposure(user, gate, result?.secondary_exposures),
    );

    this._emit({ event: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl(name, user, options);
    this._emit({ event: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Experiment {
    const experiment = this._getConfigImpl(name, user, options);
    this._emit({ event: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Layer {
    user = normalizeUser(user, this._options.environment);
    const { result, details } = this._evaluator.evaluateLayer(name, user);

    const layer = makeLayer(name, details, result?.rule_id, (param: string) => {
      if (result && param in result.json_value) {
        this._enqueueExposure(
          options,
          createLayerParameterExposure(user, layer, param, result),
        );
      }

      return result?.json_value?.[param] ?? null;
    });

    this._emit({ event: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(event: StatsigEvent, user: StatsigUser): void {
    this._logger.enqueue({ ...event, user, time: Date.now() });
  }

  private _runPostUpdate(current: DataAdapterResult | null): void {
    this.dataAdapter.getDataAsync(current).catch((err) => {
      Log.error('An error occurred after update.', err);
    });
  }

  private _getConfigImpl(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions,
  ): DynamicConfig {
    user = normalizeUser(user, this._options.environment);
    const { result, details } = this._evaluator.evaluateConfig(name, user);
    const config = makeDynamicConfig(
      name,
      details,
      result?.rule_id,
      result?.json_value,
    );

    this._enqueueExposure(
      options,
      createConfigExposure(user, config, result?.secondary_exposures),
    );

    return config;
  }
}
