import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OverrideAdapter,
  StatsigUser,
  _DJB2,
  _makeTypedGet,
} from '@statsig/client-core';

const LOCAL_OVERRIDE_REASON = 'LocalOverride:Recognized';

export type OverrideStore = {
  gate: Record<string, boolean>;
  dynamicConfig: Record<string, Record<string, unknown>>;
  experiment: OverrideStore['dynamicConfig'];
  layer: OverrideStore['dynamicConfig'];
};

function _makeEmptyStore(): OverrideStore {
  return {
    gate: {},
    dynamicConfig: {},
    experiment: {},
    layer: {},
  };
}

export class LocalOverrideAdapter implements OverrideAdapter {
  private _overrides = _makeEmptyStore();

  overrideGate(name: string, value: boolean): void {
    this._overrides.gate[name] = value;
    this._overrides.gate[_DJB2(name)] = value;
  }

  removeGateOverride(name: string): void {
    delete this._overrides.gate[name];
    delete this._overrides.gate[_DJB2(name)];
  }

  getGateOverride(
    current: FeatureGate,
    _user: StatsigUser,
  ): FeatureGate | null {
    const overridden =
      this._overrides.gate[current.name] ??
      this._overrides.gate[_DJB2(current.name)];
    if (overridden == null) {
      return null;
    }

    return {
      ...current,
      value: overridden,
      details: { ...current.details, reason: LOCAL_OVERRIDE_REASON },
    };
  }

  overrideDynamicConfig(name: string, value: Record<string, unknown>): void {
    this._overrides.dynamicConfig[name] = value;
    this._overrides.dynamicConfig[_DJB2(name)] = value;
  }

  removeDynamicConfigOverride(name: string): void {
    delete this._overrides.dynamicConfig[name];
    delete this._overrides.dynamicConfig[_DJB2(name)];
  }

  getDynamicConfigOverride(
    current: DynamicConfig,
    _user: StatsigUser,
  ): DynamicConfig | null {
    return this._getConfigOverride(current, this._overrides.dynamicConfig);
  }

  overrideExperiment(name: string, value: Record<string, unknown>): void {
    this._overrides.experiment[name] = value;
    this._overrides.experiment[_DJB2(name)] = value;
  }

  removeExperimentOverride(name: string): void {
    delete this._overrides.experiment[name];
    delete this._overrides.experiment[_DJB2(name)];
  }

  getExperimentOverride(
    current: Experiment,
    _user: StatsigUser,
  ): Experiment | null {
    return this._getConfigOverride(current, this._overrides.experiment);
  }

  overrideLayer(name: string, value: Record<string, unknown>): void {
    this._overrides.layer[name] = value;
    this._overrides.layer[_DJB2(name)] = value;
  }

  removeLayerOverride(name: string): void {
    delete this._overrides.layer[name];
    delete this._overrides.layer[_DJB2(name)];
  }

  getAllOverrides(): OverrideStore {
    return JSON.parse(JSON.stringify(this._overrides)) as OverrideStore;
  }

  removeAllOverrides(): void {
    this._overrides = _makeEmptyStore();
  }

  getLayerOverride(current: Layer, _user: StatsigUser): Layer | null {
    const overridden =
      this._overrides.layer[current.name] ??
      this._overrides.layer[_DJB2(current.name)];
    if (overridden == null) {
      return null;
    }

    return {
      ...current,
      __value: overridden,
      get: _makeTypedGet(current.name, overridden),
      details: { ...current.details, reason: LOCAL_OVERRIDE_REASON },
    };
  }

  private _getConfigOverride<T extends Experiment | DynamicConfig>(
    current: T,
    lookup: Record<string, Record<string, unknown>>,
  ): T | null {
    const overridden = lookup[current.name] ?? lookup[_DJB2(current.name)];
    if (overridden == null) {
      return null;
    }

    return {
      ...current,
      value: overridden,
      get: _makeTypedGet(current.name, overridden),
      details: { ...current.details, reason: LOCAL_OVERRIDE_REASON },
    };
  }
}
