import {
  _makeDynamicConfig,
  _makeExperiment,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';

import { LocalOverrideAdapter } from '../LocalOverrideAdapter';

describe('Local Overrides', () => {
  const user = { userID: 'a-user' };
  const gate = _makeFeatureGate('a_gate', { reason: '' }, null);
  const dynamicConfig = _makeDynamicConfig('a_config', { reason: '' }, null);
  const experiment = _makeExperiment('an_experiment', { reason: '' }, null);
  const layer = _makeLayer('a_layer', { reason: '' }, null);

  let provider: LocalOverrideAdapter;

  beforeAll(() => {
    provider = new LocalOverrideAdapter();
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
  });

  it('returns overidden experiment', () => {
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    const overridden = provider.getExperimentOverride(experiment, user);
    expect(overridden?.value).toEqual({ exp: 'value' });
  });

  it('returns overidden layer', () => {
    provider.overrideLayer(layer.name, { layer_key: 'value' });
    const overridden = provider.getLayerOverride(layer, user);
    expect(overridden?.__value).toEqual({ layer_key: 'value' });
  });

  it('returns all overrides', () => {
    provider.overrideGate(gate.name, true);
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    provider.overrideLayer(layer.name, { layer_key: 'value' });

    expect(provider.getAllOverrides()).toEqual({
      dynamicConfig: { a_config: { dc: 'value' } },
      experiment: { an_experiment: { exp: 'value' } },
      gate: { a_gate: true },
      layer: { a_layer: { layer_key: 'value' } },
    });
  });

  it('returns removes all overrides', () => {
    provider.overrideGate(gate.name, true);
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    provider.overrideLayer(layer.name, { layer_key: 'value' });

    provider.removeAllOverrides();

    expect(provider.getAllOverrides()).toEqual({
      dynamicConfig: {},
      experiment: {},
      gate: {},
      layer: {},
    });
  });
  it('returns removes single override', () => {
    const gateB = _makeFeatureGate('b_gate', { reason: '' }, null);
    const dynamicConfigB = _makeDynamicConfig('b_config', { reason: '' }, null);
    const experimentB = _makeExperiment('b_experiment', { reason: '' }, null);
    const layerB = _makeLayer('b_layer', { reason: '' }, null);

    provider.overrideGate(gate.name, true);
    provider.overrideDynamicConfig(dynamicConfig.name, { dc: 'value' });
    provider.overrideExperiment(experiment.name, { exp: 'value' });
    provider.overrideLayer(layer.name, { layer_key: 'value' });

    provider.overrideGate(gateB.name, true);
    provider.overrideDynamicConfig(dynamicConfigB.name, { dc: 'value' });
    provider.overrideExperiment(experimentB.name, { exp: 'value' });
    provider.overrideLayer(layerB.name, { layer_key: 'value' });

    provider.removeGateOverride(gate.name);
    provider.removeDynamicConfigOverride(dynamicConfig.name);
    provider.removeExperimentOverride(experiment.name);
    provider.removeLayerOverride(layer.name);

    expect(provider.getAllOverrides()).toEqual({
      dynamicConfig: {
        b_config: {
          dc: 'value',
        },
      },
      experiment: {
        b_experiment: {
          exp: 'value',
        },
      },
      gate: {
        b_gate: true,
      },
      layer: {
        b_layer: {
          layer_key: 'value',
        },
      },
    });
  });
});
