import { DJB2 } from './Hashing';
import { SecondaryExposure } from './StatsigEvent';
import { StatsigUser } from './StatsigUser';

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

export default class SpecStore {
  values: StoreValues | null = null;

  constructor(private _sdkKey: string) {}

  setValues(user: StatsigUser, values: StoreValues) {
    this.values = values;

    const cacheKey = createCacheKey(user, this._sdkKey);
    localStorage.setItem(cacheKey, JSON.stringify(values));
  }

  switchToUser(user: StatsigUser) {
    this.values = null;
    const cacheKey = createCacheKey(user, this._sdkKey);
    const json = localStorage.getItem(cacheKey);

    if (json) {
      this.values = JSON.parse(json) as StoreValues;
    }
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
