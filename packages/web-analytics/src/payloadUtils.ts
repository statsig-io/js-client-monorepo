import { _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';

export function _gatherPageViewPayload(
  url: URL,
): Record<string, string | number> {
  const safeDoc = _getDocumentSafe();
  const safeWnd = _getWindowSafe();
  if (!safeDoc || !safeWnd) {
    return {};
  }

  const navigator = safeWnd?.navigator;
  const referrer = safeDoc?.referrer || '';
  let refUrl = new URL('empty:');
  if (referrer) {
    try {
      refUrl = new URL(referrer || 'empty:');
    } catch (e) {
      /* empty */
    }
  }

  const searchInfo = getSearchInfo(refUrl);
  const campaignParams = getCampaignParams(url);
  const queryParams = {} as Record<string, string>;
  url.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });
  return {
    ...searchInfo,
    ...campaignParams,
    ...queryParams,
    title: safeDoc?.title || '',
    locale: navigator?.language || 'unknown',
    referrer,
    screen_width: safeWnd?.screen?.width || 'unknown',
    screen_height: safeWnd?.screen?.height || 'unknown',
    viewport_width: safeWnd?.innerWidth || 'unknown',
    viewport_height: safeWnd?.innerHeight || 'unknown',
  };
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
