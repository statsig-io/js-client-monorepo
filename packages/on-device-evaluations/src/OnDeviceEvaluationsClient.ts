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
  monitorClass,
} from '@sigstat/core';

import Evaluator from './Evaluator';
import Network from './Network';
import SpecStore, { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

declare global {
  interface Window {
    statsigConfigSpecs: DownloadConfigSpecsResponse | undefined;
  }
}

export default class OnDeviceEvaluationsClient
  extends StatsigClientBase
  implements OnDeviceEvaluationsInterface
{
  private _network: Network;
  private _options: StatsigOptions;
  private _store: SpecStore;
  private _evaluator: Evaluator;
  private _source: string;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const network = new Network(sdkKey, options);
    super(sdkKey, network, options);
    monitorClass(OnDeviceEvaluationsClient, this);

    this._options = options ?? {};
    this._network = network;
    this._logger = new EventLogger(this._sdkKey, this._network, options);
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
    this._source = 'NoValues';
  }

  async initialize(): Promise<void> {
    if (window.statsigConfigSpecs) {
      this._store.setValues(window.statsigConfigSpecs);
      this._source = 'Bootstrap';
      this.setStatus('Ready');
      return;
    }

    this._source = 'Loading';
    this.setStatus('Loading');

    const response = await this._network.fetchConfigSpecs();

    if (!response) {
      this._source = 'Error';
      this.setStatus('Error');
      return;
    }

    if (response.has_updates) {
      this._store.setValues(response);
    }
    this._source = 'Network';
    this.setStatus('Ready');
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
      source: this._source,
    };
  }

  getDynamicConfig(user: StatsigUser, name: string): DynamicConfig {
    const result = this._evaluator.getConfig(user, name);
    return {
      name,
      ruleID: result.rule_id,
      value: result.json_value,
      source: this._source,
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
      source: this._source,
    };
  }

  logEvent(user: StatsigUser, event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user, time: Date.now() });
  }
}
