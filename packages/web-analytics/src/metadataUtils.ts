import { _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';

import {
  _getSafeTimezone,
  _getSafeTimezoneOffset,
  _stripEmptyValues,
} from './commonUtils';

export function _gatherCommonMetadata(
  url: URL,
): Record<string, string | number | null> {
  const safeDoc = _getDocumentSafe();
  const safeWnd = _getWindowSafe();

  return _stripEmptyValues({
    title: safeDoc?.title,
    current_url: safeWnd?.location?.href,
    user_agent:
      safeWnd?.navigator?.userAgent &&
      safeWnd?.navigator?.userAgent?.length > 200
        ? safeWnd.navigator.userAgent.substring(0, 200)
        : safeWnd?.navigator?.userAgent,
    locale: safeWnd?.navigator?.language,
    hostname: url.hostname,
    pathname: url.pathname,
    screen_width: safeWnd?.screen?.width,
    screen_height: safeWnd?.screen?.height,
    viewport_width: safeWnd?.innerWidth,
    viewport_height: safeWnd?.innerHeight,
    timestamp: Date.now(),
    timezone: _getSafeTimezone(),
    timezone_offset: _getSafeTimezoneOffset(),
  });
}

export function _gatherAllMetadata(url: URL): Record<string, string | number> {
  const safeDoc = _getDocumentSafe();
  const safeWnd = _getWindowSafe();
  if (!safeDoc || !safeWnd) {
    return {};
  }

  const referrerInfo = getReferrerInfo(safeDoc);
  const commonInfo = _gatherCommonMetadata(url);
  const campaignParams = getCampaignParams(url);
  const queryParams = {} as Record<string, string>;
  url.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });

  return {
    ...commonInfo,
    ..._stripEmptyValues({
      ...referrerInfo,
      ...campaignParams,
      ...queryParams,
    }),
  };
}

function getReferrerInfo(safeDoc: Document): {
  referrer: string | null;
  referrer_domain: string | null;
  referrer_path: string | null;
  searchEngine: string;
  searchQuery: string;
} {
  const referrer = safeDoc?.referrer || '';
  if (!referrer) {
    return {
      referrer: null,
      referrer_domain: null,
      referrer_path: null,
      searchEngine: '',
      searchQuery: '',
    };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname;
    const searchEngine =
      ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'].find((e) =>
        host.includes(e + '.'),
      ) || '';
    const searchQuery =
      url.searchParams.get(searchEngine === 'yahoo' ? 'p' : 'q') || '';

    return {
      referrer,
      referrer_domain: url.hostname,
      referrer_path: url.pathname,
      searchEngine,
      searchQuery,
    };
  } catch (e) {
    return {
      referrer: null,
      referrer_domain: null,
      referrer_path: null,
      searchEngine: '',
      searchQuery: '',
    };
  }
}

function getCampaignParams(url: URL): Record<string, string> {
  const urlParams = url.searchParams;
  const campaignParams: Record<string, string> = {};
  const commonUtms = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'msclkid', // Bing
    'dclid', // DoubleClick
    'fbclid', // Facebook
    'gad_source', // Google
    'gclid', // Google
    'gclsrc', // Google
    'wbraid', // Google
    'utm_id', // Hubspot
    'irclid', // Impact
    'igshid', // Instagram
    '_kx', // Klaviyo
    'li_fat_id', // LinkedIn
    'mc_cid', // Mailchimp
    'mc_eid', // Mailchimp
    'epik', // Pinterest
    'qclid', // Quora
    'rdt_cid', // Reddit
    'sccid', // Snapchat
    'ttc', // TikTok
    'ttclid', // TikTok
    'ttc_id', // TikTok
    'twclid', // Twitter
  ];
  commonUtms.forEach((p) => {
    const val = urlParams.get(p);
    if (val) {
      campaignParams[p] = val;
    }
  });
  return campaignParams;
}
