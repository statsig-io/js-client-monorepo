import {
  DynamicConfig,
  Experiment,
  Layer,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

import { LocalOverrides, makeEmptyOverrides } from './LocalOverrides';

type CheckGateMethod =
  | PrecomputedEvaluationsInterface['checkGate']
  | OnDeviceEvaluationsInterface['checkGate'];

type GetDynamicConfigMethod =
  | PrecomputedEvaluationsInterface['getDynamicConfig']
  | OnDeviceEvaluationsInterface['getDynamicConfig'];

type GetLayerMethod =
  | PrecomputedEvaluationsInterface['getLayer']
  | OnDeviceEvaluationsInterface['getLayer'];

export interface ClientPrototype {
  _overrides?: LocalOverrides;

  checkGate: CheckGateMethod;
  getDynamicConfig: GetDynamicConfigMethod;
  getExperiment: GetDynamicConfigMethod;
  getLayer: GetLayerMethod;

  overrideGate: (name: string, value: boolean | null) => void;
  overrideDynamicConfig: (
    name: string,
    value: Record<string, unknown> | null,
  ) => void;
  overrideExperiment: (
    name: string,
    value: Record<string, unknown> | null,
  ) => void;
  overrideLayer: (name: string, value: Record<string, unknown> | null) => void;
}

type ExtendedClientPrototype = ClientPrototype & {
  _checkGateActual: CheckGateMethod;

  _getDynamicConfigActual: GetDynamicConfigMethod;
  _getExperimentActual: GetDynamicConfigMethod;
  _getLayerActual: GetLayerMethod;
};

export function bind(proto?: ClientPrototype): void {
  if (!proto) {
    return;
  }

  const extended = proto as ExtendedClientPrototype;

  extended.overrideGate = function (
    this: ExtendedClientPrototype,
    name,
    value,
  ) {
    if (!this._overrides) {
      this._overrides = makeEmptyOverrides();
    }

    if (value != null) {
      this._overrides.gates = { ...this._overrides.gates, [name]: value };
    } else {
      delete this._overrides.gates[name];
    }
  };

  extended.overrideExperiment = function (
    this: ExtendedClientPrototype,
    name,
    value,
  ) {
    if (!this._overrides) {
      this._overrides = makeEmptyOverrides();
    }

    if (value != null) {
      this._overrides.configs = { ...this._overrides.configs, [name]: value };
    } else {
      delete this._overrides.configs[name];
    }
  };
  extended.overrideDynamicConfig = extended.overrideExperiment;

  extended.overrideLayer = function (
    this: ExtendedClientPrototype,
    name,
    value,
  ) {
    if (!this._overrides) {
      this._overrides = makeEmptyOverrides();
    }

    if (value != null) {
      this._overrides.layers = { ...this._overrides.layers, [name]: value };
    } else {
      delete this._overrides.layers[name];
    }
  };

  extended._checkGateActual = proto.checkGate;
  extended.checkGate = function (
    this: ExtendedClientPrototype,
    ...args: unknown[]
  ): boolean {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.gates[name] != null) {
      return this._overrides.gates[name];
    }

    return this._checkGateActual(...args);
  };

  extended._getDynamicConfigActual = proto.getDynamicConfig;
  extended.getDynamicConfig = function (
    this: ExtendedClientPrototype,
    ...args: unknown[]
  ): DynamicConfig {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.configs[name] != null) {
      return {
        name,
        ruleID: 'local_override',
        value: this._overrides?.configs[name],
      };
    }
    return this._getDynamicConfigActual(...args);
  };

  extended._getExperimentActual = proto.getExperiment;
  extended.getExperiment = function (
    this: ExtendedClientPrototype,
    ...args: unknown[]
  ): Experiment {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.configs[name] != null) {
      return {
        name,
        ruleID: 'local_override',
        value: this._overrides?.configs[name],
      };
    }
    return this._getExperimentActual(...args);
  };

  extended._getLayerActual = proto.getLayer;
  extended.getLayer = function (
    this: ExtendedClientPrototype,
    ...args: unknown[]
  ): Layer {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.layers[name] != null) {
      const values = this._overrides?.layers[name];
      return {
        name,
        ruleID: 'local_override',
        getValue: (param: string) => {
          return values[param];
        },
      };
    }
    return this._getLayerActual(...args);
  };
}
