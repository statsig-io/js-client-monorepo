import type {
  DataAdapterResult,
  EvaluationOptions,
  EvaluationsDataAdapter,
  FeatureGate,
  StatsigUser,
} from '@statsig/client-core';
import {
  DEFAULT_EVAL_OPTIONS,
  DJB2,
  DynamicConfig,
  Experiment,
  Layer,
  Log,
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
import Network from './Network';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export default class StatsigClient
  extends StatsigClientBase<EvaluationsDataAdapter>
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
      this._emit(e);
    });

    super(
      sdkKey,
      options?.dataAdapter ?? new StatsigEvaluationsDataAdapter(),
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

    const result = this.dataAdapter.getDataSync(this._user);
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);

    this._runPostUpdate(result ?? null, this._user);
  }

  async updateUserAsync(user: StatsigUser): Promise<void> {
    this._resetForUser(user);

    const initiator = this._user;

    let result = this.dataAdapter.getDataSync(initiator);
    this._setStatus('Loading', result);

    this._store.setValuesFromDataAdapter(result);

    result = await this.dataAdapter.getDataAsync(result, initiator);

    // ensure the user hasn't changed while we were waiting
    if (initiator === this._user) {
      this._store.setValuesFromDataAdapter(result);
    }

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
    const gate = makeFeatureGate(name, details, evaluation);
    const overridden = this._overrideAdapter?.getGateOverride?.(
      gate,
      this._user,
    );

    const result = overridden ?? gate;

    this._enqueueExposure(
      options,
      createGateExposure(this._user, result, evaluation?.secondary_exposures),
    );

    this._emit({ event: 'gate_evaluation', gate: result });

    return result;
  }

  getDynamicConfig(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl('dynamic_config', name, options);
    this._emit({ event: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Experiment {
    const experiment = this._getConfigImpl('experiment', name, options);
    this._emit({ event: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(
    name: string,
    options: EvaluationOptions = DEFAULT_EVAL_OPTIONS,
  ): Layer {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getLayer(hash);
    const layer = makeLayer(name, details, evaluation);

    const overridden = this._overrideAdapter?.getLayerOverride?.(
      layer,
      this._user,
    );

    const result = overridden ?? layer;
    this._emit({ event: 'layer_evaluation', layer: result });

    return {
      ...result,
      getValue: (param) => {
        if (!(param in result._value)) {
          return null;
        }

        const exposure = createLayerParameterExposure(
          this._user,
          result,
          param,
          result.__evaluation,
        );

        this._enqueueExposure(options, exposure);

        return result._value[param] ?? null;
      },
    };
  }

  logEvent(event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }

  private _runPostUpdate(
    current: DataAdapterResult | null,
    user: StatsigUser,
  ): void {
    this.dataAdapter.getDataAsync(current, user).catch((err) => {
      Log.error('An error occurred after update.', err);
    });
  }

  private _resetForUser(user: StatsigUser) {
    this._logger.reset();
    this._store.reset();

    this._user = normalizeUser(user, this._options.environment);
  }

  private _getConfigImpl(
    kind: 'experiment' | 'dynamic_config',
    name: string,
    options: EvaluationOptions,
  ): DynamicConfig {
    const hash = DJB2(name);
    const { evaluation, details } = this._store.getConfig(hash);

    const config = makeDynamicConfig(name, details, evaluation);

    const overridden =
      kind === 'experiment'
        ? this._overrideAdapter?.getExperimentOverride?.(config, this._user)
        : this._overrideAdapter?.getDynamicConfigOverride?.(config, this._user);

    const result = overridden ?? config;

    this._enqueueExposure(
      options,
      createConfigExposure(this._user, result, evaluation?.secondary_exposures),
    );

    return result;
  }
}
