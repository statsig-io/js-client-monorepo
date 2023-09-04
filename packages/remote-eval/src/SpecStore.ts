import {
  DJB2,
  getObjectFromLocalStorage,
  setObjectInLocalStorage,
  SecondaryExposure,
  StatsigUser,
} from '@statsig/core';

type Spec<T> = {
  name: string;
  value: T;
  rule_id: string;
  group_name: string;
  id_type: string;
  secondary_exposures: SecondaryExposure[];
};

export type GateSpec = Spec<boolean>;

export type ConfigSpec = Spec<Record<string, unknown>> & {
  name: string;
  rule_id: string;
  group: string;
  group_name: string;
  is_device_based: boolean;
  id_type: string;
  is_experiment_active: boolean;
  is_user_in_experiment: boolean;
};

export type LayerSpec = Omit<ConfigSpec, 'id_type'> & {
  allocated_experiment_name: string;
  explicit_parameters: string[];
  undelegated_secondary_exposures?: SecondaryExposure[];
};

export type StoreValues = {
  feature_gates: Record<string, GateSpec>;
  dynamic_configs: Record<string, ConfigSpec>;
  layer_configs: Record<string, LayerSpec>;
  time: number;
  has_updates: boolean;
};

const MANIFEST_KEY = 'statsig.manifest';
const CACHE_LIMIT = 10;

export default class SpecStore {
  values: StoreValues | null = null;
  manifest: Record<string, number> | null = null;

  constructor(private _sdkKey: string) {}

  setValues(user: StatsigUser, values: StoreValues) {
    this.values = values;

    const cacheKey = createCacheKey(user, this._sdkKey);
    setObjectInLocalStorage(cacheKey, values);

    this._enforceStorageLimit(cacheKey);
  }

  switchToUser(user: StatsigUser) {
    this.values = null;
    const cacheKey = createCacheKey(user, this._sdkKey);
    const json = localStorage.getItem(cacheKey);

    if (json) {
      this.values = JSON.parse(json) as StoreValues;
    }
  }

  private _enforceStorageLimit(cacheKey: string) {
    this.manifest =
      this.manifest ??
      getObjectFromLocalStorage<Record<string, number>>(MANIFEST_KEY);
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
