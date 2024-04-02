import { Log } from '@statsig/client-core';

import { AutoCapture } from './AutoCapture';
import { WebAnalytics } from './WebAnalytics';

export { WebAnalytics, AutoCapture };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  WebAnalytics,
  AutoCapture,
};

export default __STATSIG__;

function _attemptAutoInit() {
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

  try {
    const url = new URL(srcUrl, baseUrl);
    const params = url.searchParams;
    const sdkKey = params.get('sdkkey') ?? params.get('sdkKey');

    if (sdkKey) {
      WebAnalytics.autoInit(sdkKey);
    } else {
      Log.error('Statsig Web AutoCapture: No SDK key provided');
    }
  } catch (e) {
    Log.error('Statsig Web AutoCapture: Invalid source URL');
  }
}

_attemptAutoInit();
