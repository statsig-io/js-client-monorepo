import {
  DataAdapterResult,
  DataSource,
  DownloadConfigSpecsResponse,
  Spec,
  _typedJsonParse,
} from '@statsig/client-core';

export type SpecAndSourceInfo = {
  spec: Spec | null;
  source: DataSource;
  lcut: number;
  receivedAt: number;
};

export type SpecKind = 'gate' | 'config' | 'layer';

function _parseResponse(values: string): DownloadConfigSpecsResponse | null {
  return _typedJsonParse<DownloadConfigSpecsResponse>(
    values,
    'has_updates',
    'DownloadConfigSpecsResponse',
  );
}

export default class SpecStore {
  private _rawValues: string | null = null;
  private _values: DownloadConfigSpecsResponse | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;
  private _defaultEnvironment: string | null = null;

  getValues(): DownloadConfigSpecsResponse | null {
    return this._rawValues ? _parseResponse(this._rawValues) : null;
  }

  getSource(): DataSource {
    return this._source;
  }

  getDefaultEnvironment(): string | null {
    return this._defaultEnvironment;
  }

  setValuesFromDataAdapter(result: DataAdapterResult | null): void {
    if (!result) {
      return;
    }

    const values = _parseResponse(result.data);
    if (values?.has_updates !== true) {
      return;
    }

    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    this._source = result.source;
    this._values = values;
    this._rawValues = result.data;
    this._defaultEnvironment = values.default_environment ?? null;
  }

  reset(): void {
    this._values = null;
    this._rawValues = null;
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
