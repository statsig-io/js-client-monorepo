import { DcsResponseString } from 'statsig-test-helpers';

import {
  ParameterStore,
  StatsigUserInternal,
  _makeDynamicConfig,
  _makeExperiment,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';

import { OnDeviceEvalAdapter } from '../OnDeviceEvalAdapter';

describe('OnDeviceEvalAdapter', () => {
  let user: StatsigUserInternal;

  beforeEach(() => {
    user = { userID: 'test_user' } as StatsigUserInternal;

    Date.now = jest.fn().mockReturnValue(1712345678);
  });

  it('does nothing when empty', () => {
    const adapter = new OnDeviceEvalAdapter(null);
    const gate = _makeFeatureGate('a_gate', { reason: '' }, null);

    expect(adapter.getGateOverride(gate, user)).toBeNull();
  });

  it('does nothing when current result is newer', () => {
    const adapter = new OnDeviceEvalAdapter(DcsResponseString);
    const gate = _makeFeatureGate(
      'a_gate',
      { reason: '', lcut: 9999999999999 },
      null,
    );

    const emptyParamStore: ParameterStore = {
      details: { reason: '', lcut: 9999999999999 },
      __configuration: {},
      name: 'a_param_store',
      get: jest.fn(),
    };

    expect(adapter.getGateOverride(gate, user)).toBeNull();
    expect(adapter.getParamStoreOverride(emptyParamStore)).toBeNull();
  });

  it('overrides gate results when current result is older', () => {
    const adapter = new OnDeviceEvalAdapter(DcsResponseString);
    const gate = _makeFeatureGate('a_gate', { reason: '', lcut: 111 }, null);

    expect(adapter.getGateOverride(gate, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
    const emptyParamStore: ParameterStore = {
      details: { reason: '', lcut: 111 },
      __configuration: {},
      name: 'a_param_store',
      get: jest.fn(),
    };
    const paramStore = adapter.getParamStoreOverride(emptyParamStore);
    expect(paramStore?.details.reason).toBe('[OnDevice]Bootstrap:Recognized');
    expect(paramStore?.config).toEqual({
      dc_string: {
        ref_type: 'dynamic_config',
        param_type: 'string',
        config_name: 'a_dynamic_config',
        param_name: 'red',
      },
    });
  });

  it('overrides gate results when current result is empty', () => {
    const adapter = new OnDeviceEvalAdapter(DcsResponseString);
    const gate = _makeFeatureGate('a_gate', { reason: '' }, null);

    expect(adapter.getGateOverride(gate, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
  });

  it('overrides gate results when data set during init', () => {
    const adapter = new OnDeviceEvalAdapter(DcsResponseString);
    const gate = _makeFeatureGate('a_gate', { reason: '' }, null);

    expect(adapter.getGateOverride(gate, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
  });

  it('overrides gate results when data set after init', () => {
    const adapter = new OnDeviceEvalAdapter(null);
    const gate = _makeFeatureGate('a_gate', { reason: '' }, null);

    adapter.setData(DcsResponseString);

    expect(adapter.getGateOverride(gate, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
  });

  it('overrides dynamic config results when data set after init', () => {
    const adapter = new OnDeviceEvalAdapter(null);
    const config = _makeDynamicConfig('a_dynamic_config', { reason: '' }, null);

    adapter.setData(DcsResponseString);

    expect(adapter.getDynamicConfigOverride(config, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
  });

  it('overrides experiment results when data set after init', () => {
    const adapter = new OnDeviceEvalAdapter(null);
    const experiment = _makeExperiment('an_experiment', { reason: '' }, null);

    adapter.setData(DcsResponseString);

    expect(
      adapter.getExperimentOverride(experiment, user)?.details.reason,
    ).toBe('[OnDevice]Bootstrap:Recognized');
  });

  it('overrides layer results when data set after init', () => {
    const adapter = new OnDeviceEvalAdapter(null);
    const layer = _makeLayer('a_layer', { reason: '' }, null);

    adapter.setData(DcsResponseString);

    expect(adapter.getLayerOverride(layer, user)?.details.reason).toBe(
      '[OnDevice]Bootstrap:Recognized',
    );
  });

  it('overrides param store results when data set after init', () => {
    const adapter = new OnDeviceEvalAdapter(null);

    adapter.setData(DcsResponseString);

    const emptyParamStore: ParameterStore = {
      details: { reason: '' },
      __configuration: {},
      name: 'a_param_store',
      get: jest.fn(),
    };

    const paramStore = adapter.getParamStoreOverride(emptyParamStore);
    expect(paramStore?.details.reason).toBe('[OnDevice]Bootstrap:Recognized');
    expect(paramStore?.config).toEqual({
      dc_string: {
        ref_type: 'dynamic_config',
        param_type: 'string',
        config_name: 'a_dynamic_config',
        param_name: 'red',
      },
    });
  });
});
