import { NetworkCore } from '@sigstat/core';

import { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigMetadata } from './StatsigMetadata';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, api: string) {
    super(sdkKey, StatsigMetadata, '', api);
  }

  fetchConfigSpecs(): Promise<DownloadConfigSpecsResponse> {
    return this._sendPostRequest(
      `${this._api}/download_config_specs`,
      {
        sinceTime: 0,
      },
      2000,
    );
  }
}
