import { getUUID } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { AutoCapture } from './AutoCapture';

export class WebAnalytics {
  private static _capture: AutoCapture | null = null;
  private static _client: StatsigClient | null = null;

  static autoInit(sdkKey: string): void {
    const current: unknown = __STATSIG__?.instances?.[sdkKey];
    if (current instanceof StatsigClient) {
      this._client = current;
    }

    if (!this._client) {
      this._client = new StatsigClient(sdkKey, {
        userID: `web-analytics-user::${getUUID()}`,
      });
    }

    this._capture = new AutoCapture(sdkKey, this._client);
    this._client.initializeSync();
  }
}
