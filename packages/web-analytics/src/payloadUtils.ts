import { _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';

import { _getSafeTimezone, _getSafeTimezoneOffset } from './Utils';

function stripEmptyValues<T extends Record<string, string | number | null>>(
  obj: T,
): Partial<Record<keyof T, string | number>> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null && value !== ''),
  ) as Partial<Record<keyof T, string | number>>;
}

export function _gatherPageViewPayload(
  url: URL,
): Record<string, string | number> {
  const safeDoc = _getDocumentSafe();
  const safeWnd = _getWindowSafe();
  if (!safeDoc || !safeWnd) {
    return {};
  }

  const referrer = safeDoc?.referrer || '';
  let refUrl = new URL('empty:');
  if (referrer) {
    try {
      refUrl = new URL(referrer || 'empty:');
    } catch (e) {
      /* empty */
    }
  }

  const commonInfo = getCommonInfo(safeWnd, safeDoc, url);
  const searchInfo = getSearchInfo(refUrl);
  const campaignParams = getCampaignParams(url);
  const queryParams = {} as Record<string, string>;
  url.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });

  return stripEmptyValues({
    ...commonInfo,
    ...searchInfo,
    ...campaignParams,
    ...queryParams,
    referrer,
  });
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
    'gclid', // Google
    'gclsrc', // Google
    'dclid', // DoubleClick
    'fbclid', // Facebook
    'msclkid', // Bing
    'mc_eid', // Mailchimp
    'mc_cid', // Mailchimp
    'twclid', // Twitter
    'li_fat_id', // LinkedIn
    'igshid', // Instagram
    'utm_id', // Hubspot
    'ttc', // TikTok
    'ttclid', // TikTok
    'ttc_id', // TikTok
  ];
  commonUtms.forEach((p) => {
    const val = urlParams.get(p);
    if (val) {
      campaignParams[p] = val;
    }
  });
  return campaignParams;
}

function getSearchEngine(refUrl: URL): string {
  const host = refUrl.hostname;
  const engine = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'].find((e) =>
    host.includes(e + '.'),
  );
  return engine || '';
}

function getSearchInfo(refUrl: URL) {
  const searchEngine = getSearchEngine(refUrl);
  const searchQuery =
    refUrl.searchParams.get(searchEngine === 'yahoo' ? 'p' : 'q') || '';
  return { searchEngine, searchQuery };
}

function getCommonInfo(
  safeWnd: Window,
  safeDoc: Document,
  url: URL,
): Record<string, string | number | null> {
  return {
    title: safeDoc?.title,
    current_url: safeWnd?.location?.href,
    user_agent:
      safeWnd?.navigator?.userAgent?.length > 200
        ? safeWnd?.navigator?.userAgent?.substring(0, 200)
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
  };
}
