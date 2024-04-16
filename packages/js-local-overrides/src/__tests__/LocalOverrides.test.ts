import {
  _makeDynamicConfig,
  _makeFeatureGate,
  _makeLayer,
} from '@statsig/client-core';

import { LocalOverrideAdapter } from '../LocalOverrideAdapter';

describe('Local Overrides', () => {
  const user = { userID: 'a-user' };
  const gate = _makeFeatureGate('a_gate', { reason: '' }, null);
  const dynamicConfig = _makeDynamicConfig('a_config', { reason: '' }, null);
  const experiment = _makeDynamicConfig('an_experiment', { reason: '' }, null);
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
});
