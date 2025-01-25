import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  DataAdapterSyncOptions,
  Diagnostics,
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
  MemoPrefix,
  ParameterStore,
  ParameterStoreEvaluationOptions,
  PrecomputedEvaluationsContext,
  PrecomputedEvaluationsInterface,
  SDKType,
  StableID,
  StatsigClientBase,
  StatsigEvent,
  StatsigSession,
  StatsigUpdateDetails,
  StatsigUser,
  StatsigUserInternal,
  Storage,
  UPDATE_DETAIL_ERROR_MESSAGES,
  _createConfigExposure,
  _createGateExposure,
  _createLayerParameterExposure,
  _getStatsigGlobal,
  _isServerEnv,
  _makeDynamicConfig,
  _makeExperiment,
  _makeFeatureGate,
  _makeLayer,
  _mergeOverride,
  _normalizeUser,
  createUpdateDetails,
} from '@statsig/client-core';

import EvaluationStore from './EvaluationStore';
import Network from './Network';
import { _makeParamStoreGetter } from './ParamStoreGetterFactory';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import type { StatsigOptions } from './StatsigOptions';

type AsyncUpdateOptions = DataAdapterAsyncOptions;
type SyncUpdateOptions = DataAdapterSyncOptions;

export default class StatsigClient
  extends StatsigClientBase<EvaluationsDataAdapter>
  implements PrecomputedEvaluationsInterface
{
  private _store: EvaluationStore;
  private _user: StatsigUserInternal;
  private _network: Network;

  /**
   * Retrieves an instance of the StatsigClient based on the provided SDK key.
   *  If no SDK key is provided, the method returns the most recently created instance of the StatsigClient.
   *  The method ensures that each unique SDK key corresponds to a single instance of StatsigClient, effectively implementing a singleton pattern for each key.
   *
   * @param {string} [sdkKey] - Optional. The SDK key used to identify a specific instance of the StatsigClient. If omitted, the method returns the last created instance.
   * @returns {StatsigClient|undefined} Returns the StatsigClient instance associated with the given SDK key, or undefined if no instance is associated with the key or if no key is provided and no instances exist.
   */
  static instance(sdkKey?: string): StatsigClient {
    const instance = _getStatsigGlobal().instance(sdkKey);
    if (instance instanceof StatsigClient) {
      return instance;
    }

    Log.warn(
      _isServerEnv()
        ? 'StatsigClient.instance is not supported in server environments'
        : 'Unable to find StatsigClient instance',
    );
    return new StatsigClient(sdkKey ?? '', {});
  }

  /**
   * StatsigClient constructor
   *
   * @param {string} sdkKey A Statsig client SDK key. eg "client-xyz123..."
   * @param {StatsigUser} user StatsigUser object containing various attributes related to a user.
   * @param {StatsigOptions | null} options StatsigOptions, used to customize the behavior of the SDK.
   */
  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    SDKType._setClientType(sdkKey, 'javascript-client');
    const network = new Network(options, (e) => {
      this.$emt(e);
    });

    super(
      sdkKey,
      options?.dataAdapter ?? new StatsigEvaluationsDataAdapter(),
      network,
      options,
    );

    this._store = new EvaluationStore(sdkKey);
    this._network = network;
    this._user = this._configureUser(user, options);

    const plugins = options?.plugins ?? [];
    for (const plugin of plugins) {
      plugin.bind(this);
    }
  }

  /**
   * Initializes the StatsigClient using cached values. This method sets up the client synchronously by utilizing previously cached values.
   * After initialization, cache values are updated in the background for future use, either in subsequent sessions or when `updateUser` is called.
   * This is useful for quickly starting with the last-known-good configurations while refreshing data to keep settings up-to-date.
   *
   * @see {@link initializeAsync} for the asynchronous version of this method.
   */
  initializeSync(options?: SyncUpdateOptions): StatsigUpdateDetails {
    if (this.loadingStatus !== 'Uninitialized') {
      return createUpdateDetails(
        true,
        this._store.getSource(),
        -1,
        null,
        null,
        ['MultipleInitializations', ...(this._store.getWarnings() ?? [])],
      );
    }

    this._logger.start();
    return this.updateUserSync(this._user, options);
  }

  /**
   * Initializes the StatsigClient asynchronously by first using cached values and then updating to the latest values from the network.
   * Once the network values are fetched, they replace the existing cached values. If this method's promise is not awaited,
   * there might be a transition from cached to network values during the session, which can affect consistency.
   * This method is useful when it's acceptable to begin with potentially stale data and switch to the latest configuration as it becomes available.
   *
   * @param {AsyncUpdateOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Promise<void>} A promise that resolves once the client is fully initialized with the latest values from the network or a timeout (if set) is hit.
   * @see {@link initializeSync} for the synchronous version of this method.
   */
  async initializeAsync(
    options?: AsyncUpdateOptions,
  ): Promise<StatsigUpdateDetails> {
    if (this._initializePromise) {
      return this._initializePromise;
    }

    this._initializePromise = this._initializeAsyncImpl(options);
    return this._initializePromise;
  }

  /**
   * Synchronously updates the user in the Statsig client and switches the internal state to use cached values for the newly specified user.
   * After the initial switch to cached values, this method updates these values in the background, preparing them for future sessions or subsequent calls to updateUser.
   * This method ensures the client is quickly ready with available data.
   *
   * @param {StatsigUser} user - The new StatsigUser for which the client should update its internal state.
   * @see {@link updateUserAsync} for the asynchronous version of this method.
   */
  updateUserSync(
    user: StatsigUser,
    options?: SyncUpdateOptions,
  ): StatsigUpdateDetails {
    const startTime = performance.now();
    const warnings = [...(this._store.getWarnings() ?? [])];
    this._resetForUser(user);

    const result = this.dataAdapter.getDataSync(this._user);
    if (result == null) {
      warnings.push('NoCachedValues');
    }

    this._store.setValues(result, this._user);

    this._finalizeUpdate(result);

    const disable = options?.disableBackgroundCacheRefresh;
    if (
      disable === true ||
      (disable == null && result?.source === 'Bootstrap')
    ) {
      return createUpdateDetails(
        true,
        this._store.getSource(),
        performance.now() - startTime,
        this._errorBoundary.getLastSeenErrorAndReset(),
        this._network.getLastUsedInitUrlAndReset(),
        warnings,
      );
    }

    this._runPostUpdate(result ?? null, this._user);
    return createUpdateDetails(
      true,
      this._store.getSource(),
      performance.now() - startTime,
      this._errorBoundary.getLastSeenErrorAndReset(),
      this._network.getLastUsedInitUrlAndReset(),
      warnings,
    );
  }

  /**
   * Asynchronously updates the user in the Statsig client by initially using cached values and then fetching the latest values from the network.
   * When the latest values are fetched, they replace the cached values. If the promise returned by this method is not awaited,
   * the client's state may shift from cached to updated network values during the session, potentially affecting consistency.
   * This method is best used in scenarios where up-to-date configuration is critical and initial delays are acceptable.
   *
   * @param {StatsigUser} user - The new StatsigUser for which the client should update its internal state.
   * @param {AsyncUpdateOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Promise<void>} A promise that resolves once the client is fully updated with the latest values from the network or a timeout (if set) is hit.
   * @see {@link updateUserSync} for the synchronous version of this method.
   */
  async updateUserAsync(
    user: StatsigUser,
    options?: AsyncUpdateOptions,
  ): Promise<StatsigUpdateDetails> {
    this._resetForUser(user);

    const initiator = this._user;
    Diagnostics._markInitOverallStart(this._sdkKey);

    let result = this.dataAdapter.getDataSync(initiator);
    this._store.setValues(result, this._user);

    this._setStatus('Loading', result);

    result = await this.dataAdapter.getDataAsync(result, initiator, options);
    // ensure the user hasn't changed while we were waiting
    if (initiator !== this._user) {
      return createUpdateDetails(
        false,
        this._store.getSource(),
        -1,
        new Error('User changed during update'),
        this._network.getLastUsedInitUrlAndReset(),
      );
    }

    let isUsingNetworkValues = false;

    if (result != null) {
      Diagnostics._markInitProcessStart(this._sdkKey);
      isUsingNetworkValues = this._store.setValues(result, this._user);
      Diagnostics._markInitProcessEnd(this._sdkKey, {
        success: isUsingNetworkValues,
      });
    }

    this._finalizeUpdate(result);

    if (!isUsingNetworkValues) {
      this._errorBoundary.attachErrorIfNoneExists(
        UPDATE_DETAIL_ERROR_MESSAGES.NO_NETWORK_DATA,
      );
      this.$emt({ name: 'initialization_failure' });
    }

    Diagnostics._markInitOverallEnd(
      this._sdkKey,
      isUsingNetworkValues,
      this._store.getCurrentSourceDetails(),
    );
    const initDuration = Diagnostics._enqueueDiagnosticsEvent(
      this._user,
      this._logger,
      this._sdkKey,
      this._options,
    );
    return createUpdateDetails(
      isUsingNetworkValues,
      this._store.getSource(),
      initDuration,
      this._errorBoundary.getLastSeenErrorAndReset(),
      this._network.getLastUsedInitUrlAndReset(),
      this._store.getWarnings(),
    );
  }

  /**
   * Retrieves a synchronous context containing data currently being used by the SDK. Represented as a {@link PrecomputedEvaluationsContext} object.
   *
   * @returns {PrecomputedEvaluationsContext} The current synchronous context for the this StatsigClient instance.
   */
  getContext(): PrecomputedEvaluationsContext {
    return {
      sdkKey: this._sdkKey,
      options: this._options,
      values: this._store.getValues(),
      user: JSON.parse(JSON.stringify(this._user)) as StatsigUser,
      errorBoundary: this._errorBoundary,
      session: StatsigSession.get(this._sdkKey),
      stableID: StableID.get(this._sdkKey),
    };
  }

  /**
   * Retrieves the value of a feature gate for the current user, represented as a simple boolean.
   *
   * @param {string} name - The name of the feature gate to retrieve.
   * @param {FeatureGateEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {boolean} - The boolean value representing the gate's current evaluation results for the user.
   */

  checkGate(name: string, options?: FeatureGateEvaluationOptions): boolean {
    return this.getFeatureGate(name, options).value;
  }

  /**
   * Retrieves the value of a feature gate for the current user, represented as a {@link FeatureGate} object.
   *
   * @param {string} name - The name of the feature gate to retrieve.
   * @param {FeatureGateEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {FeatureGate} - The {@link FeatureGate} object representing the gate's current evaluation results for the user.
   */
  readonly getFeatureGate = this._memoize(
    MemoPrefix._gate,
    this._getFeatureGateImpl.bind(this),
  );

  /**
   * Retrieves the value of a dynamic config for the current user.
   *
   * @param {string} name The name of the dynamic config to get.
   * @param {DynamicConfigEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {DynamicConfig} - The {@link DynamicConfig} object representing the dynamic configs's current evaluation results for the user.
   */
  readonly getDynamicConfig = this._memoize(
    MemoPrefix._dynamicConfig,
    this._getDynamicConfigImpl.bind(this),
  );

  /**
   * Retrieves the value of a experiment for the current user.
   *
   * @param {string} name The name of the experiment to get.
   * @param {ExperimentEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Experiment} - The {@link Experiment} object representing the experiments's current evaluation results for the user.
   */
  readonly getExperiment = this._memoize(
    MemoPrefix._experiment,
    this._getExperimentImpl.bind(this),
  );

  /**
   * Retrieves the value of a layer for the current user.
   *
   * @param {string} name The name of the layer to get.
   * @param {LayerEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Layer} - The {@link Layer} object representing the layers's current evaluation results for the user.
   */
  readonly getLayer = this._memoize(
    MemoPrefix._layer,
    this._getLayerImpl.bind(this),
  );

  /**
   * Retrieves the value of a parameter store for the current user.
   *
   * @param {string} name The name of the parameter store to get.
   * @param {ParameterStoreEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {ParameterStore} - The {@link ParameterStore} object representing the parameter store's current mappings for the user.
   */
  readonly getParameterStore = this._memoize(
    MemoPrefix._paramStore,
    this._getParameterStoreImpl.bind(this),
  );

  /**
   * Logs an event to the internal logging system. This function allows logging by either passing a fully formed event object or by specifying the event name with optional value and metadata.
   *
   * @param {StatsigEvent|string} eventOrName - The event object conforming to the StatsigEvent interface, or the name of the event as a string.
   * @param {string|number} value - Optional. The value associated with the event, which can be a string or a number. This parameter is ignored if the first parameter is a StatsigEvent object.
   * @param {Record<string, string>} metadata - Optional. A key-value record containing metadata about the event. This is also ignored if the first parameter is an event object.
   */
  logEvent(
    eventOrName: StatsigEvent | string,
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

    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }

  protected override _primeReadyRipcord(): void {
    this.$on('error', () => {
      this.loadingStatus === 'Loading' && this._finalizeUpdate(null);
    });
  }

  private async _initializeAsyncImpl(
    options?: AsyncUpdateOptions,
  ): Promise<StatsigUpdateDetails> {
    if (!Storage.isReady()) {
      await Storage.isReadyResolver();
    }

    this._logger.start();
    return this.updateUserAsync(this._user, options);
  }

  private _finalizeUpdate(values: DataAdapterResult | null) {
    this._store.finalize();
    this._setStatus('Ready', values);
  }

  private _runPostUpdate(
    current: DataAdapterResult | null,
    user: StatsigUser,
  ): void {
    this.dataAdapter
      .getDataAsync(current, user, { priority: 'low' })
      .catch((err) => {
        Log.error('An error occurred after update.', err);
      });
  }

  private _resetForUser(user: StatsigUser) {
    this._logger.reset();
    this._store.reset();

    this._user = this._configureUser(user, this._options);
  }

  private _configureUser(
    originalUser: StatsigUser,
    options: StatsigOptions | null,
  ): StatsigUserInternal {
    const user = _normalizeUser(originalUser, options);
    const stableIdOverride = user.customIDs?.stableID;
    if (stableIdOverride) {
      StableID.setOverride(stableIdOverride, this._sdkKey);
    }
    return user;
  }

  private _getFeatureGateImpl(
    name: string,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate {
    const { result: evaluation, details } = this._store.getGate(name);
    const gate = _makeFeatureGate(name, details, evaluation);
    const overridden = this.overrideAdapter?.getGateOverride?.(
      gate,
      this._user,
      options,
    );

    const result = overridden ?? gate;

    this._enqueueExposure(
      name,
      _createGateExposure(this._user, result),
      options,
    );

    this.$emt({ name: 'gate_evaluation', gate: result });

    return result;
  }

  private _getDynamicConfigImpl(
    name: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    const { result: evaluation, details } = this._store.getConfig(name);
    const config = _makeDynamicConfig(name, details, evaluation);

    const overridden = this.overrideAdapter?.getDynamicConfigOverride?.(
      config,
      this._user,
      options,
    );

    const result = overridden ?? config;

    this._enqueueExposure(
      name,
      _createConfigExposure(this._user, result),
      options,
    );
    this.$emt({ name: 'dynamic_config_evaluation', dynamicConfig: result });
    return result;
  }

  private _getExperimentImpl(
    name: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    const { result: evaluation, details } = this._store.getConfig(name);
    const experiment = _makeExperiment(name, details, evaluation);

    const overridden = this.overrideAdapter?.getExperimentOverride?.(
      experiment,
      this._user,
      options,
    );

    const result = overridden ?? experiment;

    this._enqueueExposure(
      name,
      _createConfigExposure(this._user, result),
      options,
    );
    this.$emt({ name: 'experiment_evaluation', experiment: result });
    return result;
  }

  private _getLayerImpl(name: string, options?: LayerEvaluationOptions): Layer {
    const { result: evaluation, details } = this._store.getLayer(name);
    const layer = _makeLayer(name, details, evaluation);
    const overridden = this.overrideAdapter?.getLayerOverride?.(
      layer,
      this._user,
      options,
    );

    if (options?.disableExposureLog) {
      this._logger.incrementNonExposureCount(name);
    }

    const result = _mergeOverride(
      layer,
      overridden,
      overridden?.__value ?? layer.__value,
      (param: string) => {
        if (options?.disableExposureLog) {
          return;
        }

        this._enqueueExposure(
          name,
          _createLayerParameterExposure(this._user, result, param),
          options,
        );
      },
    );

    this.$emt({ name: 'layer_evaluation', layer: result });
    return result;
  }

  private _getParameterStoreImpl(
    name: string,
    options?: ParameterStoreEvaluationOptions,
  ): ParameterStore {
    const { result: configuration, details } = this._store.getParamStore(name);
    this._logger.incrementNonExposureCount(name);

    return {
      name,
      details,
      __configuration: configuration,
      get: _makeParamStoreGetter(this, configuration, options),
    };
  }
}
