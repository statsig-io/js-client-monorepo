import { NetworkCore, _getOverridableUrl } from '@statsig/client-core';

import { StatsigOptions } from './StatsigOptions';

const DEFAULT_API = 'https://api.statsigcdn.com/v1';
const DEFAULT_ENDPOINT = '/download_config_specs';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrl: string;

  constructor(options: StatsigOptions | null = null) {
    super(options);

    this._downloadConfigSpecsUrl = _getOverridableUrl(
      options?.downloadConfigSpecsUrl,
      options?.api,
      DEFAULT_ENDPOINT,
      DEFAULT_API,
    );
  }

  async fetchConfigSpecs(sdkKey: string): Promise<string | null> {
    const response = await this.get({
      sdkKey: sdkKey,
      url: this._downloadConfigSpecsUrl,
    });

    return response?.body ?? null;
  }
}
