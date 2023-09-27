import {
  DJB2,
  getObjectFromLocalStorage,
  setObjectInLocalStorage,
  StatsigUser,
} from '@dloomb-client/core';
import { EvaluationResponse } from './EvaluationData';

const MANIFEST_KEY = 'statsig.manifest';
const CACHE_LIMIT = 10;

type StoreValues = EvaluationResponse & { has_updates: true };

export default class SpecStore {
  values: StoreValues | null = null;
  manifest: Record<string, number> | null = null;

  constructor(private _sdkKey: string) {}

  setValues(user: StatsigUser, values: EvaluationResponse): void {
    if (!values.has_updates) {
      return;
    }

    this.values = values;

    const cacheKey = createCacheKey(user, this._sdkKey);
    setObjectInLocalStorage(cacheKey, values);

    this._enforceStorageLimit(cacheKey);
  }

  switchToUser(user: StatsigUser): boolean {
    this.values = null;
    const cacheKey = createCacheKey(user, this._sdkKey);
    const json = localStorage.getItem(cacheKey);

    if (json) {
      this.values = JSON.parse(json) as StoreValues;
      return true;
    }

    return false;
  }

  private _enforceStorageLimit(cacheKey: string) {
    this.manifest =
      this.manifest ??
      getObjectFromLocalStorage<Record<string, number>>(MANIFEST_KEY) ??
      {};
    this.manifest[cacheKey] = Date.now();

    const entries = Object.entries(this.manifest);
    if (entries.length < CACHE_LIMIT) {
      setObjectInLocalStorage(MANIFEST_KEY, this.manifest);
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    localStorage.removeItem(oldest[0]);
    delete this.manifest[oldest[0]];
    setObjectInLocalStorage(MANIFEST_KEY, this.manifest);
  }
}

function createCacheKey(user: StatsigUser, sdkKey: string): string {
  const parts = [
    `uid:${user.userID ?? ''}`,
    `cids:${Object.entries(user.customIDs ?? {})
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => `${key}-${value}`)
      .join(',')}`,
    `k:${sdkKey}`,
  ];

  return DJB2(parts.join('|'));
}
