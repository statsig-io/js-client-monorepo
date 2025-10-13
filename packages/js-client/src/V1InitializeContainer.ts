import {
  DynamicConfigEvaluation,
  GateEvaluation,
  InitializeResponseV1WithUpdates,
  LayerEvaluation,
  ParamStoreConfig,
  SecondaryExposure,
  _DJB2,
} from '@statsig/client-core';

import { InitializeContainer } from './InitializeContainer';

export class V1InitializeContainer implements InitializeContainer {
  constructor(private _values: InitializeResponseV1WithUpdates) {}
  getGate(name: string): GateEvaluation | null {
    return this._getResultFromLookup(this._values.feature_gates, name);
  }

  getConfig(name: string): DynamicConfigEvaluation | null {
    return this._getResultFromLookup(this._values.dynamic_configs, name);
  }

  getLayer(name: string): LayerEvaluation | null {
    return this._getResultFromLookup(this._values.layer_configs, name);
  }

  getParamStore(name: string): ParamStoreConfig | null {
    return this._getResultFromLookup(this._values.param_stores, name);
  }

  getConfigList(): string[] {
    return Object.keys(this._values.dynamic_configs);
  }

  getExposureMapping(): Record<string, SecondaryExposure> | undefined {
    return this._values.exposures;
  }

  private _getResultFromLookup<T>(
    lookup: Record<string, T> | undefined,
    name: string,
  ): T | null {
    if (!lookup) {
      return null;
    }
    return lookup[name] ?? lookup[_DJB2(name)] ?? null;
  }
}
