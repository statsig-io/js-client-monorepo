import {
  DJB2,
  StatsigUser,
  Storage,
  getObjectFromStorage,
  setObjectInStorage,
} from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';

const MANIFEST_KEY = 'statsig.manifest';
const CACHE_LIMIT = 10;

type StoreValues = EvaluationResponse & { has_updates: true };

export default class SpecStore {
  values: StoreValues | null = null;
  manifest: Record<string, number> = {};
  _isReady: Promise<void>;

  constructor(private _sdkKey: string) {
    this._isReady = getObjectFromStorage<Record<string, number>>(
      MANIFEST_KEY,
    ).then((value) => {
      this.manifest = value ?? {};
    });
  }

  async setValues(
    user: StatsigUser,
    values: EvaluationResponse,
  ): Promise<void> {
    if (!values.has_updates) {
      return;
    }

    await this._isReady;

    this.values = values;
    const cacheKey = createCacheKey(user, this._sdkKey);
    await setObjectInStorage(cacheKey, values);
    await this._enforceStorageLimit(cacheKey);
  }

  async switchToUser(user: StatsigUser): Promise<boolean> {
    this.values = null;
    const cacheKey = createCacheKey(user, this._sdkKey);
    const json = await getObjectFromStorage<StoreValues>(cacheKey);

    if (json) {
      this.values = json;
      return true;
    }

    return false;
  }

  private async _enforceStorageLimit(cacheKey: string): Promise<void> {
    this.manifest[cacheKey] = Date.now();

    const entries = Object.entries(this.manifest);
    if (entries.length < CACHE_LIMIT) {
      await setObjectInStorage(MANIFEST_KEY, this.manifest);
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    await Storage.removeItem(oldest[0]);
    delete this.manifest[oldest[0]];
    await setObjectInStorage(MANIFEST_KEY, this.manifest);
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
