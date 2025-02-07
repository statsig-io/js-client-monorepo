import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  OverrideAdapter,
  StatsigUser,
  Storage,
  _DJB2,
  _getStorageKey,
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
  private _sdkKey: string | null;

  constructor(sdkKey?: string) {
    this._sdkKey = sdkKey ?? null;
    this._overrides = this._loadOverridesFromStorage();
  }

  private _getLocalOverridesStorageKey(sdkKey: string): string {
    return `statsig.local-overrides.${_getStorageKey(sdkKey)}`;
  }

  private _loadOverridesFromStorage(): OverrideStore {
    if (this._sdkKey == null) {
      return _makeEmptyStore();
    }

    const storageKey = this._getLocalOverridesStorageKey(this._sdkKey);
    const storedOverrides = Storage.getItem(storageKey);
    return storedOverrides ? JSON.parse(storedOverrides) : _makeEmptyStore();
  }

  private _saveOverridesToStorage(): void {
    if (this._sdkKey == null) {
      return;
    }

    const storageKey = this._getLocalOverridesStorageKey(this._sdkKey);
    Storage.setItem(storageKey, JSON.stringify(this._overrides));
  }

  overrideGate(name: string, value: boolean): void {
    this._overrides.gate[name] = value;
    this._overrides.gate[_DJB2(name)] = value;
    this._saveOverridesToStorage();
  }

  removeGateOverride(name: string): void {
    delete this._overrides.gate[name];
    delete this._overrides.gate[_DJB2(name)];
    this._saveOverridesToStorage();
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
    this._saveOverridesToStorage();
  }

  removeDynamicConfigOverride(name: string): void {
    delete this._overrides.dynamicConfig[name];
    delete this._overrides.dynamicConfig[_DJB2(name)];
    this._saveOverridesToStorage();
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
    this._saveOverridesToStorage();
  }

  removeExperimentOverride(name: string): void {
    delete this._overrides.experiment[name];
    delete this._overrides.experiment[_DJB2(name)];
    this._saveOverridesToStorage();
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
    this._saveOverridesToStorage();
  }

  removeLayerOverride(name: string): void {
    delete this._overrides.layer[name];
    delete this._overrides.layer[_DJB2(name)];
    this._saveOverridesToStorage();
  }

  getAllOverrides(): OverrideStore {
    return JSON.parse(JSON.stringify(this._overrides)) as OverrideStore;
  }

  removeAllOverrides(): void {
    this._overrides = _makeEmptyStore();
    this._saveOverridesToStorage();
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
