import { NetworkCore } from '@sigstat/core';

import { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_SPECS_URL = 'https://api.statsigcdn.com/v1/download_config_specs';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrl: string;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    super(sdkKey, options?.api ?? 'https://api.statsig.com/v1');

    const base = options?.baseDownloadConfigSpecsUrl ?? DEFAULT_SPECS_URL;
    this._downloadConfigSpecsUrl = `${base}/${sdkKey}.json`;
  }

  fetchConfigSpecs(): Promise<DownloadConfigSpecsResponse | null> {
    return this.get({
      url: this._downloadConfigSpecsUrl,
      timeoutMs: 2000,
    });
  }
}
