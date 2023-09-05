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
};

export type DownloadConfigSpecsResponse = {
  feature_gates: Spec[];
  dynamic_configs: Spec[];
  layer_configs: Spec[];
  time: number;
  has_updates: boolean;
};

export default class SpecStore {
  values: DownloadConfigSpecsResponse | null = null;

  setValues(values: DownloadConfigSpecsResponse) {
    this.values = values;
  }
}
