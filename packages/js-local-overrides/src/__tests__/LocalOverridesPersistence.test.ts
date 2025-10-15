import {
  ParameterStore,
  Storage,
  _getStorageKey,
  _makeFeatureGate,
  _makeTypedGet,
} from '@statsig/client-core';

import { LocalOverrideAdapter } from '../LocalOverrideAdapter';
import { MockStorageProvider } from './MockStorageProvider';

const SDK_KEY = 'test_sdk_key';
const STORAGE_KEY = `statsig.local-overrides.${_getStorageKey(SDK_KEY)}`;

describe('Local Overrides Storage', () => {
  const user = { userID: 'a-user' };
  const gate = _makeFeatureGate('a_gate', { reason: '' }, null);
  const paramStore: ParameterStore = {
    name: 'a_param_store',
    details: { reason: '' },
    get: _makeTypedGet('a_param_store', {}),
    __configuration: null,
  };

  let mockStorage: MockStorageProvider;

  beforeEach(() => {
    mockStorage = new MockStorageProvider();
    mockStorage.reset();
    Storage._setProvider(mockStorage);
  });

  it('writes overrides to storage when SDK key is set', async () => {
    const provider = new LocalOverrideAdapter(SDK_KEY);

    provider.overrideGate('a_gate', true);

    expect(mockStorage.data[STORAGE_KEY]).toBeDefined();
  });

  it('does not write overrides to storage when SDK key is null', async () => {
    const provider = new LocalOverrideAdapter();

    provider.overrideGate('a_gate', true);
    expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
  });

  it('loads overrides from storage when SDK key is set', async () => {
    mockStorage.data[STORAGE_KEY] = JSON.stringify({
      gate: { '2867927529': true, a_gate: true },
      dynamicConfig: {},
      experiment: {},
      layer: {},
    });

    const provider = new LocalOverrideAdapter(SDK_KEY);
    await provider.loadFromStorage();

    const result = provider.getGateOverride(gate, user);
    expect(result?.value).toBe(true);
  });

  it('does not load overrides from storage when SDK key is null', async () => {
    mockStorage.data[STORAGE_KEY] = JSON.stringify({
      gate: { '2867927529': true, a_gate: true },
      dynamicConfig: {},
      experiment: {},
      layer: {},
      paramStore: {},
    });

    const adapter = new LocalOverrideAdapter();
    await adapter.loadFromStorage();

    const result = adapter.getGateOverride(gate, user);
    expect(result).toBeNull();
  });

  it('loads param store overrides from storage', async () => {
    mockStorage.data[STORAGE_KEY] = JSON.stringify({
      gate: {},
      dynamicConfig: {},
      experiment: {},
      layer: {},
      paramStore: {
        '2146298833': { key: 'value' },
        a_param_store: { key: 'value' },
      },
    });

    const provider = new LocalOverrideAdapter(SDK_KEY);
    await provider.loadFromStorage();

    const result = provider.getParamStoreOverride(paramStore);
    expect(result?.config).toEqual({
      key: {
        ref_type: 'static',
        param_type: 'string',
        value: 'value',
      },
    });
  });
});
