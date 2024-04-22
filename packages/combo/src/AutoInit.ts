import { Log } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

type InitArgs = {
  sdkKey: string;
  client: StatsigClient;
};

export abstract class AutoInit {
  static attempt(action: (args: InitArgs) => void): void {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !document.currentScript
    ) {
      return;
    }

    const srcUrl = document.currentScript.getAttribute('src');
    const baseUrl = window?.location?.href;

    if (!srcUrl || !baseUrl) {
      return;
    }

    let sdkKey: string | null = null;

    try {
      const url = new URL(srcUrl, baseUrl);
      const params = url.searchParams;
      sdkKey = params.get('sdkkey') ?? params.get('sdkKey');
    } catch (e) {
      Log.error('Invalid source URL');
    }

    if (!sdkKey) {
      return;
    }

    const current: unknown = __STATSIG__?.instances?.[sdkKey];
    let client: StatsigClient | null = null;

    if (current instanceof StatsigClient) {
      client = current;
    }

    if (!client) {
      client = new StatsigClient(sdkKey, {});
      client.initializeAsync().catch((err) => {
        Log.error(err);
      });
    }

    action({ sdkKey, client });
  }
}
