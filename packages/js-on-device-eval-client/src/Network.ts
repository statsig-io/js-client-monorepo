import {
  Endpoint,
  NetworkCore,
  NetworkPriority,
  UrlConfiguration,
} from '@statsig/client-core';

import { StatsigOptions } from './StatsigOptions';

export default class StatsigNetwork extends NetworkCore {
  private _downloadConfigSpecsUrlConfig: UrlConfiguration;

  constructor(options: StatsigOptions | null = null) {
    super(options);

    const config = options?.networkConfig;
    this._downloadConfigSpecsUrlConfig = new UrlConfiguration(
      Endpoint._download_config_specs,
      config?.downloadConfigSpecsUrl,
      config?.api,
      config?.downloadConfigSpecsFallbackUrls,
    );
  }

  async fetchConfigSpecs(
    sdkKey: string,
    priority: NetworkPriority | undefined,
  ): Promise<string | null> {
    const response = await this.get({
      sdkKey: sdkKey,
      urlConfig: this._downloadConfigSpecsUrlConfig,
      priority,
    });

    return response?.body ?? null;
  }
}
