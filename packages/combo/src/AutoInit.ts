import { Log } from '@statsig/client-core';

type InitArgs = {
  sdkKey: string;
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

    if (sdkKey) {
      action({ sdkKey });
    }
  }
}
