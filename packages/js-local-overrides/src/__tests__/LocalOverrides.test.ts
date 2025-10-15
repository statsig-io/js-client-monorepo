import {
  ParameterStore,
  Storage,
  _DJB2,
  _getStorageKey,
  _makeDynamicConfig,
  _makeExperiment,
  _makeFeatureGate,
  _makeLayer,
  _makeTypedGet,
} from '@statsig/client-core';

import { LocalOverrideAdapter } from '../LocalOverrideAdapter';
import { MockStorageProvider } from './MockStorageProvider';

describe('Local Overrides', () => {
  const user = { userID: 'a-user' };
  const gate = _makeFeatureGate('a_gate', { reason: '' }, null);
  const dynamicConfig = _makeDynamicConfig('a_config', { reason: '' }, null);
  const experiment = _makeExperiment('an_experiment', { reason: '' }, null);
  const layer = _makeLayer('a_layer', { reason: '' }, null);
  const paramStore: ParameterStore = {
    name: 'a_param_store',
    details: { reason: '' },
    get: _makeTypedGet('a_param_store', {}),
    __configuration: null,
  };

  let provider: LocalOverrideAdapter;

  beforeAll(async () => {
    provider = new LocalOverrideAdapter();
    await provider.loadFromStorage();
  });

  it('returns overidden gates', () => {
    provider.overrideGate(gate.name, true);
    const overridden = provider.getGateOverride(gate, user);
    expect(overridden?.value).toBe(true);
  });

  it('returns overidden dynamic configs', () => {
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    const overridden = provider.getDynamicConfigOverride(dynamicConfig, user);
    expect(overridden?.value).toEqual({ dc: 'value' });
    expect(overridden?.get('dc')).toEqual('value');
    expect(overridden?.details.reason).toBe('LocalOverride:Recognized');
  });

  it('returns overidden experiment', () => {
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    const overridden = provider.getExperimentOverride(experiment, user);
    expect(overridden?.value).toEqual({ exp: 'value' });
    expect(overridden?.get('exp')).toEqual('value');
    expect(overridden?.details.reason).toBe('LocalOverride:Recognized');
  });

  it('returns overidden layer', () => {
    provider.overrideLayer(layer.name, { layer_key: 'value' });
    const overridden = provider.getLayerOverride(layer, user);
    expect(overridden?.__value).toEqual({ layer_key: 'value' });
    expect(overridden?.get('layer_key')).toEqual('value');
    expect(overridden?.details.reason).toBe('LocalOverride:Recognized');
  });

  it('returns overidden param store', () => {
    provider.overrideParamStore(paramStore.name, {
      a_string: 'override',
      a_number: 42,
      a_bool: true,
    });
    const overridden = provider.getParamStoreOverride(paramStore);
    expect(overridden?.config).toEqual({
      a_string: {
        ref_type: 'static',
        param_type: 'string',
        value: 'override',
      },
      a_number: {
        ref_type: 'static',
        param_type: 'number',
        value: 42,
      },
      a_bool: {
        ref_type: 'static',
        param_type: 'boolean',
        value: true,
      },
    });
    expect(overridden?.details.reason).toBe('LocalOverride:Recognized');
  });

  it('returns null for unrecognized overrides', () => {
    provider.removeAllOverrides();

    const overriddenGate = provider.getGateOverride(gate, user);

    const overriddenDynamicConfig = provider.getDynamicConfigOverride(
      dynamicConfig,
      user,
    );

    const overriddenExperiment = provider.getExperimentOverride(
      experiment,
      user,
    );

    const overriddenLayer = provider.getLayerOverride(layer, user);

    const overriddenParamStore = provider.getParamStoreOverride(paramStore);

    expect(overriddenGate).toBeNull();
    expect(overriddenDynamicConfig).toBeNull();
    expect(overriddenExperiment).toBeNull();
    expect(overriddenLayer).toBeNull();
    expect(overriddenParamStore).toBeNull();
  });

  it('returns all overrides', () => {
    provider.overrideGate(gate.name, true);
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    provider.overrideLayer(layer.name, { layer_key: 'value' });
    provider.overrideParamStore(paramStore.name, { param: 'value' });

    expect(provider.getAllOverrides()).toEqual({
      dynamicConfig: {
        a_config: { dc: 'value' },
        '2902556896': {
          dc: 'value',
        },
      },
      experiment: {
        an_experiment: { exp: 'value' },
        '3921852239': { exp: 'value' },
      },
      gate: { a_gate: true, '2867927529': true },
      layer: {
        a_layer: { layer_key: 'value' },
        '3011030003': { layer_key: 'value' },
      },
      paramStore: {
        a_param_store: { param: 'value' },
        '2146298833': { param: 'value' },
      },
    });
  });

  it('returns removes all overrides', () => {
    provider.overrideGate(gate.name, true);
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    provider.overrideLayer(layer.name, { layer_key: 'value' });
    provider.overrideParamStore(paramStore.name, { param: 'value' });

    provider.removeAllOverrides();

    expect(provider.getAllOverrides()).toEqual({
      dynamicConfig: {},
      experiment: {},
      gate: {},
      layer: {},
      paramStore: {},
    });
  });

  it('removes single gate overrides', () => {
    provider.overrideGate('gate_a', true);
    provider.overrideGate('gate_b', true);

    provider.removeGateOverride('gate_a');

    expect(provider.getAllOverrides().gate).toEqual({
      gate_b: true,
      [_DJB2('gate_b')]: true,
    });
  });

  it('removes single dynamic config overrides', () => {
    provider.overrideDynamicConfig('config_a', { a: 1 });
    provider.overrideDynamicConfig('config_b', { b: 2 });

    provider.removeDynamicConfigOverride('config_a');

    expect(provider.getAllOverrides().dynamicConfig).toEqual({
      config_b: { b: 2 },
      [_DJB2('config_b')]: { b: 2 },
    });
  });

  it('removes single experiment overrides', () => {
    provider.overrideExperiment('experiment_a', { a: 1 });
    provider.overrideExperiment('experiment_b', { b: 2 });

    provider.removeExperimentOverride('experiment_a');

    expect(provider.getAllOverrides().experiment).toEqual({
      experiment_b: { b: 2 },
      [_DJB2('experiment_b')]: { b: 2 },
    });
  });

  it('removes single layer overrides', () => {
    provider.overrideLayer('layer_a', { a: 1 });
    provider.overrideLayer('layer_b', { b: 2 });

    provider.removeLayerOverride('layer_a');

    expect(provider.getAllOverrides().layer).toEqual({
      layer_b: { b: 2 },
      [_DJB2('layer_b')]: { b: 2 },
    });
  });

  it('removes single param store overrides', () => {
    provider.overrideParamStore('store_a', { a: 1 });
    provider.overrideParamStore('store_b', { b: 2 });

    provider.removeParamStoreOverride('store_a');

    expect(provider.getAllOverrides().paramStore).toEqual({
      store_b: { b: 2 },
      [_DJB2('store_b')]: { b: 2 },
    });
  });
});

describe('Local Overrides with Async Storage', () => {
  const SDK_KEY = 'test-sdk-key';
  const user = { userID: 'a-user' };
  const gate = _makeFeatureGate('a_gate', { reason: '' }, null);

  it('handles storage that is provided immediately', async () => {
    const mockStorage = new MockStorageProvider(true);
    Storage._setProvider(mockStorage);
    mockStorage.setItem = jest.fn(mockStorage.setItem);
    // Create adapter and provide storage
    const adapter = new LocalOverrideAdapter(SDK_KEY);
    await adapter.loadFromStorage();

    // Override a gate
    adapter.overrideGate('a_gate', true);

    // Verify the override was saved to storage
    const storageKey = `statsig.local-overrides.${_getStorageKey(SDK_KEY)}`;
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      expect.any(String),
    );

    // Verify the override works
    const result = adapter.getGateOverride(gate, user);
    expect(result?.value).toBe(true);
  });

  it('handles storage that becomes ready later', async () => {
    // Storage starts as not ready
    const mockStorage = new MockStorageProvider(false);
    Storage._setProvider(mockStorage);
    mockStorage.setItem = jest.fn(mockStorage.setItem);

    // Create adapter
    const adapter = new LocalOverrideAdapter(SDK_KEY);

    // Override a gate before storage is ready
    adapter.overrideGate('a_gate', true);

    // Storage is not ready yet, so the override should be saved in memory
    expect(mockStorage.setItem).not.toHaveBeenCalled();

    // Make storage ready and provide it
    mockStorage.setReady(true);
    await adapter.loadFromStorage();

    // Verify override was persisted to storage
    const storageKey = `statsig.local-overrides.${_getStorageKey(SDK_KEY)}`;
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      expect.any(String),
    );

    // Create a new adapter to verify persistence
    const newAdapter = new LocalOverrideAdapter(SDK_KEY);
    await newAdapter.loadFromStorage();

    // Verify the override was loaded from storage
    const result = newAdapter.getGateOverride(gate, user);
    expect(result?.value).toBe(true);
  });
});
