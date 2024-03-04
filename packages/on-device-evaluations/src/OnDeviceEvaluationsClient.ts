import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OnDeviceEvaluationsInterface,
  StatsigClientBase,
  StatsigEvent,
  StatsigUser,
  createConfigExposure,
  createGateExposure,
  createLayerParameterExposure,
  makeDynamicConfig,
  makeFeatureGate,
  makeLayer,
  monitorClass,
  normalizeUser,
} from '@statsig/client-core';

import Evaluator from './Evaluator';
import Network from './Network';
import SpecStore, { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';
import { LocalStorageCacheSpecsDataProvider } from './data-providers/LocalStorageCacheSpecsDataProvider';
import { NetworkSpecsDataProvider } from './data-providers/NetworkSpecsDataProvider';

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
    const network = new Network(options);
    super(
      sdkKey,
      network,
      options,
      options?.dataProviders ?? [
        new LocalStorageCacheSpecsDataProvider(),
        new NetworkSpecsDataProvider(network),
      ],
    );
    monitorClass(OnDeviceEvaluationsClient, this);

    this._options = options ?? {};
    this._network = network;
    this._store = new SpecStore();
    this._evaluator = new Evaluator(this._store);
    this._source = 'NoValues';
  }

  async initialize(): Promise<void> {
    this._store.reset();

    this._setStatus('Loading');

    const result = await this._getResultFromDataProviders('during-init');

    if (result.data) {
      this._store.setValuesFromData(result.data, result.source);
    }

    this._store.finalize();

    this._setStatus('Ready');

    this._runPostInitDataProviders(result.data);
  }

  async shutdown(): Promise<void> {
    await this._logger.shutdown();
  }

  checkGate(user: StatsigUser, name: string): boolean {
    return this.getFeatureGate(user, name).value;
  }

  getFeatureGate(user: StatsigUser, name: string): FeatureGate {
    user = normalizeUser(user, this._options.environment);
    const { details, result } = this._evaluator.evaluateGate(name, user);

    const gate = makeFeatureGate(
      name,
      details.source,
      result?.rule_id,
      result?.bool_value,
    );

    this._logger.enqueue(
      createGateExposure(user, gate, result?.secondary_exposures),
    );

    this.emit({ event: 'gate_evaluation', gate });

    return gate;
  }

  getDynamicConfig(user: StatsigUser, name: string): DynamicConfig {
    const dynamicConfig = this._getConfigImpl(user, name);
    this.emit({ event: 'dynamic_config_evaluation', dynamicConfig });
    return dynamicConfig;
  }

  getExperiment(user: StatsigUser, name: string): Experiment {
    const experiment = this._getConfigImpl(user, name);
    this.emit({ event: 'experiment_evaluation', experiment });
    return experiment;
  }

  getLayer(user: StatsigUser, name: string): Layer {
    user = normalizeUser(user, this._options.environment);
    const { details, result } = this._evaluator.evaluateLayer(name, user);

    const layer = makeLayer(
      name,
      details.source,
      result?.rule_id,
      (param: string) => {
        if (!result) {
          return null;
        }

        const {
          rule_id,
          undelegated_secondary_exposures,
          secondary_exposures,
          explicit_parameters,
          config_delegate,
        } = result;

        this._logger.enqueue(
          createLayerParameterExposure(user, name, param, {
            rule_id,
            explicit_parameters: explicit_parameters ?? [],
            undelegated_secondary_exposures,
            secondary_exposures,
            allocated_experiment_name: config_delegate ?? '',
            source: details.source,
          }),
        );

        return result?.json_value?.[param] ?? null;
      },
    );

    this.emit({ event: 'layer_evaluation', layer });

    return layer;
  }

  logEvent(user: StatsigUser, event: StatsigEvent): void {
    this._logger.enqueue({ ...event, user, time: Date.now() });
  }

  private _getConfigImpl(user: StatsigUser, name: string): DynamicConfig {
    user = normalizeUser(user, this._options.environment);
    const { details, result } = this._evaluator.evaluateConfig(name, user);
    const config = makeDynamicConfig(
      name,
      details.source,
      result?.rule_id,
      result?.json_value,
    );

    this._logger.enqueue(
      createConfigExposure(user, config, result?.secondary_exposures),
    );

    return config;
  }
}
