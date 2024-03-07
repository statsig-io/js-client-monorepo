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

export type SpecAndSourceInfo = {
  spec: Spec | null;
  source: DataSource;
  lcut: number;
  receivedAt: number;
};

export default class SpecStore {
  private _values: DownloadConfigSpecsResponse | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;

  setValuesFromData(data: string, source: DataSource): void {
    const values = JSON.parse(data) as DownloadConfigSpecsResponse;
    if (!values.has_updates) {
      return;
    }

    this._lcut = values.time;
    this._receivedAt = Date.now();
    this._source = source;
    this._values = values;
  }

  reset(): void {
    this._values = null;
    this._source = 'Loading';
  }

  finalize(): void {
    if (this._values) {
      return;
    }

    this._source = 'NoValues';
  }

  getSpec(type: SpecType, name: string): SpecAndSourceInfo {
    // todo: use Object instead of Array
    const specs = this._getSpecs(type);

    return {
      spec: specs?.find((spec) => spec.name === name) ?? null,
      source: this._source,
      lcut: this._lcut,
      receivedAt: this._receivedAt,
    };
  }

  private _getSpecs(type: SpecType) {
    switch (type) {
      case 'gate':
        return this._values?.feature_gates;
      case 'config':
        return this._values?.dynamic_configs;
      case 'layer':
        return this._values?.layer_configs;
    }
  }
}
