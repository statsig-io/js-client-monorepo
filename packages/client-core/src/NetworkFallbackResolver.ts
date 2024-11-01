import { _fetchTxtRecords } from './DnsTxtQuery';
import { ErrorBoundary } from './ErrorBoundary';
import { _DJB2 } from './Hashing';
import { Log } from './Log';
import { NetworkArgs, NetworkDefault } from './NetworkConfig';
import { AnyStatsigOptions } from './StatsigOptionsCommon';
import { Storage } from './StorageProvider';

type DomainKey = 'i' | 'e' | 'd';

export type FallbackResolverArgs = {
  fallbackUrl: string | null;
};

type FallbackInfoEntry = {
  url: string | null;
  previous: string[];
  expiryTime: number;
};

type FallbackInfo = {
  [key in DomainKey]?: FallbackInfoEntry;
};

type NetworkFunc = (url: string, args: NetworkArgs) => Promise<Response>;

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOLDOWN_TIME_MS = 4 * 60 * 60 * 1000; // 4 hours

export class NetworkFallbackResolver {
  private _fallbackInfo: FallbackInfo | null = null;
  private _errorBoundary: ErrorBoundary | null = null;
  private _networkOverrideFunc?: NetworkFunc;
  private _cooldowns: Record<string, number> = {};

  constructor(options: AnyStatsigOptions) {
    this._networkOverrideFunc = options.networkConfig?.networkOverrideFunc;
  }

  public setErrorBoundary(errorBoundary: ErrorBoundary): void {
    this._errorBoundary = errorBoundary;
  }

  public tryBumpExpiryTime(sdkKey: string, url: string): void {
    const domainKey = _getDomainKeyFromEndpoint(url);
    if (!domainKey) {
      return;
    }

    const info = this._fallbackInfo?.[domainKey];
    if (!info) {
      return;
    }

    info.expiryTime = Date.now() + DEFAULT_TTL_MS;
    _tryWriteFallbackInfoToCache(sdkKey, {
      ...this._fallbackInfo,
      [domainKey]: info,
    });
  }

  public getFallbackUrl(sdkKey: string, url: string): string | null {
    const domainKey = _getDomainKeyFromEndpoint(url);
    if (!_isDefaultUrl(url) || !domainKey) {
      return null;
    }

    let info = this._fallbackInfo;
    if (info == null) {
      info = _readFallbackInfoFromCache(sdkKey) ?? {};
      this._fallbackInfo = info;
    }

    const entry = info[domainKey];
    if (!entry || Date.now() > (entry.expiryTime ?? 0)) {
      delete info[domainKey];
      this._fallbackInfo = info;
      _tryWriteFallbackInfoToCache(sdkKey, this._fallbackInfo);
      return null;
    }

    const endpoint = _extractEndpointForUrl(url);
    if (entry.url) {
      return `https://${entry.url}/${endpoint}`;
    }

    return null;
  }

  public async tryFetchUpdatedFallbackInfo(
    sdkKey: string,
    url: string,
    errorMessage: string | null,
    timedOut: boolean,
  ): Promise<boolean> {
    try {
      const domainKey = _getDomainKeyFromEndpoint(url);
      if (!_isDomainFailure(errorMessage, timedOut) || !domainKey) {
        return false;
      }

      if (
        this._cooldowns[domainKey] &&
        Date.now() < this._cooldowns[domainKey]
      ) {
        return false;
      }
      this._cooldowns[domainKey] = Date.now() + COOLDOWN_TIME_MS;

      const newUrl = await this._fetchFallbackUrl(domainKey);
      if (!newUrl) {
        return false;
      }

      this._updateFallbackInfoWithNewUrl(sdkKey, domainKey, newUrl);

      return true;
    } catch (error) {
      this._errorBoundary?.logError('tryFetchUpdatedFallbackInfo', error);
      return false;
    }
  }

  private _updateFallbackInfoWithNewUrl(
    sdkKey: string,
    domainKey: DomainKey,
    newUrl: string,
  ): void {
    const newFallbackInfo: FallbackInfoEntry = {
      url: newUrl,
      expiryTime: Date.now() + DEFAULT_TTL_MS,
      previous: [],
    };

    const previousInfo = this._fallbackInfo?.[domainKey];
    if (previousInfo) {
      newFallbackInfo.previous.push(...previousInfo.previous);
    }

    if (newFallbackInfo.previous.length > 10) {
      newFallbackInfo.previous = [];
    }

    const previousUrl = this._fallbackInfo?.[domainKey]?.url;
    if (previousUrl != null) {
      newFallbackInfo.previous.push(previousUrl);
    }

    this._fallbackInfo = {
      ...this._fallbackInfo,
      [domainKey]: newFallbackInfo,
    };
    _tryWriteFallbackInfoToCache(sdkKey, this._fallbackInfo);
  }

  private async _fetchFallbackUrl(
    domainKey: DomainKey,
  ): Promise<string | null> {
    const records = await _fetchTxtRecords(this._networkOverrideFunc ?? fetch);
    if (records.length === 0) {
      return null;
    }

    const seen = new Set(this._fallbackInfo?.[domainKey]?.previous ?? []);
    const currentUrl = this._fallbackInfo?.[domainKey]?.url;

    let found: string | null = null;
    for (const record of records) {
      const [recordKey, recordUrl] = record.split('=');
      if (!recordUrl || recordKey !== domainKey) {
        continue;
      }

      let url = recordUrl;
      if (recordUrl.endsWith('/')) {
        url = recordUrl.slice(0, -1);
      }

      if (!seen.has(recordUrl) && url !== currentUrl) {
        found = url;
        break;
      }
    }

    return found;
  }
}

export function _isDefaultUrl(url: string): boolean {
  for (const key in NetworkDefault) {
    if (url.startsWith(NetworkDefault[key as keyof typeof NetworkDefault])) {
      return true;
    }
  }
  return false;
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

function _extractEndpointForUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const endpoint = url.pathname.substring(1);
    return endpoint;
  } catch (error) {
    return '';
  }
}

function _getDomainKeyFromEndpoint(endpoint: string): 'i' | 'e' | 'd' | null {
  if (endpoint.includes('initialize')) {
    return 'i';
  }

  if (endpoint.includes('rgstr')) {
    return 'e';
  }

  if (endpoint.includes('download_config_specs')) {
    return 'd';
  }

  return null;
}
