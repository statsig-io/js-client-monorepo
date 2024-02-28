import type { FeatureGate, StatsigUser } from '@statsig/client-core';
import {
  DJB2,
  DynamicConfig,
  Experiment,
  Layer,
  PrecomputedEvaluationsInterface,
  StableID,
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
    monitorClass(PrecomputedEvaluationsClient, this);

    if (options?.overrideStableID) {
      StableID.setOverride(options.overrideStableID, sdkKey);
    }

    this._sdkKey = sdkKey;
    this._options = options ?? {};
    this._store = new EvaluationStore(sdkKey);
    this._network = network;
    this._user = user;
  }

  async initialize(): Promise<void> {
    return this.updateUser(this._user);
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

  checkGate(name: string): boolean {
    return this.getFeatureGate(name).value;
  }

  getFeatureGate(name: string): FeatureGate {
    const hash = DJB2(name);
    const res = this._store.values?.feature_gates[hash];

    const gate = makeFeatureGate(
      name,
      this._store.source,
      res?.rule_id,
      res?.value,
    );

    this._logger.enqueue(
      createGateExposure(this._user, gate, res?.secondary_exposures),
    );

    return gate;
  }

  getDynamicConfig(name: string): DynamicConfig {
    const hash = DJB2(name);
    const res = this._store.values?.dynamic_configs[hash];
    const config = makeDynamicConfig(
      name,
      this._store.source,
      res?.rule_id,
      res?.value,
    );

    this._logger.enqueue(
      createConfigExposure(this._user, config, res?.secondary_exposures),
    );

    return config;
  }

  getExperiment(name: string): Experiment {
    return this.getDynamicConfig(name);
  }

  getLayer(name: string): Layer {
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

      this._logger.enqueue(
        createLayerParameterExposure(this._user, name, param, {
          ...res,
          source: this._store.source,
        }),
      );

      return res.value[param];
    });

    return layer;
  }

  logEvent(event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }
}
