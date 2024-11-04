import { _fetchTxtRecords } from './DnsTxtQuery';
import { ErrorBoundary } from './ErrorBoundary';
import { _DJB2 } from './Hashing';
import { Log } from './Log';
import { Endpoint, NetworkArgs } from './NetworkConfig';
import { AnyStatsigOptions } from './StatsigOptionsCommon';
import { Storage } from './StorageProvider';
import { UrlConfiguration } from './UrlConfiguration';

export type FallbackResolverArgs = {
  fallbackUrl: string | null;
};

type FallbackInfoEntry = {
  url: string | null;
  previous: string[];
  expiryTime: number;
};

type FallbackInfo = {
  [key in Endpoint]?: FallbackInfoEntry;
};

type NetworkFunc = (url: string, args: NetworkArgs) => Promise<Response>;

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOLDOWN_TIME_MS = 4 * 60 * 60 * 1000; // 4 hours

export class NetworkFallbackResolver {
  private _fallbackInfo: FallbackInfo | null = null;
  private _errorBoundary: ErrorBoundary | null = null;
  private _networkOverrideFunc?: NetworkFunc;
  private _dnsQueryCooldowns: Record<string, number> = {};

  constructor(options: AnyStatsigOptions) {
    this._networkOverrideFunc = options.networkConfig?.networkOverrideFunc;
  }

  public setErrorBoundary(errorBoundary: ErrorBoundary): void {
    this._errorBoundary = errorBoundary;
  }

  public tryBumpExpiryTime(sdkKey: string, urlConfig: UrlConfiguration): void {
    const info = this._fallbackInfo?.[urlConfig.endpoint];
    if (!info) {
      return;
    }

    info.expiryTime = Date.now() + DEFAULT_TTL_MS;
    _tryWriteFallbackInfoToCache(sdkKey, {
      ...this._fallbackInfo,
      [urlConfig.endpoint]: info,
    });
  }

  public getActiveFallbackUrl(
    sdkKey: string,
    urlConfig: UrlConfiguration,
  ): string | null {
    let info = this._fallbackInfo;
    if (info == null) {
      info = _readFallbackInfoFromCache(sdkKey) ?? {};
      this._fallbackInfo = info;
    }

    const entry = info[urlConfig.endpoint];
    if (!entry || Date.now() > (entry.expiryTime ?? 0)) {
      delete info[urlConfig.endpoint];

      this._fallbackInfo = info;
      _tryWriteFallbackInfoToCache(sdkKey, this._fallbackInfo);
      return null;
    }

    if (entry.url) {
      return entry.url;
    }

    return null;
  }

  public getFallbackFromProvided(url: string): string | null {
    const path = _extractPathFromUrl(url);
    if (path) {
      return url.replace(path, '');
    }

    return null;
  }

  public async tryFetchUpdatedFallbackInfo(
    sdkKey: string,
    urlConfig: UrlConfiguration,
    errorMessage: string | null,
    timedOut: boolean,
  ): Promise<boolean> {
    try {
      if (!_isDomainFailure(errorMessage, timedOut)) {
        return false;
      }

      const canUseNetworkFallbacks =
        urlConfig.customUrl == null && urlConfig.fallbackUrls == null;

      const urls = canUseNetworkFallbacks
        ? await this._tryFetchFallbackUrlsFromNetwork(urlConfig)
        : urlConfig.fallbackUrls;

      const newUrl = this._pickNewFallbackUrl(
        this._fallbackInfo?.[urlConfig.endpoint],
        urls,
      );
      if (!newUrl) {
        return false;
      }

      this._updateFallbackInfoWithNewUrl(sdkKey, urlConfig.endpoint, newUrl);

      return true;
    } catch (error) {
      this._errorBoundary?.logError('tryFetchUpdatedFallbackInfo', error);
      return false;
    }
  }

  private _updateFallbackInfoWithNewUrl(
    sdkKey: string,
    endpoint: Endpoint,
    newUrl: string,
  ): void {
    const newFallbackInfo: FallbackInfoEntry = {
      url: newUrl,
      expiryTime: Date.now() + DEFAULT_TTL_MS,
      previous: [],
    };

    const previousInfo = this._fallbackInfo?.[endpoint];
    if (previousInfo) {
      newFallbackInfo.previous.push(...previousInfo.previous);
    }

    if (newFallbackInfo.previous.length > 10) {
      newFallbackInfo.previous = [];
    }

    const previousUrl = this._fallbackInfo?.[endpoint]?.url;
    if (previousUrl != null) {
      newFallbackInfo.previous.push(previousUrl);
    }

    this._fallbackInfo = {
      ...this._fallbackInfo,
      [endpoint]: newFallbackInfo,
    };
    _tryWriteFallbackInfoToCache(sdkKey, this._fallbackInfo);
  }

  private async _tryFetchFallbackUrlsFromNetwork(
    urlConfig: UrlConfiguration,
  ): Promise<string[] | null> {
    const cooldown = this._dnsQueryCooldowns[urlConfig.endpoint];
    if (cooldown && Date.now() < cooldown) {
      return null;
    }

    this._dnsQueryCooldowns[urlConfig.endpoint] = Date.now() + COOLDOWN_TIME_MS;

    const result: string[] = [];
    const records = await _fetchTxtRecords(this._networkOverrideFunc ?? fetch);

    const path = _extractPathFromUrl(urlConfig.defaultUrl);

    for (const record of records) {
      if (!record.startsWith(urlConfig.endpointDnsKey + '=')) {
        continue;
      }

      const parts = record.split('=');
      if (parts.length > 1) {
        let baseUrl = parts[1];
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }

        result.push(`https://${baseUrl}${path}`);
      }
    }

    return result;
  }

  private _pickNewFallbackUrl(
    currentFallbackInfo: FallbackInfoEntry | null | undefined,
    urls: string[] | null,
  ): string | null {
    if (urls == null) {
      return null;
    }

    const previouslyUsed = new Set(currentFallbackInfo?.previous ?? []);
    const currentFallbackUrl = currentFallbackInfo?.url;

    let found: string | null = null;
    for (const loopUrl of urls) {
      const url = loopUrl.endsWith('/') ? loopUrl.slice(0, -1) : loopUrl;

      if (!previouslyUsed.has(loopUrl) && url !== currentFallbackUrl) {
        found = url;
        break;
      }
    }

    return found;
  }
}

export function _isDomainFailure(
  errorMsg: string | null,
  timedOut: boolean,
): boolean {
  const lowerErrorMsg = errorMsg?.toLowerCase() ?? '';
  return (
    timedOut ||
    lowerErrorMsg.includes('uncaught exception') ||
    lowerErrorMsg.includes('failed to fetch') ||
    lowerErrorMsg.includes('networkerror when attempting to fetch resource')
  );
}

function _getFallbackInfoStorageKey(sdkKey: string): string {
  return `statsig.network_fallback.${_DJB2(sdkKey)}`;
}

function _tryWriteFallbackInfoToCache(
  sdkKey: string,
  info: FallbackInfo | null,
): void {
  const hashKey = _getFallbackInfoStorageKey(sdkKey);

  if (!info || Object.keys(info).length === 0) {
    Storage.removeItem(hashKey);
    return;
  }

  Storage.setItem(hashKey, JSON.stringify(info));
}

function _readFallbackInfoFromCache(sdkKey: string): FallbackInfo | null {
  const hashKey = _getFallbackInfoStorageKey(sdkKey);
  const data = Storage.getItem(hashKey);
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as FallbackInfo;
  } catch {
    Log.error('Failed to parse FallbackInfo');
    return null;
  }
}

function _extractPathFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch (error) {
    return null;
  }
}
