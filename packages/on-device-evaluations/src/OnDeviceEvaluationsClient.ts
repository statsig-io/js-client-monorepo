import {
  DynamicConfig,
  EventLogger,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  StatsigClientBase,
  StatsigEvent,
  StatsigUser,
} from '@sigstat/core';

import Evaluator from './Evaluator';
import Network from './Network';
import SpecStore from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

export default class OnDeviceEvaluationsClient
  extends StatsigClientBase
  implements OnDeviceEvaluationsInterface
{
  private _network: Network;
  private _options: StatsigOptions;
  private _store: SpecStore;
  private _evaluator: Evaluator;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const network = new Network(sdkKey, options);
    super(network);

    this._options = options ?? {};
    this._network = network;
    this._logger = new EventLogger(this._network);
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
  }

  async initialize(): Promise<void> {
    this.setStatus('Loading');

    const response = await this._network.fetchConfigSpecs();

    if (response.has_updates) {
      this._store.setValues(response);
      this.setStatus('Network');
    } else {
      this.setStatus('Error');
    }
  }

  async shutdown(): Promise<void> {
    return Promise.resolve();
  }

  checkGate(user: StatsigUser, name: string): boolean {
    return this.getFeatureGate(user, name).value;
  }

  getFeatureGate(user: StatsigUser, name: string): FeatureGate {
    const result = this._evaluator.checkGate(user, name);
    return {
      name,
      ruleID: result.rule_id,
      value: result.value,
    };
  }

  getDynamicConfig(user: StatsigUser, name: string): DynamicConfig {
    const result = this._evaluator.getConfig(user, name);
    return {
      name,
      ruleID: result.rule_id,
      value: result.json_value,
    };
  }

  getExperiment(user: StatsigUser, name: string): Experiment {
    return this.getDynamicConfig(user, name);
  }

  getLayer(user: StatsigUser, name: string): Layer {
    const result = this._evaluator.getLayer(user, name);
    const values = result.json_value;
    return {
      name,
      ruleID: result.rule_id,
      getValue: (param: string) => values[param] ?? null,
    };
  }

  logEvent(_user: StatsigUser, _event: StatsigEvent): void {
    throw new Error('Method not implemented.');
  }
}
