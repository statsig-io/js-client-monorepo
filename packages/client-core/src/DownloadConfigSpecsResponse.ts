import { ParamStoreConfig } from './ParamStoreTypes';
import { StatsigUser } from './StatsigUser';

export type SpecCondition = {
  type: string;
  targetValue: unknown;
  operator: string | null;
  field: string | null;
  additionalValues: Record<string, unknown> | null;
  idType: string;
};

export type SpecRule = {
  name: string;
  passPercentage: number;
  conditions: SpecCondition[];
  returnValue: unknown;
  id: string;
  salt: string;
  idType: string;
  configDelegate: string | null;
  isExperimentGroup?: boolean;
  groupName?: string;
};

export type Spec = {
  name: string;
  type: string;
  salt: string;
  defaultValue: unknown;
  enabled: boolean;
  idType: string;
  rules: SpecRule[];
  entity: string;
  explicitParameters: string[] | null;
  hasSharedParams: boolean;
  isActive?: boolean;
  targetAppIDs?: string[];
  version?: number;
};

export type ParamStore = {
  targetAppIDs?: string[];
  parameters: ParamStoreConfig;
};

export type DownloadConfigSpecsResponse = {
  feature_gates: Spec[];
  dynamic_configs: Spec[];
  layer_configs: Spec[];
  param_stores?: Record<string, ParamStore>;
  time: number;
  has_updates: boolean;
  sdkInfo?: Record<string, string>;
  user?: StatsigUser;
  default_environment?: string;
};
