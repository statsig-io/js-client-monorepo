import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  FeatureGateEvaluationOptions,
  Log,
  SDKType,
  StatsigUser,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { Memoize } from './memoizeDecorator';
import { STATSIG_INIT_CONFIG, StatsigInitConfig } from './statsig.module';

export type FeatureGateOptions = FeatureGateEvaluationOptions & {
  user: StatsigUser | null;
};

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

  checkGate(gateName: string, options?: FeatureGateOptions): boolean {
    Log.debug(`checkGate caled for ${gateName}, rv: ${this._renderVersion}`);

    return this._checkGateImpl(this._renderVersion, gateName, options);
  }

  getClient(): StatsigClient {
    return this._client;
  }

  @Memoize((...args: unknown[]) => {
    const [rv, gn, opt] = args as [number, string, FeatureGateOptions];
    return `${rv}-${gn}-${JSON.stringify(opt)}`;
  })
  private _checkGateImpl(
    _rv: number,
    gateName: string,
    options?: FeatureGateOptions,
  ): boolean {
    return this._client.checkGate(gateName, options);
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
