import type { FeatureGate, StatsigUser } from '@sigstat/core';
import {
  DJB2,
  DynamicConfig,
  Experiment,
  Layer,
  MonitoredClass,
  PrecomputedEvaluationsInterface,
  StableID,
  StatsigClientBase,
  StatsigEvent,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  emptyDynamicConfig,
  emptyFeatureGate,
  emptyLayer,
  normalizeUser,
} from '@sigstat/core';

import { EvaluationDataProviderInterface } from './EvaluationDataProvider';
import EvaluationStore from './EvaluationStore';
import Network from './Network';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { LocalStorageCacheEvaluationsDataProvider } from './data-providers/LocalStorageCacheEvaluationsDataProvider';
import { NetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';

@MonitoredClass
export default class PrecomputedEvaluationsClient
  extends StatsigClientBase
  implements PrecomputedEvaluationsInterface
{
  private _options: StatsigOptions;
  private _network: Network;
  private _store: EvaluationStore;
  private _user: StatsigUser;
  private _dataProviders: EvaluationDataProviderInterface[];

  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    const network = new Network(options?.api);

    super(sdkKey, network, options);

    if (options?.overrideStableID) {
      StableID.setOverride(options?.overrideStableID);
    }

    this._sdkKey = sdkKey;
    this._options = options ?? {};
    this._store = new EvaluationStore(sdkKey);
    this._network = network;
    this._user = user;
    this._dataProviders =
      this._options.dataProviders ?? this._getDefaultDataProviders();
  }

  async initialize(): Promise<void> {
    return this.updateUser(this._user);
  }

  async updateUser(user: StatsigUser): Promise<void> {
    this._logger.reset();
    this._store.reset();

    this._user = normalizeUser(user, this._options.environment);

    this.setStatus('Loading');

    let result: string | null = null;
    for await (const provider of this._dataProviders) {
      result = await provider.getEvaluationsData(this._sdkKey, this._user);
      if (!result) {
        continue;
      }

      this._store.setValuesFromData(result, provider.source());

      if (provider.isTerminal()) {
        break;
      }
    }

    this._store.finalize();

    this.setStatus('Provided');

    if (!result) {
      return;
    }

    for await (const provider of this._dataProviders) {
      await provider.setEvaluationsData(this._sdkKey, this._user, result);
    }
  }

  async shutdown(): Promise<void> {
    await this._logger.shutdown();
  }

  checkGate(name: string): boolean {
    return this.getFeatureGate(name).value;
  }

  getFeatureGate(name: string): FeatureGate {
    const hash = DJB2(name);
    const res = this._store.values?.feature_gates[hash];
    const gate = emptyFeatureGate(name);

    if (res == null) {
      return gate;
    }

    this._logger.enqueue(
      createGateExposure(
        this._user,
        name,
        res.value,
        res.rule_id,
        res.secondary_exposures,
      ),
    );

    return { ...gate, ruleID: res.rule_id, value: res.value };
  }

  getDynamicConfig(name: string): DynamicConfig {
    const hash = DJB2(name);
    const res = this._store.values?.dynamic_configs[hash];
    const config = emptyDynamicConfig(name);

    if (res == null) {
      return config;
    }

    this._logger.enqueue(
      createConfigExposure(
        this._user,
        name,
        res.rule_id,
        res.secondary_exposures,
      ),
    );

    return { ...config, ruleID: res.rule_id, value: res.value };
  }

  getExperiment(name: string): Experiment {
    return this.getDynamicConfig(name);
  }

  getLayer(name: string): Layer {
    const hash = DJB2(name);
    const res = this._store.values?.layer_configs[hash];

    const layer = emptyLayer(name);

    if (res == null) {
      return layer;
    }

    return {
      ...layer,
      ruleID: res.rule_id,
      getValue: (param) => {
        if (!(param in res.value)) {
          return undefined;
        }

        this._logger.enqueue(
          createLayerParameterExposure(this._user, name, param, res),
        );

        return res.value[param];
      },
    };
  }

  logEvent(event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }

  private _getDefaultDataProviders(): EvaluationDataProviderInterface[] {
    return [
      new LocalStorageCacheEvaluationsDataProvider(),
      new NetworkEvaluationsDataProvider(this._network),
    ];
  }
}
