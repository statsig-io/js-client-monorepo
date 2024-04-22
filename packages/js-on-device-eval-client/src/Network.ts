import {
  NetworkCore,
  NetworkDefault,
  _getOverridableUrl,
} from '@statsig/client-core';

import { StatsigOptions } from './StatsigOptions';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrl: string;

  constructor(options: StatsigOptions | null = null) {
    super(options);

    const config = options?.networkConfig;
    this._downloadConfigSpecsUrl = _getOverridableUrl(
      config?.downloadConfigSpecsUrl,
      config?.api,
      '/download_config_specs',
      NetworkDefault.specsApi,
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
