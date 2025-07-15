import { _createLayerParameterExposure } from '../StatsigEvent';
import { _makeLayer } from '../StatsigTypeFactories';
import { StatsigUserInternal } from '../StatsigUser';

describe('Layer With No Secondary Exposures', () => {
  const evaluation = {
    value: { test_param: 'test_value' },
    rule_id: '',
    undelegated_secondary_exposures: [],
    explicit_parameters: ['test_param'],
    name: '',
    group: '',
    is_device_based: false,
    allocated_experiment_name: '',
  };

  const user: StatsigUserInternal = {
    userID: 'test_user',
    custom: {},
    customIDs: {},
    statsigEnvironment: {
      tier: 'test_tier',
    },
  };

  const config = _makeLayer('test_layer', {} as any, evaluation as any, () => {
    return;
  });

  it('Gets an event and does not throw', () => {
    const val = _createLayerParameterExposure(user, config, 'test_param');
    expect(val).toBeDefined();
    expect(val.eventName).toBe('statsig::layer_exposure');
  });
});
