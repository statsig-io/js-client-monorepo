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

import {
  EvaluationDataProviderInterface,
  EvaluationSource,
} from '../../core/src/EvaluationDataProvider';
import EvaluationStore from './EvaluationStore';
import Network from './Network';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { LocalStorageCacheEvaluationsDataProvider } from './data-providers/LocalStorageCacheEvaluationsDataProvider';
import { NetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';

type DataProviderResult = { data: string | null; source: EvaluationSource };

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

    const result = await this._getResultFromDataProviders('during-init');

    if (result.data) {
      this._store.setValuesFromData(result.data, result.source);
    }

    this._store.finalize();

    this.setStatus('Ready');

    this._runPostInitDataProviders(result.data).catch((error) => {
      this.emit({ event: 'error', error: error as unknown });
    });
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
    const gate = emptyFeatureGate({ name, source: this._store.source });

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

    return {
      ...gate,
      ruleID: res.rule_id,
      value: res.value,
    };
  }

  getDynamicConfig(name: string): DynamicConfig {
    const hash = DJB2(name);
    const res = this._store.values?.dynamic_configs[hash];
    const config = emptyDynamicConfig({ name, source: this._store.source });

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

    const layer = emptyLayer({ name, source: this._store.source });

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

  private async _getResultFromDataProviders(
    mode: 'during-init' | 'post-init',
  ): Promise<DataProviderResult> {
    let result: DataProviderResult = { data: null, source: 'NoValues' };

    for await (const provider of this._dataProviders) {
      const func =
        mode === 'during-init'
          ? provider.getEvaluationsData?.(this._sdkKey, this._user)
          : provider.getEvaluationsDataPostInit?.(this._sdkKey, this._user);

      const data = (await func) ?? null;

      if (!data) {
        continue;
      }

      result = { data, source: provider.source() };

      if (provider.isTerminal()) {
        break;
      }
    }

    return result;
  }

  private async _runPostInitDataProviders(data: string | null): Promise<void> {
    const localResult = await this._getResultFromDataProviders('post-init');
    data = localResult.data ?? data;

    if (!data) {
      return;
    }

    for await (const provider of this._dataProviders) {
      await provider.setEvaluationsData?.(this._sdkKey, this._user, data);
    }
  }
}
