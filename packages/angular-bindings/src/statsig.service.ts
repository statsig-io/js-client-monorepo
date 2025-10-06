import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  DataAdapterAsyncOptions,
  DataAdapterSyncOptions,
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  Log,
  ParameterStore,
  ParameterStoreEvaluationOptions,
  SDKType,
  StatsigEvent,
  StatsigUpdateDetails,
  StatsigUser,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { Memoize } from './memoizeDecorator';
import { STATSIG_INIT_CONFIG, StatsigInitConfig } from './statsig.module';

@Injectable({
  providedIn: 'root',
})
export class StatsigService implements OnDestroy {
  private _renderVersion = 0;
  private _client: StatsigClient;

  private _isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this._isLoadingSubject.asObservable();

  constructor(
    @Inject(STATSIG_INIT_CONFIG) provider: StatsigInitConfig<StatsigClient>,
  ) {
    if ('client' in provider) {
      this._client = provider.client;
    } else if ('sdkKey' in provider && 'user' in provider) {
      this._client = new StatsigClient(
        provider.sdkKey,
        provider.user,
        provider.options,
      );
      this._client
        .initializeAsync()
        .catch((error) => {
          Log.error('Error initializing StatsigClient', error);
        })
        .finally(() => {
          this._isLoadingSubject.next(false);
        });
    } else {
      Log.error(
        'Must provide a client or sdkKey and user to initialize StatsigService',
      );
      this._client = new StatsigClient('', {});
    }
    Log.debug('StatsigService created', this._client);
    this._checkAndEmitLoadingStatus();
    this._client.$on('values_updated', this._onValuesUpdated);

    SDKType._setBindingType('angular');
  }

  ngOnDestroy(): void {
    this._client.shutdown().catch((error) => {
      Log.error('An error occured during shutdown', error);
    });
    this._client.off('values_updated', this._onValuesUpdated);
  }

  checkGate(gateName: string, options?: FeatureGateEvaluationOptions): boolean {
    Log.debug(`checkGate caled for ${gateName}, rv: ${this._renderVersion}`);

    return this._checkGateImpl(this._renderVersion, gateName, options);
  }

  getDynamicConfig(
    configName: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    Log.debug(
      `getDynamicConfig called for ${configName}, rv: ${this._renderVersion}`,
    );

    return this._getDynamicConfigImpl(this._renderVersion, configName, options);
  }

  getExperiment(
    experimentName: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    Log.debug(
      `getExperiment caled for ${experimentName}, rv: ${this._renderVersion}`,
    );

    return this._getExperimentImpl(
      this._renderVersion,
      experimentName,
      options,
    );
  }

  getLayer(layerName: string, options?: LayerEvaluationOptions): Layer {
    Log.debug(`getLayer caled for ${layerName}, rv: ${this._renderVersion}`);

    return this._getLayerImpl(this._renderVersion, layerName, options);
  }

  getParameterStore(
    parameterStoreName: string,
    options?: ParameterStoreEvaluationOptions,
  ): ParameterStore {
    Log.debug(
      `getParameterStore called for ${parameterStoreName}, rv: ${this._renderVersion}`,
    );
    return this._getParameterStoreImpl(
      this._renderVersion,
      parameterStoreName,
      options,
    );
  }

  logEvent(
    eventName: StatsigEvent | string,
    value?: string | number,
    metadata?: Record<string, string>,
  ): void {
    this._client.logEvent(eventName, value, metadata);
  }

  updateUserAsync(
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<StatsigUpdateDetails> {
    return this._client.updateUserAsync(user, options);
  }

  updateUserSync(user: StatsigUser, options?: DataAdapterSyncOptions): void {
    this._client.updateUserSync(user, options);
  }

  getClient(): StatsigClient {
    return this._client;
  }

  @Memoize((...args: unknown[]) => {
    const [rv, gn, opt] = args as [
      number,
      string,
      FeatureGateEvaluationOptions,
    ];
    return `${rv}-${gn}-${JSON.stringify(opt)}`;
  })
  private _checkGateImpl(
    _rv: number,
    gateName: string,
    options?: FeatureGateEvaluationOptions,
  ): boolean {
    return this._client.checkGate(gateName, options);
  }

  @Memoize((...args: unknown[]) => {
    const [rv, gn, opt] = args as [
      number,
      string,
      DynamicConfigEvaluationOptions,
    ];
    return `${rv}-${gn}-${JSON.stringify(opt)}`;
  })
  private _getDynamicConfigImpl(
    _rv: number,
    configName: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig {
    return this._client.getDynamicConfig(configName, options);
  }

  @Memoize((...args: unknown[]) => {
    const [rv, en, opt] = args as [number, string, ExperimentEvaluationOptions];
    return `${rv}-${en}-${JSON.stringify(opt)}`;
  })
  private _getExperimentImpl(
    _rv: number,
    experimentName: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment {
    return this._client.getExperiment(experimentName, options);
  }

  @Memoize((...args: unknown[]) => {
    const [rv, ln, opt] = args as [number, string, LayerEvaluationOptions];
    return `${rv}-${ln}-${JSON.stringify(opt)}`;
  })
  private _getLayerImpl(
    _rv: number,
    layerName: string,
    options?: LayerEvaluationOptions,
  ): Layer {
    return this._client.getLayer(layerName, options);
  }

  @Memoize((...args: unknown[]) => {
    const [rv, pn, opt] = args as [
      number,
      string,
      ParameterStoreEvaluationOptions,
    ];
    return `${rv}-${pn}-${JSON.stringify(opt)}`;
  })
  private _getParameterStoreImpl(
    _rv: number,
    parameterStoreName: string,
    options?: ParameterStoreEvaluationOptions,
  ): ParameterStore {
    return this._client.getParameterStore(parameterStoreName, options);
  }

  private _checkAndEmitLoadingStatus(): void {
    const isReady = _isReady(this._client);
    if (isReady) {
      this._isLoadingSubject.next(false);
      Log.debug('Client is now ready, loading status set to false');
    } else {
      this._isLoadingSubject.next(true);
      Log.debug('Client is not ready, loading status set to true');
    }
  }

  private _onValuesUpdated = (): void => {
    this._renderVersion++;
    Log.debug('Values updated', this._renderVersion);
    this._checkAndEmitLoadingStatus();
  };
}

function _isReady(client: StatsigClient): boolean {
  return client.loadingStatus === 'Ready';
}
