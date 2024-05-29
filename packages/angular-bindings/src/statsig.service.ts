import { Inject, Injectable, OnDestroy } from '@angular/core';

import {
  FeatureGateEvaluationOptions,
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  SDKType,
  StatsigClientInterface,
  StatsigUser,
} from '@statsig/client-core';

import { Memoize } from './memoizeDecorator';
import { STATSIG_CLIENT } from './statsig.module';

export type FeatureGateOptions = FeatureGateEvaluationOptions & {
  user: StatsigUser | null;
};

@Injectable()
export class StatsigService implements OnDestroy {
  private _renderVersion = 0;

  constructor(
    @Inject(STATSIG_CLIENT) private readonly _client: StatsigClientInterface,
  ) {
    Log.debug('StatsigService created', this._client);
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
    Log.debug(`checkGate caled for ${gateName}`);

    return this._checkGateImpl(this._renderVersion, gateName, options);
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
    Log.debug(
      `CheckGateImpl caled for ${gateName}, rv: ${this._renderVersion}`,
    );

    if (this._isPrecomputedEvalClient(this._client)) {
      return this._client.checkGate(gateName, options);
    } else {
      if (options?.user) {
        return this._client.checkGate(gateName, options.user, options);
      }
      Log.warn(
        `checkGate method failed to find a valid Statsig client for gate '${gateName}'.`,
      );

      return false;
    }
  }

  private _isPrecomputedEvalClient(
    client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface,
  ): client is PrecomputedEvaluationsInterface {
    return 'updateUserSync' in client;
  }

  private _onValuesUpdated = (): void => {
    this._renderVersion++;
    Log.debug('Values updated', this._renderVersion);
  };
}
