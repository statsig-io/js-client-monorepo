import {
  NetworkCore,
  NetworkDefault,
  NetworkPriority,
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

  async fetchConfigSpecs(
    sdkKey: string,
    priority: NetworkPriority | undefined,
  ): Promise<string | null> {
    const response = await this.get({
      sdkKey: sdkKey,
      url: this._downloadConfigSpecsUrl,
      priority,
    });

    return response?.body ?? null;
  }
}
