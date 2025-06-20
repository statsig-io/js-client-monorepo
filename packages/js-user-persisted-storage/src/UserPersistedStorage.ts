import { SecondaryExposure } from '@statsig/client-core';

export type StickyValues = {
  value: boolean;
  rule_id: string;
  json_value: Record<string, unknown>;
  secondary_exposures: SecondaryExposure[];
  group_name: string | null;
  time: number;
  undelegated_secondary_exposures?: SecondaryExposure[];
  config_delegate?: string | null;
  explicit_parameters?: string[];
};

export type UserPersistedValues = Record<string, StickyValues>;

export type UserPersistentStorage = {
  delete(key: string, experiment: string): void;
  load(key: string): UserPersistedValues;
  save(key: string, experiment: string, data: string): void;
  loadAsync(key: string): Promise<UserPersistedValues>;
};
