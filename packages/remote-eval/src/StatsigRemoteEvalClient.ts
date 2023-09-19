import {
  DynamicConfig,
  Experiment,
  Layer,
  DJB2,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  StatsigUser,
  normalizeUser,
  StatsigLogger,
  Monitored,
  IStatsigRemoteEvalClient,
  StatsigLoadingStatus,
  StatsigEvent,
  getStableID,
} from '@statsig/core';
import SpecStore from './SpecStore';

import StatsigNetwork from './StatsigNetwork';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_RULE = 'default';

@Monitored
export default class StatsigRemoteEvalClient
  implements IStatsigRemoteEvalClient
{
  loadingStatus: StatsigLoadingStatus = 'uninitialized';

  private _options: StatsigOptions;
  private _network: StatsigNetwork;
  private _logger: StatsigLogger;
  private _store: SpecStore;
  private _user: StatsigUser;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    this._options = options ?? { api: 'https://api.statsig.com/v1' };

    this._store = new SpecStore(sdkKey);
    this._network = new StatsigNetwork(
      sdkKey,
      getStableID(this._options),
      this._options.api,
    );
    this._logger = new StatsigLogger(this._network);
    this._user = {};
  }

  async initialize(user: StatsigUser) {
    await this.updateUser(user);
  }

  async updateUser(user: StatsigUser) {
    this.loadingStatus = 'loading';
    this._user = normalizeUser(user, this._options.environment);
    const cacheHit = this._store.switchToUser(this._user);
    if (cacheHit) {
      this.loadingStatus = 'ready-cache';
    }

    const capturedUser = this._user;
    const response = await this._network.fetchEvaluations(capturedUser);

    if (response.has_updates) {
      this._store.setValues(capturedUser, response);
    }

    this.loadingStatus = 'ready-network';
  }

  async shutdown(): Promise<void> {
    await this._logger.shutdown();
  }

  checkGate(name: string): boolean {
    const hash = DJB2(name);
    const res = this._store.values?.feature_gates[hash];
    if (res == null) {
      return false;
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

    return res.value;
  }

  getConfig(name: string): DynamicConfig {
    const hash = DJB2(name);
    const res = this._store.values?.dynamic_configs[hash];
    const config = {
      name,
      ruleID: DEFAULT_RULE,
      value: {},
    };

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
    return this.getConfig(name);
  }

  getLayer(name: string): Layer {
    const hash = DJB2(name);
    const res = this._store.values?.layer_configs[hash];

    const layer = {
      name,
      ruleID: DEFAULT_RULE,
      getValue: (): unknown => undefined,
    };

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

  logEvent(event: StatsigEvent) {
    this._logger.enqueue({ ...event, user: this._user, time: Date.now() });
  }
}
