import {
  DynamicConfigEvaluation,
  GateEvaluation,
  InitializeResponseV2,
  LayerEvaluation,
  ParamStoreConfig,
  SecondaryExposure,
  _DJB2,
} from '@statsig/client-core';

import { InitializeContainer } from './InitializeContainer';

export class V2InitializeContainer implements InitializeContainer {
  constructor(private _values: InitializeResponseV2) {}
  getGate(name: string): GateEvaluation | null {
    const evalV2 = this._getResultFromLookup(this._values.feature_gates, name);
    if (!evalV2) {
      return null;
    }
    return {
      name: name,
      value: evalV2.v === true,
      rule_id: evalV2.r ?? 'default',
      secondary_exposures: evalV2.s ?? [],
      id_type: evalV2.i ?? '',
    };
  }

  getConfig(name: string): DynamicConfigEvaluation | null {
    const evalV2 = this._getResultFromLookup(
      this._values.dynamic_configs,
      name,
    );
    if (!evalV2) {
      return null;
    }
    return {
      name: name,
      value: this._values.values[evalV2.v] ?? {},
      rule_id: evalV2.r,
      secondary_exposures: evalV2.s ?? [],
      id_type: evalV2.i ?? '',
      is_user_in_experiment: evalV2.ue === true ? true : false,
      passed: evalV2.p === true,
      group_name: evalV2.gn ?? undefined,
      is_experiment_active: evalV2.ea === true ? true : false,
      group: evalV2.r,
      is_device_based: evalV2.i === 'stableID',
    };
  }

  getLayer(name: string): LayerEvaluation | null {
    const evalV2 = this._getResultFromLookup(this._values.layer_configs, name);
    if (!evalV2) {
      return null;
    }
    return {
      name: name,
      value: this._values.values[evalV2.v] ?? {},
      rule_id: evalV2.r,
      secondary_exposures: evalV2.s ?? [],
      is_user_in_experiment: evalV2.ue === true ? true : false,
      group_name: evalV2.gn ?? undefined,
      is_experiment_active: evalV2.ea === true ? true : false,
      group: evalV2.r,
      is_device_based: evalV2.i === 'stableID',
      allocated_experiment_name: evalV2.ae ?? '',
      explicit_parameters: evalV2.ep ?? [],
      undelegated_secondary_exposures: evalV2.us ?? [],
      parameter_rule_ids: evalV2.pr,
    };
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
