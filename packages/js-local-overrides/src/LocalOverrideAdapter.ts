import {
  DynamicConfig,
  EvaluationDetails,
  Experiment,
  FeatureGate,
  Layer,
  Log,
  OverrideAdapter,
  ParamStoreConfig,
  ParameterStore,
  StaticParam,
  StatsigUser,
  Storage,
  _DJB2,
  _getStorageKey,
  _makeTypedGet,
  _typedJsonParse,
} from '@statsig/client-core';

const LOCAL_OVERRIDE_REASON = 'LocalOverride:Recognized';

export type OverrideStore = {
  gate: Record<string, boolean>;
  dynamicConfig: Record<string, Record<string, unknown>>;
  experiment: OverrideStore['dynamicConfig'];
  layer: OverrideStore['dynamicConfig'];
  paramStore: Record<string, Record<string, unknown>>;
};

function _makeEmptyStore(): OverrideStore {
  return {
    gate: {},
    dynamicConfig: {},
    experiment: {},
    layer: {},
    paramStore: {},
  };
}

function _mergeOverrides(
  currentValues: OverrideStore,
  newValues: OverrideStore,
): OverrideStore {
  return {
    gate: Object.assign({}, currentValues.gate, newValues.gate),
    dynamicConfig: Object.assign(
      {},
      currentValues.dynamicConfig,
      newValues.dynamicConfig,
    ),
    experiment: Object.assign(
      {},
      currentValues.experiment,
      newValues.experiment,
    ),
    layer: Object.assign({}, currentValues.layer, newValues.layer),
    paramStore: Object.assign(
      {},
      currentValues.paramStore,
      newValues.paramStore,
    ),
  };
}

export class LocalOverrideAdapter implements OverrideAdapter {
  private _overrides = _makeEmptyStore();
  private _sdkKey: string | null;

  constructor(sdkKey?: string) {
    this._sdkKey = sdkKey ?? null;
  }

  private _getLocalOverridesStorageKey(sdkKey: string): string {
    return `statsig.local-overrides.${_getStorageKey(sdkKey)}`;
  }

  async loadFromStorage(): Promise<void> {
    if (this._sdkKey == null) {
      return;
    }

    if (!Storage.isReady()) {
      await Storage.isReadyResolver();
    }

    const storageKey = this._getLocalOverridesStorageKey(this._sdkKey);
    const storedOverrides = Storage.getItem(storageKey);
    const overrides = storedOverrides
      ? _typedJsonParse<OverrideStore>(
          storedOverrides,
          'gate',
          'LocalOverrideAdapter overrides',
        )
      : null;

    const hasInMemoryOverrides = this._hasInMemoryOverrides();

    if (overrides) {
      // Merge overrides in memory with stored overrides.
      // WARN: This is a union of overrides. Trying to remove an override
      // before storage is ready won't remove the override in storage.
      this._overrides = hasInMemoryOverrides
        ? _mergeOverrides(overrides, this._overrides)
        : overrides;
    }

    if (hasInMemoryOverrides) {
      this._saveOverridesToStorage();
    }
  }

  private _saveOverridesToStorage(): void {
    if (this._sdkKey == null || !Storage.isReady()) {
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

  private _warnIfStorageNotReady(): void {
    if (!Storage.isReady()) {
      Log.warn('Storage is not ready. Override removal may not persist.');
    }
  }

  removeGateOverride(name: string): void {
    this._warnIfStorageNotReady();
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
    this._warnIfStorageNotReady();
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
    this._warnIfStorageNotReady();
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
    this._warnIfStorageNotReady();
    delete this._overrides.layer[name];
    delete this._overrides.layer[_DJB2(name)];
    this._saveOverridesToStorage();
  }

  overrideParamStore(name: string, value: Record<string, unknown>): void {
    this._overrides.paramStore[name] = value;
    this._overrides.paramStore[_DJB2(name)] = value;
    this._saveOverridesToStorage();
  }

  removeParamStoreOverride(name: string): void {
    this._warnIfStorageNotReady();
    delete this._overrides.paramStore[name];
    delete this._overrides.paramStore[_DJB2(name)];
    this._saveOverridesToStorage();
  }

  getParamStoreOverride(
    current: ParameterStore,
  ): { config: ParamStoreConfig; details: EvaluationDetails } | null {
    const overridden =
      this._overrides.paramStore[current.name] ??
      this._overrides.paramStore[_DJB2(current.name)];
    if (overridden == null) {
      return null;
    }

    const config: ParamStoreConfig = { ...(current.__configuration || {}) };
    for (const [key, value] of Object.entries(overridden)) {
      const paramType = this._inferParamType(value);
      config[key] = {
        ref_type: 'static',
        param_type: paramType,
        value,
      } as StaticParam;
    }

    return {
      config,
      details: { ...current.details, reason: LOCAL_OVERRIDE_REASON },
    };
  }

  getAllOverrides(): OverrideStore {
    return JSON.parse(JSON.stringify(this._overrides)) as OverrideStore;
  }

  removeAllOverrides(): void {
    this._warnIfStorageNotReady();
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

  private _hasInMemoryOverrides() {
    return (
      Object.keys(this._overrides.gate).length > 0 ||
      Object.keys(this._overrides.dynamicConfig).length > 0 ||
      Object.keys(this._overrides.experiment).length > 0 ||
      Object.keys(this._overrides.layer).length > 0 ||
      Object.keys(this._overrides.paramStore).length > 0
    );
  }

  private _inferParamType(
    value: unknown,
  ): 'string' | 'boolean' | 'number' | 'array' | 'object' {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    return 'object';
  }
}
