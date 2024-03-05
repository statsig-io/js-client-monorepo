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
import Network from './Network';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { LocalStorageCacheEvaluationsDataProvider } from './data-providers/LocalStorageCacheEvaluationsDataProvider';
import { NetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';

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
    const network = new Network(options);

    super(
      sdkKey,
      network,
      options,
      options?.dataProviders ?? [
        new LocalStorageCacheEvaluationsDataProvider(),
        new NetworkEvaluationsDataProvider(network),
      ],
    );

    monitorClass(this._errorBoundary, PrecomputedEvaluationsClient, this);
    monitorClass(this._errorBoundary, Network, network);

    this._sdkKey = sdkKey;
    this._options = options ?? {};
    this._store = new EvaluationStore(sdkKey);
    this._network = network;
    this._user = user;
  }

  async initialize(): Promise<void> {
    return this.updateUser(this._user);
  }

  getCurrentUser(): StatsigUser {
    return JSON.parse(JSON.stringify(this._user)) as StatsigUser;
  }

  async updateUser(user: StatsigUser): Promise<void> {
    this._logger.reset();
    this._store.reset();

    this._user = normalizeUser(user, this._options.environment);

    this._setStatus('Loading');

    const result = await this._getResultFromDataProviders(
      'during-init',
      this._user,
    );

    if (result.data) {
      this._store.setValuesFromData(result.data, result.source);
    }

    this._store.finalize();

    this._setStatus('Ready');

    this._runPostInitDataProviders(result.data, this._user);
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
    const res = this._store.values?.feature_gates[hash];

    const gate = makeFeatureGate(
      name,
      this._store.source,
      res?.rule_id,
      res?.value,
    );

    this._enqueueExposure(
      options,
      createGateExposure(this._user, gate, res?.secondary_exposures),
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
    const res = this._store.values?.layer_configs[hash];

    // todo: un-ugly
    const layer = makeLayer(name, this._store.source, res?.rule_id, (param) => {
      if (!res) {
        return;
      }

      if (!(param in res.value)) {
        return undefined;
      }

      this._enqueueExposure(
        options,
        createLayerParameterExposure(this._user, name, param, {
          ...res,
          source: this._store.source,
        }),
      );

      return res.value[param];
    });

    this.emit({ event: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }

  private _getConfigImpl(
    name: string,
    options: EvaluationOptions,
  ): DynamicConfig {
    const hash = DJB2(name);
    const res = this._store.values?.dynamic_configs[hash];
    const config = makeDynamicConfig(
      name,
      this._store.source,
      res?.rule_id,
      res?.value,
    );

    this._enqueueExposure(
      options,
      createConfigExposure(this._user, config, res?.secondary_exposures),
    );

    return config;
  }
}
