import { Log, _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

type InitArgs = {
  sdkKey: string;
  client: StatsigClient;
};

export abstract class AutoInit {
  static attempt(action: (args: InitArgs) => void): void {
    try {
      const win = _getWindowSafe();
      const doc = _getDocumentSafe();

      if (!win || !doc || !doc.currentScript) {
        return;
      }

      const srcUrl = doc.currentScript.getAttribute('src');
      const baseUrl = win.location?.href;

      if (!srcUrl || !baseUrl) {
        return;
      }

      let sdkKey: string | null = null;

      const url = new URL(srcUrl, baseUrl);
      const params = url.searchParams;
      sdkKey = params.get('sdkkey') ?? params.get('sdkKey');

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
    } catch (error) {
      Log.error('AutoInit failed', error);
    }
  }
}
