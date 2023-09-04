import { StatsigNetworkCore, StatsigUser } from '@statsig/core';
import { StoreValues } from './SpecStore';
import { SDK_TYPE } from './StatsigMetadata';

type StoreValues204 = {
  has_updates: false;
};

export default class StatsigNetwork extends StatsigNetworkCore {
  constructor(sdkKey: string, api: string) {
    super(sdkKey, SDK_TYPE, api);
  }

  fetchEvaluations(user: StatsigUser): Promise<StoreValues | StoreValues204> {
    return this._sendPostRequest(
      `${this._api}/initialize`,
      {
        user,
        hash: 'djb2',
      },
      2000,
    );
  }
}
