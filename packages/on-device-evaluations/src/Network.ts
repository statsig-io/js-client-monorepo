import { NetworkCore } from '@statsig/client-core';

import { StatsigOptions } from './StatsigOptions';

const DEFAULT_SPECS_URL = 'https://api.statsigcdn.com/v1/download_config_specs';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrlBase: string;

  constructor(options: StatsigOptions | null = null) {
    super(options);

    this._downloadConfigSpecsUrlBase =
      options?.baseDownloadConfigSpecsUrl ?? DEFAULT_SPECS_URL;
  }

  async fetchConfigSpecs(sdkKey: string): Promise<string | null> {
    const response = await this.get({
      sdkKey: sdkKey,
      url: `${this._downloadConfigSpecsUrlBase}/${sdkKey}.json`,
      timeoutMs: 2000,
    });

    return response?.body ?? null;
  }
}
