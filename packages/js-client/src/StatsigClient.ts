import {
  DJB2,
  DataAdapterAsyncOptions,
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
  SDKType,
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
  _mergeOverride,
  _normalizeUser,
} from '@statsig/client-core';

import EvaluationStore from './EvaluationStore';
import Network from './Network';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import type { StatsigOptions } from './StatsigOptions';

type AsyncOptions = DataAdapterAsyncOptions;

export default class StatsigClient
  extends StatsigClientBase<EvaluationsDataAdapter>
  implements PrecomputedEvaluationsInterface
{
  private _store: EvaluationStore;
  private _user: StatsigUser;

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
      _isBrowserEnv()
        ? 'Unable to find StatsigClient instance'
        : 'StatsigClient.instance is not supported in server environments',
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

    this._store = new EvaluationStore();
    this._user = user;
  }

  /**
   * Initializes the StatsigClient using cached values. This method sets up the client synchronously by utilizing previously cached values.
   * After initialization, cache values are updated in the background for future use, either in subsequent sessions or when `updateUser` is called.
   * This is useful for quickly starting with the last-known-good configurations while refreshing data to keep settings up-to-date.
   *
   * @see {@link initializeAsync} for the asynchronous version of this method.
   */
  initializeSync(): void {
    this.updateUserSync(this._user);
  }

  /**
   * Initializes the StatsigClient asynchronously by first using cached values and then updating to the latest values from the network.
   * Once the network values are fetched, they replace the existing cached values. If this method's promise is not awaited,
   * there might be a transition from cached to network values during the session, which can affect consistency.
   * This method is useful when it's acceptable to begin with potentially stale data and switch to the latest configuration as it becomes available.
   *
   * @param {AsyncOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Promise<void>} A promise that resolves once the client is fully initialized with the latest values from the network or a timeout (if set) is hit.
   * @see {@link initializeSync} for the synchronous version of this method.
   */
  initializeAsync(options?: AsyncOptions): Promise<void> {
    return this.updateUserAsync(this._user, options);
  }

  /**
   * Synchronously updates the user in the Statsig client and switches the internal state to use cached values for the newly specified user.
   * After the initial switch to cached values, this method updates these values in the background, preparing them for future sessions or subsequent calls to updateUser.
   * This method ensures the client is quickly ready with available data.
   *
   * @param {StatsigUser} user - The new StatsigUser for which the client should update its internal state.
   * @see {@link updateUserAsync} for the asynchronous version of this method.
   */
  updateUserSync(user: StatsigUser): void {
    this._resetForUser(user);

    const result = this.dataAdapter.getDataSync(this._user);
    this._store.setValuesFromDataAdapter(result);

    this._finalizeUpdate(result);
    this._runPostUpdate(result ?? null, this._user);
  }

  /**
   * Asynchronously updates the user in the Statsig client by initially using cached values and then fetching the latest values from the network.
   * When the latest values are fetched, they replace the cached values. If the promise returned by this method is not awaited,
   * the client's state may shift from cached to updated network values during the session, potentially affecting consistency.
   * This method is best used in scenarios where up-to-date configuration is critical and initial delays are acceptable.
   *
   * @param {StatsigUser} user - The new StatsigUser for which the client should update its internal state.
   * @param {AsyncOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Promise<void>} A promise that resolves once the client is fully updated with the latest values from the network or a timeout (if set) is hit.
   * @see {@link updateUserSync} for the synchronous version of this method.
   */
  async updateUserAsync(
    user: StatsigUser,
    options?: AsyncOptions,
  ): Promise<void> {
    this._resetForUser(user);

    const initiator = this._user;

    let result = this.dataAdapter.getDataSync(initiator);

    this._setStatus('Loading', result);

    this._store.setValuesFromDataAdapter(result);
    result = await this.dataAdapter.getDataAsync(result, initiator, options);

    // ensure the user hasn't changed while we were waiting
    if (initiator !== this._user) {
      return;
    }

    this._store.setValuesFromDataAdapter(result);
    this._finalizeUpdate(result);
  }

  /**
   * Retrieves a synchronous context containing data currently being used by the SDK. Represented as a {@link PrecomputedEvaluationsContext} object.
   *
   * @returns {PrecomputedEvaluationsContext} The current synchronous context for the this StatsigClient instance.
   * @see {@link getAsyncContext} for the asynchronous version of the context that includes more information.
   */
  getContext(): PrecomputedEvaluationsContext {
    return {
      sdkKey: this._sdkKey,
      options: this._options,
      values: this._store.getValues(),
      user: JSON.parse(JSON.stringify(this._user)) as StatsigUser,
      errorBoundary: this._errorBoundary,
    };
  }

  /**
   * Asynchronously retrieves a context similar to that provided by {@link getContext}, but with additional properties fetched asynchronously, such as session and stable IDs. This is useful for situations where these IDs are required and are not immediately available.
   *
   * @returns {PrecomputedEvaluationsAsyncContext} An object containing the current values.
   * @see {@link getContext} for the synchronous version of the context that this function extends.
   */
  async getAsyncContext(): Promise<PrecomputedEvaluationsAsyncContext> {
    return {
      ...this.getContext(),
      session: await StatsigSession.get(this._sdkKey),
      stableID: await StableID.get(this._sdkKey),
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
  getFeatureGate(
    name: string,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getGate(hash);
    const gate = _makeFeatureGate(name, details, evaluation);
    const overridden = this._overrideAdapter?.getGateOverride?.(
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

  /**
   * Retrieves the value of a dynamic config for the current user.
   *
   * @param {string} name The name of the dynamic config to get.
   * @param {DynamicConfigEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {DynamicConfig} - The {@link DynamicConfig} object representing the dynamic configs's current evaluation results for the user.
   */
  getDynamicConfig(
    name: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    const dynamicConfig = this._getConfigImpl('dynamic_config', name, options);
    this.$emt({ name: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  /**
   * Retrieves the value of a experiment for the current user.
   *
   * @param {string} name The name of the experiment to get.
   * @param {ExperimentEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Experiment} - The {@link Experiment} object representing the experiments's current evaluation results for the user.
   */
  getExperiment(
    name: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    const experiment = this._getConfigImpl('experiment', name, options);
    this.$emt({ name: 'experiment_evaluation', experiment });
    return experiment;
  }

  /**
   * Retrieves the value of a layer for the current user.
   *
   * @param {string} name The name of the layer to get.
   * @param {LayerEvaluationOptions} [options] - Optional. Additional options to customize the method call.
   * @returns {Layer} - The {@link Layer} object representing the layers's current evaluation results for the user.
   */
  getLayer(name: string, options?: LayerEvaluationOptions): Layer {
    const hash = DJB2(name);

    const { evaluation, details } = this._store.getLayer(hash);
    const layer = _makeLayer(name, details, evaluation);

    const overridden = this._overrideAdapter?.getLayerOverride?.(
      layer,
      this._user,
      options,
    );

    const result = _mergeOverride(
      layer,
      overridden,
      overridden?.__value ?? layer.__value,
      (param: string) => {
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

    this._user = _normalizeUser(user, this._options.environment);

    const stableIdOverride = this._user.customIDs?.stableID;
    if (stableIdOverride) {
      StableID.setOverride(stableIdOverride, this._sdkKey);
    }
  }

  private _getConfigImpl(
    kind: 'experiment' | 'dynamic_config',
    name: string,
    options?: DynamicConfigEvaluationOptions | ExperimentEvaluationOptions,
  ): DynamicConfig {
    const hash = DJB2(name);
    const { evaluation, details } = this._store.getConfig(hash);

    const config = _makeDynamicConfig(name, details, evaluation);

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
      _createConfigExposure(this._user, result),
      options,
    );

    return result;
  }
}
