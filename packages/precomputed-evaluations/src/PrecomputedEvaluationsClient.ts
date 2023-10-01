import type { FeatureGate, StatsigUser } from '@sigstat/core';
import {
  DJB2,
  DynamicConfig,
  EventLogger,
  Experiment,
  Layer,
  Monitored,
  PrecomputedEvaluationsInterface,
  StatsigEvent,
  StatsigLoadingStatus,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  emptyDynamicConfig,
  emptyFeatureGate,
  emptyLayer,
  getUUID,
  normalizeUser,
} from '@sigstat/core';

import Network from './Network';
import SpecStore from './SpecStore';
import './StatsigMetadataProvider';
import type { StatsigOptions } from './StatsigOptions';

@Monitored
export default class PrecomputedEvaluationsClient
  implements PrecomputedEvaluationsInterface
{
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  private _options: StatsigOptions;
  private _network: Network;
  private _logger: EventLogger;
  private _store: SpecStore;
  private _user: StatsigUser;

  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    this._options = options ?? { api: 'https://api.statsig.com/v1' };
    this._store = new SpecStore(sdkKey);
    this._network = new Network(
      sdkKey,
      this._options.overrideStableID ?? getUUID(),
      this._options.api,
    );
    this._logger = new EventLogger(this._network);
    this._user = user;

    __STATSIG__ = __STATSIG__ ?? {};
    __STATSIG__[DJB2(sdkKey)] = this;
  }

  async initialize(): Promise<void> {
    return this.updateUser(this._user);
  }

  async updateUser(user: StatsigUser): Promise<void> {
    this.loadingStatus = 'Loading';
    this._user = normalizeUser(user, this._options.environment);

    const cacheHit = await this._store.switchToUser(this._user);
    if (cacheHit) {
      this.loadingStatus = 'Cache';
    }

    const capturedUser = this._user;

    let pendingStatus: StatsigLoadingStatus = 'Bootstrap';
    let response =
      await this._options.evaluationDataProvider?.fetchEvaluations(user);

    if (response == null) {
      pendingStatus = 'Network';
      response = await this._network.fetchEvaluations(capturedUser);
    }

    await this._store.setValues(capturedUser, response);
    this.loadingStatus = pendingStatus;
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
}
