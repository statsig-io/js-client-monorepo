import {
  AnyEvaluation,
  DataAdapterResult,
  DataSource,
  DetailedEvaluation,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  LayerEvaluation,
  typedJsonParse,
} from '@statsig/client-core';

import { EvaluationResponse } from './EvaluationData';

type EvaluationStoreValues = EvaluationResponse & { has_updates: true };

export default class EvaluationStore {
  private _values: EvaluationStoreValues | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;

  constructor(private _sdkKey: string) {}

  reset(): void {
    this._values = null;
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

  setValuesFromDataAdapter(result: DataAdapterResult | null): void {
    if (!result) {
      return;
    }

    const values = typedJsonParse<EvaluationResponse>(
      result.data,
      'has_updates',
      'Failed to parse EvaluationResponse',
    );

    if (values?.has_updates !== true) {
      return;
    }

    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    this._source = result.source;
    this._values = values;
  }

  getGate(name: string): DetailedEvaluation<GateEvaluation> {
    const evaluation = this._values?.feature_gates[name] ?? null;
    return this._makeDetailedEvaluation(evaluation);
  }

  getConfig(name: string): DetailedEvaluation<DynamicConfigEvaluation> {
    const evaluation = this._values?.dynamic_configs[name] ?? null;
    return this._makeDetailedEvaluation(evaluation);
  }

  getLayer(name: string): DetailedEvaluation<LayerEvaluation> {
    const evaluation = this._values?.layer_configs[name] ?? null;
    return this._makeDetailedEvaluation(evaluation);
  }

  private _makeDetailedEvaluation<T extends AnyEvaluation>(
    evaluation: T | null,
  ): DetailedEvaluation<T> {
    return {
      evaluation,
      details: this._getDetails(evaluation == null),
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
