import { NetworkCore } from '@dloomb-client/core';
import { DownloadConfigSpecsResponse } from './SpecStore';
import { SDK_TYPE } from './StatsigMetadata';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, api: string) {
    super(sdkKey, SDK_TYPE, '', api);
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
