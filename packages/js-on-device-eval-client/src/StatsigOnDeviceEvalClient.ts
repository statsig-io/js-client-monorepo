import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  DownloadConfigSpecsResponse,
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGate,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  Log,
  OnDeviceEvaluationsAsyncContext,
  OnDeviceEvaluationsContext,
  OnDeviceEvaluationsInterface,
  SDKType,
  SpecsDataAdapter,
  StableID,
  StatsigClientBase,
  StatsigEvent,
  StatsigSession,
  StatsigUser,
  _createConfigExposure,
  _createGateExposure,
  _createLayerParameterExposure,
  _getStatsigGlobal,
  _isBrowserEnv,
  _makeDynamicConfig,
  _makeFeatureGate,
  _makeLayer,
  _normalizeUser,
} from '@statsig/client-core';

import Evaluator from './Evaluator';
import Network from './Network';
import SpecStore from './SpecStore';
import { StatsigOptions } from './StatsigOptions';
import { StatsigSpecsDataAdapter } from './StatsigSpecsDataAdapter';

declare global {
  interface Window {
    statsigConfigSpecs: DownloadConfigSpecsResponse | undefined;
  }
}

type AsyncOptions = DataAdapterAsyncOptions;

export default class StatsigOnDeviceEvalClient
  extends StatsigClientBase<SpecsDataAdapter>
  implements OnDeviceEvaluationsInterface
{
  private _store: SpecStore;
  private _evaluator: Evaluator;

  static instance(sdkKey?: string): StatsigOnDeviceEvalClient {
    const instance = _getStatsigGlobal().instance(sdkKey);
    if (instance instanceof StatsigOnDeviceEvalClient) {
      return instance;
    }

    Log.warn(
      _isBrowserEnv()
        ? 'Unable to find StatsigOnDeviceEvalClient instance'
        : 'StatsigOnDeviceEvalClient.instance is not supported in server environments',
    );
    return new StatsigOnDeviceEvalClient(sdkKey ?? '');
  }

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    SDKType._setClientType(sdkKey, 'js-on-device-eval-client');
    const network = new Network(options);

    super(
      sdkKey,
      options?.dataAdapter ?? new StatsigSpecsDataAdapter(),
      network,
      options,
    );

    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
  }

  initializeSync(): void {
    this.updateSync();
  }

  async initializeAsync(options?: AsyncOptions): Promise<void> {
    return this.updateAsync(options);
  }

  updateSync(): void {
    this._store.reset();

    const result = this.dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);

    this._runPostUpdate(result);
  }

  async updateAsync(options?: AsyncOptions): Promise<void> {
    this._store.reset();

    this._setStatus('Loading', null);

    let result = this.dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);

    result = await this.dataAdapter.getDataAsync(result, options);
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);
  }

  getContext(): OnDeviceEvaluationsContext {
    return {
      sdkKey: this._sdkKey,
      options: this._options,
      values: this._store.getValues(),
      errorBoundary: this._errorBoundary,
    };
  }

  async getAsyncContext(): Promise<OnDeviceEvaluationsAsyncContext> {
    return {
      ...this.getContext(),
      session: await StatsigSession.get(this._sdkKey),
      stableID: await StableID.get(this._sdkKey),
    };
  }

  checkGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): boolean {
    return this.getFeatureGate(name, user, options).value;
  }

  getFeatureGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate {
    user = _normalizeUser(user, this._options.environment);
    const { evaluation, details } = this._evaluator.evaluateGate(name, user);

    const gate = _makeFeatureGate(name, details, evaluation);

    this._enqueueExposure(name, _createGateExposure(user, gate), options);

    this.$emt({ name: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl(
      'dynamic_config',
      name,
      user,
      options,
    );
    this.$emt({ name: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(
    name: string,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    const experiment = this._getConfigImpl('experiment', name, user, options);
    this.$emt({ name: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(
    name: string,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer {
    user = _normalizeUser(user, this._options.environment);
    const { evaluation, details } = this._evaluator.evaluateLayer(name, user);

    const layer = _makeLayer(name, details, evaluation, (param: string) => {
      this._enqueueExposure(
        name,
        _createLayerParameterExposure(user, layer, param),
        options,
      );
    });

    this.$emt({ name: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(
    eventOrName: StatsigEvent | string,
    user: StatsigUser,
    value?: string | number,
    metadata?: Record<string, string>,
  ): void {
    const event =
      typeof eventOrName === 'string'
        ? {
            eventName: eventOrName,
            value,
            metadata,
          }
        : eventOrName;

    this._logger.enqueue({ ...event, user, time: Date.now() });
  }

  protected override _primeReadyRipcord(): void {
    this.$on('error', () => {
      this.loadingStatus === 'Loading' && this._finalizeUpdate(null);
    });
  }

  private _finalizeUpdate(values: DataAdapterResult | null) {
    this._store.finalize();
    this._setStatus('Ready', values);
  }

  private _runPostUpdate(current: DataAdapterResult | null): void {
    this.dataAdapter.getDataAsync(current, { priority: 'low' }).catch((err) => {
      Log.error('An error occurred after update.', err);
    });
  }

  private _getConfigImpl(
    kind: 'experiment' | 'dynamic_config',
    name: string,
    user: StatsigUser,
    opts?: DynamicConfigEvaluationOptions | ExperimentEvaluationOptions,
  ): DynamicConfig {
    user = _normalizeUser(user, this._options.environment);
    const { evaluation, details } = this._evaluator.evaluateConfig(name, user);
    const config = _makeDynamicConfig(name, details, evaluation);

    const overridden =
      kind === 'experiment'
        ? this._overrideAdapter?.getExperimentOverride?.(config, user, opts)
        : this._overrideAdapter?.getDynamicConfigOverride?.(config, user, opts);

    const result = overridden ?? config;
    this._enqueueExposure(name, _createConfigExposure(user, result), opts);
    return result;
  }
}
