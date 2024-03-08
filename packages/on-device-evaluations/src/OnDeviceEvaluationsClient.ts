import {
  DEFAULT_EVAL_OPTIONS,
  DynamicConfig,
  EvaluationOptions,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  StatsigClientBase,
  StatsigDataAdapter,
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
import { SpecsDataAdapter } from './SpecsDataAdapter';
import { StatsigOptions } from './StatsigOptions';

declare global {
  interface Window {
    statsigConfigSpecs: DownloadConfigSpecsResponse | undefined;
  }
}

export default class OnDeviceEvaluationsClient
  extends StatsigClientBase
  implements OnDeviceEvaluationsInterface
{
  private _network: Network;
  private _options: StatsigOptions;
  private _store: SpecStore;
  private _evaluator: Evaluator;
  private _source: string;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const network = new Network(options);
    super(sdkKey, network, options);

    monitorClass(this._errorBoundary, OnDeviceEvaluationsClient, this);
    monitorClass(this._errorBoundary, Network, network);

    this._options = options ?? {};
    this._network = network;
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
    this._source = 'NoValues';
  }

  initialize(): void {
    this._store.reset();

    this._setStatus('Loading');

    const result = this._adapter.getData?.(this._sdkKey);
    if (result) {
      this._store.setValuesFromData(result.data, result.source);
    }

    this._store.finalize();

    this._setStatus('Ready');

    this._runPostUpdate(result);
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

    this.emit({ event: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl(name, user, options);
    this.emit({ event: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Experiment {
    const experiment = this._getConfigImpl(name, user, options);
    this.emit({ event: 'experiment_evaluation', experiment });
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
      if (!result) {
        return null;
      }

      const {
        rule_id,
        undelegated_secondary_exposures,
        secondary_exposures,
        explicit_parameters,
        config_delegate,
      } = result;

      this._enqueueExposure(
        options,
        createLayerParameterExposure(user, name, param, {
          rule_id,
          explicit_parameters: explicit_parameters ?? [],
          undelegated_secondary_exposures,
          secondary_exposures,
          allocated_experiment_name: config_delegate ?? '',
          details,
        }),
      );

      return result?.json_value?.[param] ?? null;
    });

    this.emit({ event: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(event: StatsigEvent, user: StatsigUser): void {
    this._logger.enqueue({ ...event, user, time: Date.now() });
  }

  protected override _getDefaultDataAdapter(): StatsigDataAdapter {
    return new SpecsDataAdapter(this._sdkKey);
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
