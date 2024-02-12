import { NetworkCore } from '@sigstat/core';

import { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_SPECS_URL = 'https://api.statsigcdn.com/v1/download_config_specs';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrl: string;
  private _mainApi: string;

  constructor(
    private _sdkKey: string,
    options: StatsigOptions | null = null,
  ) {
    super();

    const base = options?.baseDownloadConfigSpecsUrl ?? DEFAULT_SPECS_URL;

    this._mainApi = options?.api ?? 'https://api.statsig.com/v1';
    this._downloadConfigSpecsUrl = `${base}/${this._sdkKey}.json`;
  }

  async fetchConfigSpecs(): Promise<DownloadConfigSpecsResponse | null> {
    const result = await this.get({
      sdkKey: this._sdkKey,
      url: this._downloadConfigSpecsUrl,
      timeoutMs: 2000,
    });

    if (result) {
      return JSON.parse(result) as DownloadConfigSpecsResponse;
    }

    return null;
  }
}
