import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  DataAdapterSyncOptions,
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
  _isServerEnv,
  _makeDynamicConfig,
  _makeExperiment,
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

type AsyncUpdateOptions = DataAdapterAsyncOptions;
type SyncUpdateOptions = DataAdapterSyncOptions;

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
      _isServerEnv()
        ? 'StatsigOnDeviceEvalClient.instance is not supported in server environments'
        : 'Unable to find StatsigOnDeviceEvalClient instance',
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

  initializeSync(options?: SyncUpdateOptions): void {
    this._logger.start();
    this.updateSync(options);
  }

  async initializeAsync(options?: AsyncUpdateOptions): Promise<void> {
    this._logger.start();
    return this.updateAsync(options);
  }

  updateSync(options?: SyncUpdateOptions): void {
    this._store.reset();

    const result = this.dataAdapter.getDataSync();
    this._store.setValuesFromDataAdapter(result);

    this._store.finalize();
    this._setStatus('Ready', result);

    if (!options?.disableBackgroundCacheRefresh) {
      this._runPostUpdate(result);
    }
  }

  async updateAsync(options?: AsyncUpdateOptions): Promise<void> {
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
      session: StatsigSession.get(this._sdkKey),
      stableID: StableID.get(this._sdkKey),
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
    const normalized = _normalizeUser(user, this._options);
    const { evaluation, details } = this._evaluator.evaluateGate(
      name,
      normalized,
    );

    const gate = _makeFeatureGate(name, details, evaluation);

    this._enqueueExposure(name, _createGateExposure(normalized, gate), options);

    this.$emt({ name: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    const normalized = _normalizeUser(user, this._options);
    const { evaluation, details } = this._evaluator.evaluateConfig(
      name,
      normalized,
    );

    const config = _makeDynamicConfig(name, details, evaluation);
    const overridden = this.overrideAdapter?.getDynamicConfigOverride?.(
      config,
      normalized,
      options,
    );

    const result = overridden ?? config;
    this._enqueueExposure(
      name,
      _createConfigExposure(normalized, result),
      options,
    );
    this.$emt({ name: 'dynamic_config_evaluation', dynamicConfig: result });
    return result;
  }

  getExperiment(
    name: string,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    const normalized = _normalizeUser(user, this._options);
    const { evaluation, details } = this._evaluator.evaluateConfig(
      name,
      normalized,
    );

    const experiment = _makeExperiment(name, details, evaluation);
    const overridden = this.overrideAdapter?.getExperimentOverride?.(
      experiment,
      normalized,
      options,
    );

    const result = overridden ?? experiment;
    this._enqueueExposure(
      name,
      _createConfigExposure(normalized, result),
      options,
    );
    this.$emt({ name: 'experiment_evaluation', experiment: result });
    return result;
  }

  getLayer(
    name: string,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer {
    const normalized = _normalizeUser(user, this._options);
    const { evaluation, details } = this._evaluator.evaluateLayer(
      name,
      normalized,
    );

    const layer = _makeLayer(name, details, evaluation, (param: string) => {
      this._enqueueExposure(
        name,
        _createLayerParameterExposure(normalized, layer, param),
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

    this._logger.enqueue({
      ...event,
      user: _normalizeUser(user, this._options),
      time: Date.now(),
    });
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
}
