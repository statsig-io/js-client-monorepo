import { LocalOverrides, makeEmptyOverrides } from './LocalOverrides';

type Method = (...args: unknown[]) => unknown;

type ClientPrototype = ClientWithOverrides & {
  checkGate: Method;
  getDynamicConfig: Method;
  getExperiment: Method;
  getLayer: Method;
  _overrides?: LocalOverrides;
};

type ExtendedClientPrototype = ClientPrototype & {
  _checkGateActual: Method;
  _getDynamicConfigActual: Method;
  _getExperimentActual: Method;
  _getLayerActual: Method;
};

export interface ClientWithOverrides {
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
  _overrides?: LocalOverrides;
}

export function bind(proto?: ClientPrototype) {
  if (!proto) {
    return;
  }

  const extended = proto as ExtendedClientPrototype;

  extended.overrideGate = function (name, value) {
    if (!this._overrides) {
      this._overrides = makeEmptyOverrides();
    }

    if (value != null) {
      this._overrides.gates = { ...this._overrides.gates, [name]: value };
    } else {
      delete this._overrides.gates[name];
    }
  };

  extended.overrideExperiment = function (name, value) {
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

  extended.overrideLayer = function (name, value) {
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
  extended.checkGate = function (...args: unknown[]) {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.gates[name] != null) {
      return this._overrides.gates[name];
    }
    return this._checkGateActual(...args);
  };

  extended._getDynamicConfigActual = proto.getDynamicConfig;
  extended.getDynamicConfig = function (...args: unknown[]) {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.configs[name] != null) {
      return this._overrides.configs[name];
    }
    return this._getDynamicConfigActual(...args);
  };

  extended._getExperimentActual = proto.getExperiment;
  extended.getExperiment = function (...args: unknown[]) {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.configs[name] != null) {
      return this._overrides.configs[name];
    }
    return this._getExperimentActual(...args);
  };

  extended._getLayerActual = proto.getLayer;
  extended.getLayer = function (...args: unknown[]) {
    const name = typeof args[0] === 'string' ? args[0] : (args[1] as string);
    if (this._overrides?.layers[name] != null) {
      return this._overrides.layers[name];
    }
    return this._getLayerActual(...args);
  };
}
