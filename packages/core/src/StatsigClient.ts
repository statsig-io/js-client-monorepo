import { DynamicConfig, Experiment, Layer } from './StatsigTypes';
import { DJB2 } from './Hashing';
import SpecStore from './SpecStore';
import {
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
} from './StatsigEvent';
import StatsigLogger from './StatsigLogger';
import StatsigNetwork from './StatsigNetwork';
import { StatsigOptions } from './StatsigOptions';
import { StatsigUser, normalizeUser } from './StatsigUser';

export default class StatsigClient {
  private _store: SpecStore;
  private _logger: StatsigLogger;
  private _network: StatsigNetwork;
  private _user: StatsigUser;
  private _options: StatsigOptions;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    this._options = options ?? { api: 'https://api.statsig.com/v1' };
    this._network = new StatsigNetwork(sdkKey, this._options);
    this._logger = new StatsigLogger(this._network);
    this._store = new SpecStore(sdkKey);
    this._user = {};
  }

  async initialize(user: StatsigUser) {
    await this.updateUser(user);
  }

  async updateUser(user: StatsigUser) {
    this._user = normalizeUser(this._options, user);
    this._store.switchToUser(this._user);

    const capturedUser = this._user;
    const response = await this._network.fetchEvaluations(capturedUser);

    if (response.has_updates) {
      this._store.setValues(capturedUser, response);
    }
  }

  checkGate(name: string, fallback = false): boolean {
    const hash = DJB2(name);
    const res = this._store.values?.feature_gates[hash];
    if (res == null) {
      return fallback;
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
      ruleID: 'default',
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
      ruleID: 'default',
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
}
