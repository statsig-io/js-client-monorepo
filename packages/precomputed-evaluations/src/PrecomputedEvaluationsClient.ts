import type {
  EvaluationOptions,
  FeatureGate,
  StatsigUser,
} from '@statsig/client-core';
import {
  DEFAULT_EVAL_OPTIONS,
  DJB2,
  DynamicConfig,
  Experiment,
  Layer,
  PrecomputedEvaluationsInterface,
  StatsigClientBase,
  StatsigEvent,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  makeDynamicConfig,
  makeFeatureGate,
  makeLayer,
  monitorClass,
  normalizeUser,
} from '@statsig/client-core';

import EvaluationStore from './EvaluationStore';
import { EvaluationsDataAdapter } from './EvaluationsDataAdapter';
import Network from './Network';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export default class PrecomputedEvaluationsClient
  extends StatsigClientBase
  implements PrecomputedEvaluationsInterface
{
  private _options: StatsigOptions;
  private _network: Network;
  private _store: EvaluationStore;
  private _user: StatsigUser;

  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    const network = new Network(options, (e) => {
      this.emit(e);
    });

    super(
      sdkKey,
      options?.dataAdapter ?? new EvaluationsDataAdapter(),
      network,
      options,
    );

    monitorClass(this._errorBoundary, this);
    monitorClass(this._errorBoundary, network);

    this._options = options ?? {};
    this._store = new EvaluationStore(sdkKey);
    this._network = network;
    this._user = user;
  }

  initializeSync(): void {
    this.updateUserSync(this._user);
  }

  initializeAsync(): Promise<void> {
    return this.updateUserAsync(this._user);
  }

  getCurrentUser(): StatsigUser {
    return JSON.parse(JSON.stringify(this._user)) as StatsigUser;
  }

  updateUserSync(user: StatsigUser): void {
    this._resetForUser(user);

    const result = this._adapter.getDataSync(this._user);
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);

    this._runPostUpdate(result ?? null, this._user);
  }

  async updateUserAsync(user: StatsigUser): Promise<void> {
    this._resetForUser(user);

    this._setStatus('Loading', null);

    let result = this._adapter.getDataSync(this._user);
    this._store.setValuesFromDataAdapter(result);

    result = await this._adapter.getDataAsync(result, this._user);
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);
  }

  async shutdown(): Promise<void> {
    await this._logger.shutdown();
  }

  checkGate(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): boolean {
    return this.getFeatureGate(name, options).value;
  }

  getFeatureGate(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): FeatureGate {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getGate(hash);

    const gate = makeFeatureGate(
      name,
      details,
      evaluation?.rule_id,
      evaluation?.value,
    );

    this._enqueueExposure(
      options,
      createGateExposure(this._user, gate, evaluation?.secondary_exposures),
    );

    this.emit({ event: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl(name, options);
    this.emit({ event: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Experiment {
    const experiment = this._getConfigImpl(name, options);
    this.emit({ event: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Layer {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getLayer(hash);

    // todo: un-ugly
    const layer = makeLayer(name, details, evaluation?.rule_id, (param) => {
      if (!evaluation) {
        return;
      }

      if (!(param in evaluation.value)) {
        return undefined;
      }

      this._enqueueExposure(
        options,
        createLayerParameterExposure(this._user, name, param, {
          ...evaluation,
          details,
        }),
      );

      return evaluation.value[param];
    });

    this.emit({ event: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }

  private _resetForUser(user: StatsigUser) {
    this._logger.reset();
    this._store.reset();

    this._user = normalizeUser(user, this._options.environment);
  }

  private _getConfigImpl(
    name: string,
    options: EvaluationOptions,
  ): DynamicConfig {
    const hash = DJB2(name);
    const { evaluation, details } = this._store.getConfig(hash);

    const config = makeDynamicConfig(
      name,
      details,
      evaluation?.rule_id,
      evaluation?.value,
    );

    this._enqueueExposure(
      options,
      createConfigExposure(this._user, config, evaluation?.secondary_exposures),
    );

    return config;
  }
}
