import { DataSource } from '@statsig/client-core';

type SpecType = 'gate' | 'config' | 'layer';

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
  source: DataSource = 'Loading';

  setValuesFromData(data: string, source: DataSource): void {
    const values = JSON.parse(data) as DownloadConfigSpecsResponse;
    if (!values.has_updates) {
      return;
    }

    this.source = source;
    this.values = values;
  }

  reset(): void {
    this.values = null;
    this.source = 'Loading';
  }

  finalize(): void {
    if (this.values) {
      return;
    }

    this.source = 'NoValues';
  }

  getSpec(type: SpecType, name: string): Spec | null {
    // todo: use Object instead of Array
    const specs = this._getSpecs(type);
    return specs?.find((spec) => spec.name === name) ?? null;
  }

  private _getSpecs(type: SpecType) {
    switch (type) {
      case 'gate':
        return this.values?.feature_gates;
      case 'config':
        return this.values?.dynamic_configs;
      case 'layer':
        return this.values?.layer_configs;
    }
  }
}
