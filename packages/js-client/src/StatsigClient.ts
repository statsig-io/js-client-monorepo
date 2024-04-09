import {
  DJB2,
  DataAdapterResult,
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  EvaluationsDataAdapter,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGate,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  Log,
  PrecomputedEvaluationsAsyncContext,
  PrecomputedEvaluationsContext,
  PrecomputedEvaluationsInterface,
  SessionID,
  StableID,
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

import EvaluationStore from './EvaluationStore';
import Network from './Network';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export default class StatsigClient
  extends StatsigClientBase<EvaluationsDataAdapter>
  implements PrecomputedEvaluationsInterface
{
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

    this._store = new EvaluationStore();
    this._user = user;
  }

  initializeSync(): void {
    this.updateUserSync(this._user);
  }

  initializeAsync(): Promise<void> {
    return this.updateUserAsync(this._user);
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

  checkGate(name: string, options?: FeatureGateEvaluationOptions): boolean {
    return this.getFeatureGate(name, options).value;
  }

  getContext(): PrecomputedEvaluationsContext {
    return {
      sdkKey: this._sdkKey,
      options: this._options,
      values: this._store.getValues(),
      user: JSON.parse(JSON.stringify(this._user)) as StatsigUser,
    };
  }

  async getAsyncContext(): Promise<PrecomputedEvaluationsAsyncContext> {
    return {
      ...this.getContext(),
      sessionID: await SessionID.get(this._sdkKey),
      stableID: await StableID.get(this._sdkKey),
    };
  }

  getFeatureGate(
    name: string,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getGate(hash);
    const gate = makeFeatureGate(name, details, evaluation);
    const overridden = this._overrideAdapter?.getGateOverride?.(
      gate,
      this._user,
      options,
    );

    const result = overridden ?? gate;

    this._enqueueExposure(
      name,
      createGateExposure(this._user, result),
      options,
    );

    this._emit({ name: 'gate_evaluation', gate: result });

    return result;
  }

  getDynamicConfig(
    name: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl('dynamic_config', name, options);
    this._emit({ name: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    const experiment = this._getConfigImpl('experiment', name, options);
    this._emit({ name: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(name: string, options?: LayerEvaluationOptions): Layer {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getLayer(hash);
    const layer = makeLayer(name, details, evaluation);

    const overridden = this._overrideAdapter?.getLayerOverride?.(
      layer,
      this._user,
      options,
    );

    const result = overridden ?? layer;
    this._emit({ name: 'layer_evaluation', layer: result });

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
        );

        this._enqueueExposure(name, exposure, options);

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
    options?: DynamicConfigEvaluationOptions | ExperimentEvaluationOptions,
  ): DynamicConfig {
    const hash = DJB2(name);
    const { evaluation, details } = this._store.getConfig(hash);

    const config = makeDynamicConfig(name, details, evaluation);

    const overridden =
      kind === 'experiment'
        ? this._overrideAdapter?.getExperimentOverride?.(
            config,
            this._user,
            options,
          )
        : this._overrideAdapter?.getDynamicConfigOverride?.(
            config,
            this._user,
            options,
          );

    const result = overridden ?? config;

    this._enqueueExposure(
      name,
      createConfigExposure(this._user, result),
      options,
    );

    return result;
  }
}
