import { Inject, Injectable, OnDestroy } from '@angular/core';

import { Log, StatsigClientInterface } from '@statsig/client-core';

import { STATSIG_CLIENT } from './statsig.module';

@Injectable()
export class StatsigService implements OnDestroy {
  private _renderVersion = 0;

  constructor(
    @Inject(STATSIG_CLIENT) private readonly _client: StatsigClientInterface,
  ) {
    this._client.initializeSync();
    Log.debug('Statsig client initialized', this._client);
  }

  onValuesUpdated = (): void => {
    this._renderVersion++;
    Log.debug('Values updated', this._renderVersion);
  };

  ngOnDestroy(): void {
    this._client.shutdown().catch((error) => {
      Log.error('An error occured during shutdown', error);
    });
    this._client.off('values_updated', this.onValuesUpdated);
  }
}
