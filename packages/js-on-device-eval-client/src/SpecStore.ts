import {
  DataAdapterResult,
  DataSource,
  typedJsonParse,
} from '@statsig/client-core';

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

export type SpecKind = 'gate' | 'config' | 'layer';

export default class SpecStore {
  private _values: DownloadConfigSpecsResponse | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;

  setValuesFromDataAdapter(result: DataAdapterResult | null): void {
    if (!result) {
      return;
    }

    const values = typedJsonParse<DownloadConfigSpecsResponse>(
      result.data,
      'has_updates',
      'Failed to parse DownloadConfigSpecsResponse',
    );

    if (values?.has_updates !== true) {
      return;
    }

    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    this._source = result.source;
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

  getSpecAndSourceInfo(kind: SpecKind, name: string): SpecAndSourceInfo {
    // todo: use Object instead of Array
    const specs = this._getSpecs(kind);

    return {
      spec: specs?.find((spec) => spec.name === name) ?? null,
      source: this._source,
      lcut: this._lcut,
      receivedAt: this._receivedAt,
    };
  }

  private _getSpecs(kind: SpecKind) {
    switch (kind) {
      case 'gate':
        return this._values?.feature_gates;
      case 'config':
        return this._values?.dynamic_configs;
      case 'layer':
        return this._values?.layer_configs;
    }
  }
}
