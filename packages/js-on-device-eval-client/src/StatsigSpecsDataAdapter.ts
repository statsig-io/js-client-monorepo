import {
  DataAdapterCore,
  SpecsDataAdapter,
  StatsigUser,
} from '@statsig/client-core';

import Network from './Network';
import { StatsigOptions } from './StatsigOptions';

export class StatsigSpecsDataAdapter
  extends DataAdapterCore
  implements SpecsDataAdapter
{
  private _network: Network | null = null;

  constructor() {
    super('SpecsDataAdapter', 'specs');
  }

  override attach(sdkKey: string, options: StatsigOptions | null): void {
    super.attach(sdkKey, options);
    this._network = new Network(options ?? {});
  }

  protected override async _fetchFromNetwork(
    _current: string | null,
    _user?: StatsigUser,
  ): Promise<string | null> {
    return (await this._network?.fetchConfigSpecs(this._getSdkKey())) ?? null;
  }
}
