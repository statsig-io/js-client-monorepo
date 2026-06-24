import { Experiment, Layer, StatsigUser } from '@statsig/client-core';
import {
  UserPersistedValues,
  UserPersistentOverrideAdapter,
  UserPersistentStorage,
} from '@statsig/js-user-persisted-storage';

// Regression test for S2SDK-67: the persistent storage adapter must save the
// human-readable `group_name` into StickyValues.group_name, NOT `evaluation.group`.
//
// On the precomputed JS client, `evaluation.group` is decoded from the wire field
// `e.r` (the rule ID), so `group === rule_id`. Writing it into `group_name`
// persisted the hash instead of the readable variant name. These tests construct
// an evaluation where `group !== group_name` (as the real client produces) and
// assert the saved blob keeps the readable name.

class MockStorage implements UserPersistentStorage {
  values: Record<string, UserPersistedValues> = {};
  delete(key: string, experiment: string): void {
    delete this.values[key][experiment];
  }
  load(key: string): UserPersistedValues {
    return this.values[key];
  }
  save(key: string, experiment: string, data: string): void {
    const found = this.values[key] ?? {};
    found[experiment] = JSON.parse(data);
    this.values[key] = found;
  }
  loadAsync(key: string): Promise<UserPersistedValues> {
    return Promise.resolve(this.load(key));
  }
}

const RULE_ID = '4BiyG7rsHnbHMHHuRbPl9s'; // the opaque hash (evaluation.group === rule_id)
const GROUP_NAME = 'Control'; // the human-readable variant name

describe('UserPersistentOverrideAdapter group_name persistence (S2SDK-67)', () => {
  let storage: MockStorage;
  let adapter: UserPersistentOverrideAdapter;
  const user: StatsigUser = { userID: 'user-123' };

  beforeEach(() => {
    storage = new MockStorage();
    adapter = new UserPersistentOverrideAdapter(storage);
  });

  it('saves the readable group_name for experiments, not the rule ID', () => {
    const experiment = {
      name: 'an_experiment',
      details: { reason: 'Network:Recognized', lcut: 1705543730484 },
      __evaluation: {
        name: 'an_experiment',
        id_type: 'userID',
        rule_id: RULE_ID,
        group: RULE_ID, // precomputed client: group == rule_id
        group_name: GROUP_NAME,
        value: { a_string: 'Experiment Control Value' },
        secondary_exposures: [],
        is_device_based: false,
        is_experiment_active: true,
        is_user_in_experiment: true,
      },
    } as unknown as Experiment;

    adapter.getExperimentOverride(experiment, user, {
      userPersistedValues: {},
    });

    const persisted = storage.values['user-123:userID']['an_experiment'];
    expect(persisted.group_name).toBe(GROUP_NAME);
    expect(persisted.group_name).not.toBe(RULE_ID);
    expect(persisted.rule_id).toBe(RULE_ID);
  });

  it('saves the readable group_name for layers, not the rule ID', () => {
    const layer = {
      name: 'a_layer',
      details: { reason: 'Network:Recognized', lcut: 1705543730484 },
      __evaluation: {
        name: 'a_layer',
        id_type: 'userID',
        rule_id: RULE_ID,
        group: RULE_ID, // precomputed client: group == rule_id
        group_name: GROUP_NAME,
        value: { layer_param: 'persisted_value' },
        secondary_exposures: [],
        undelegated_secondary_exposures: [],
        explicit_parameters: [],
        allocated_experiment_name: 'an_experiment',
        is_device_based: false,
        is_experiment_active: true,
        is_user_in_experiment: true,
      },
    } as unknown as Layer;

    adapter.getLayerOverride(layer, user, { userPersistedValues: {} });

    const persisted = storage.values['user-123:userID']['a_layer'];
    expect(persisted.group_name).toBe(GROUP_NAME);
    expect(persisted.group_name).not.toBe(RULE_ID);
    expect(persisted.rule_id).toBe(RULE_ID);
  });
});
