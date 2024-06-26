import {
  AnyEvaluation,
  DataAdapterResult,
  DataSource,
  DetailedStoreResult,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  InitializeResponse,
  InitializeResponseWithUpdates,
  LayerEvaluation,
  ParamStoreConfig,
  _DJB2,
  _typedJsonParse,
} from '@statsig/client-core';

export default class EvaluationStore {
  private _rawValues: string | null = null;
  private _values: InitializeResponseWithUpdates | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;

  reset(): void {
    this._values = null;
    this._rawValues = null;
    this._source = 'Loading';
    this._lcut = 0;
    this._receivedAt = 0;
  }

  finalize(): void {
    if (this._values) {
      return;
    }

    this._source = 'NoValues';
  }

  getValues(): InitializeResponseWithUpdates | null {
    return this._rawValues
      ? _typedJsonParse<InitializeResponseWithUpdates>(
          this._rawValues,
          'has_updates',
          'EvaluationStoreValues',
        )
      : null;
  }

  setValues(result: DataAdapterResult | null): void {
    if (!result) {
      return;
    }

    const values = _typedJsonParse<InitializeResponse>(
      result.data,
      'has_updates',
      'EvaluationResponse',
    );

    if (values?.has_updates !== true) {
      return;
    }

    this._rawValues = result.data;
    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    this._source = result.source;
    this._values = values;
  }

  getGate(name: string): DetailedStoreResult<GateEvaluation> {
    return this._getDetailedStoreResult(this._values?.feature_gates, name);
  }

  getConfig(name: string): DetailedStoreResult<DynamicConfigEvaluation> {
    return this._getDetailedStoreResult(this._values?.dynamic_configs, name);
  }

  getLayer(name: string): DetailedStoreResult<LayerEvaluation> {
    return this._getDetailedStoreResult(this._values?.layer_configs, name);
  }

  getParamStore(name: string): DetailedStoreResult<ParamStoreConfig> {
    return this._getDetailedStoreResult(this._values?.param_stores, name);
  }

  private _getDetailedStoreResult<T extends AnyEvaluation | ParamStoreConfig>(
    lookup: Record<string, T> | undefined,
    name: string,
  ): DetailedStoreResult<T> {
    let result: T | null = null;
    if (lookup) {
      result = lookup[name] ? lookup[name] : lookup[_DJB2(name)];
    }

    return {
      result,
      details: this._getDetails(result == null),
    };
  }

  private _getDetails(isUnrecognized: boolean): EvaluationDetails {
    if (this._source === 'Uninitialized' || this._source === 'NoValues') {
      return { reason: this._source };
    }

    const subreason = isUnrecognized ? 'Unrecognized' : 'Recognized';
    const reason = `${this._source}:${subreason}`;

    return {
      reason,
      lcut: this._lcut,
      receivedAt: this._receivedAt,
    };
  }
}
