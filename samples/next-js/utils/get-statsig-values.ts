import Statsig, { StatsigUser } from 'statsig-node';

import { EvaluationResponse } from '@sigstat/precomputed-evaluations';

const isStatsigReady = Statsig.initialize(
  'secret-IiDuNzovZ5z9x75BEjyZ4Y2evYa94CJ9zNtDViKBVdv',
);

export async function getStatsigValues(
  user: StatsigUser,
): Promise<EvaluationResponse> {
  await isStatsigReady;

  const values = Statsig.getClientInitializeResponse(user);
  return { ...values, ...HACK } as EvaluationResponse;
}

// NodeJS needs to support DJB2 before this will work
const HACK = {
  feature_gates: {
    '610600137': {
      name: '610600137',
      value: true,
      rule_id: '59nkHdlmIytrqNG9iT7gkd',
      id_type: 'userID',
      secondary_exposures: [],
    },
    '2867927529': {
      name: '2867927529',
      value: true,
      rule_id: '2QWhVkWdUEXR6Q3KYgV73O',
      id_type: 'userID',
      secondary_exposures: [],
    },
  },
  dynamic_configs: {
    '3495537376': {
      name: '3495537376',
      value: {
        red: '#FF0000',
        blue: '#00FF00',
        green: '#0000FF',
      },
      rule_id: 'default',
      group: 'default',
      is_device_based: false,
      id_type: 'userID',
      secondary_exposures: [],
    },
    '3921852239': {
      name: '3921852239',
      value: {
        a_string: 'Experiment Control Value',
      },
      rule_id: '49CGlRW56QYlkNSNzhUM2y',
      group: '49CGlRW56QYlkNSNzhUM2y',
      is_device_based: false,
      id_type: 'userID',
      is_experiment_active: true,
      is_user_in_experiment: true,
      is_in_layer: true,
      explicit_parameters: ['a_string'],
      secondary_exposures: [],
    },
  },
  layer_configs: {
    '3011030003': {
      name: '3011030003',
      value: {
        a_string: 'Experiment Control Value',
      },
      rule_id: '49CGlRW56QYlkNSNzhUM2y',
      group: '49CGlRW56QYlkNSNzhUM2y',
      allocated_experiment_name: '3921852239',
      is_device_based: false,
      is_experiment_active: true,
      explicit_parameters: ['a_string'],
      is_user_in_experiment: true,
      secondary_exposures: [],
      undelegated_secondary_exposures: [],
    },
  },
  sdkParams: {},
  has_updates: true,
  generator: 'scrapi-nest',
  time: 1696487434764,
  company_lcut: 1696487434764,
  evaluated_keys: {
    userID: 'a-ser',
  },
  hash_used: 'djb2',
  derived_fields: {
    user_agent: 'PostmanRuntime/7.33.0',
    ip: '67.170.122.92',
    country: 'US',
  },
};
