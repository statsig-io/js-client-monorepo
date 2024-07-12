import {
  Log,
  _getCurrentPageUrlSafe,
  _getDocumentSafe,
  _getWindowSafe,
} from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

type InitArgs = {
  sdkKey: string;
  client: StatsigClient;
};

function _getParam(name: string, params: URLSearchParams): string | null {
  return params.get(name) ?? params.get(name.toLowerCase());
}

function _constructUser() {
  const win = _getWindowSafe();
  if (!win) {
    return {};
  }

  let userOverride =
    (win as unknown as Record<string, unknown>)['statsigUser'] || {};
  if (typeof userOverride !== 'object') {
    userOverride = {};
  }
  const customOverride =
    (userOverride as Record<string, unknown>)['custom'] || {};
  const customIDsOverride =
    (userOverride as Record<string, unknown>)['customIDs'] || {};
  return {
    ...userOverride,
    customIDs: {
      ...customIDsOverride,
    },
    custom: {
      ...customOverride,
      useragent: win.navigator.userAgent,
      page_url: _getCurrentPageUrlSafe() || '',
      language: win.navigator?.language,
    },
  };
}

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

      const url = new URL(srcUrl, baseUrl);
      const params = url.searchParams;
      const sdkKey = _getParam('sdkKey', params) ?? _getParam('apiKey', params);
      if (!sdkKey) {
        return;
      }

      const options: StatsigOptions = {};
      const proxy = _getParam('proxy', params);
      if (proxy) {
        options['networkConfig'] = {
          api: proxy,
        };
      }

      const current: unknown = __STATSIG__?.instances?.[sdkKey];
      let client: StatsigClient | null = null;
      if (current instanceof StatsigClient) {
        client = current;
      }

      if (!client) {
        client = new StatsigClient(sdkKey, _constructUser(), options);
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
