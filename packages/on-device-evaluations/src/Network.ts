import { NetworkCore } from '@sigstat/core';

import { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrl: string;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    super(sdkKey, options?.api ?? 'https://api.statsig.com/v1');
    this._downloadConfigSpecsUrl =
      // options.baseDownloadConfigSpecsUrl ??
      `https://api.statsigcdn.com/v1/download_config_specs/${sdkKey}.json`;
  }

  fetchConfigSpecs(): Promise<DownloadConfigSpecsResponse> {
    return this._sendGetRequest(this._downloadConfigSpecsUrl, 2000);
  }
}
