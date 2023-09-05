import {
  DynamicConfig,
  IStatsigLocalEvalClient,
  Layer,
  StatsigLoadingStatus,
  StatsigLogger,
  StatsigUser,
} from '@statsig/core';
import SpecStore from './SpecStore';
import StatsigNetwork from './StatsigNetwork';
import { StatsigOptions } from './StatsigOptions';
import Evaluator from './Evaluator';

export default class StatsigLocalEvalClient implements IStatsigLocalEvalClient {
  loadingStatus: StatsigLoadingStatus = 'uninitialized';

  private _network: StatsigNetwork;
  private _options: StatsigOptions;
  private _logger: StatsigLogger;
  private _store: SpecStore;
  private _evaluator: Evaluator;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    this._options = options ?? { api: 'https://api.statsig.com/v1' };
    this._network = new StatsigNetwork(sdkKey, this._options.api);
    this._logger = new StatsigLogger(this._network);
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
  }

  async initialize(): Promise<void> {
    this.loadingStatus = 'loading';

    const response = await this._network.fetchConfigSpecs();

    if (response.has_updates) {
      this._store.setValues(response);
      this.loadingStatus = 'ready-network';
    } else {
      this.loadingStatus = 'error' as unknown as StatsigLoadingStatus;
    }
  }

  checkGate(user: StatsigUser, name: string): boolean {
    return this._evaluator.checkGate(user, name).value;
  }
  getConfig(_user: StatsigUser, _name: string): DynamicConfig {
    throw new Error('Method not implemented.');
  }
  getExperiment(_user: StatsigUser, _name: string): DynamicConfig {
    throw new Error('Method not implemented.');
  }
  getLayer(_user: StatsigUser, _name: string): Layer {
    throw new Error('Method not implemented.');
  }
}
