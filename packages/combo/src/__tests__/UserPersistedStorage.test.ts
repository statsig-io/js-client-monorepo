import fetchMock from 'jest-fetch-mock';
import { DcsResponseString, anyNumber } from 'statsig-test-helpers';

import {
  DownloadConfigSpecsResponse,
  StatsigGlobal,
} from '@statsig/client-core';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
import {
  UserPersistedValues,
  UserPersistentOverrideAdapter,
  UserPersistentStorage,
} from '@statsig/js-user-persisted-storage';

const DCS_RESPONSE = DcsResponseString;
const DCS_RESPONSE_INACTIVE_EXP = (() => {
  const dcsClone = JSON.parse(DcsResponseString) as DownloadConfigSpecsResponse;

  dcsClone.dynamic_configs.find((e) => {
    if (e.name !== 'an_experiment') {
      return false;
    }

    e.isActive = false;
    return true;
  });

  return JSON.stringify(dcsClone);
})();

const STORAGE_VALUES_TEST_GROUP_USER = JSON.stringify({
  'test-group-user-11:userID': {
    an_experiment: {
      group_name: 'Test',
      json_value: { a_string: 'Experiment Test Value' },
      rule_id: '49CGlTB7z97PEdqJapQplA',
      secondary_exposures: [],
      time: 1705543730484,
      value: true,
    },
  },
});

const SECONDARY_EXPOSURES = [
  {
    gate: 'partial_gate',
    gateValue: 'false',
    ruleID: '59nkHdlmIytrqNG9iT7gkd:50.00:4',
  },
  {
    gate: 'a_holdout',
    gateValue: 'false',
    ruleID: '7MfLa1sxHKhPjAKKIYIZ3D',
  },
  {
    gate: 'a_holdout',
    gateValue: 'false',
    ruleID: '7MfLa1sxHKhPjAKKIYIZ3D',
  },
];

describe('User Persisted Storage', () => {
  const useInControlGroup = { userID: 'control-group-user-3' };
  const userInTestGroup = { userID: 'test-group-user-11' };

  let storage: MockUserPersistentStorage;
  let adapter: UserPersistentOverrideAdapter;
  let client: StatsigOnDeviceEvalClient;

  let spies: {
    save: jest.SpyInstance;
    delete: jest.SpyInstance;
    load: jest.SpyInstance;
    loadAsync: jest.SpyInstance;
  };

  beforeEach(() => {
    fetchMock.enableMocks();
    __STATSIG__ = {} as StatsigGlobal;

    storage = new MockUserPersistentStorage();
    adapter = new UserPersistentOverrideAdapter(storage);

    client = new StatsigOnDeviceEvalClient('client-key', {
      overrideAdapter: adapter,
    });

    client.dataAdapter.setData(DCS_RESPONSE);
    client.initializeSync();

    spies = {
      save: jest.spyOn(storage, 'save'),
      delete: jest.spyOn(storage, 'delete'),
      load: jest.spyOn(storage, 'load'),
      loadAsync: jest.spyOn(storage, 'loadAsync'),
    };
  });

  it('saves users in the control group', () => {
    client.getExperiment('an_experiment', useInControlGroup, {
      userPersistedValues: {},
    });

    expect(storage.values['control-group-user-3:userID']).toMatchObject({
      an_experiment: {
        group_name: 'Control',
        json_value: { a_string: 'Experiment Control Value' },
        rule_id: '49CGlRW56QYlkNSNzhUM2y',
        secondary_exposures: SECONDARY_EXPOSURES,
        time: anyNumber(),
        value: true,
      },
    });
  });

  it('saves users in the test group', () => {
    client.getExperiment('an_experiment', userInTestGroup, {
      userPersistedValues: {},
    });

    expect(storage.values['test-group-user-11:userID']).toMatchObject({
      an_experiment: {
        group_name: 'Test',
        json_value: { a_string: 'Experiment Test Value' },
        rule_id: '49CGlTB7z97PEdqJapQplA',
        secondary_exposures: SECONDARY_EXPOSURES,
        time: anyNumber(),
        value: true,
      },
    });
  });

  it('does not return persisted on call that saves to storage', () => {
    const experiment = client.getExperiment('an_experiment', userInTestGroup, {
      userPersistedValues: {},
    });

    expect(experiment.details.reason).toBe('Bootstrap:Recognized');
  });

  it('returns as persisted when valid ups is provided', () => {
    storage.values = JSON.parse(STORAGE_VALUES_TEST_GROUP_USER);

    const experiment = client.getExperiment('an_experiment', userInTestGroup, {
      userPersistedValues: adapter.loadUserPersistedValues(
        userInTestGroup,
        'userID',
      ),
    });

    expect(experiment.details.reason).toBe('Persisted');
  });

  it('deletes entries when the experiment is not active', () => {
    storage.values = JSON.parse(STORAGE_VALUES_TEST_GROUP_USER);

    client.dataAdapter.setData(DCS_RESPONSE_INACTIVE_EXP);
    client.updateSync();

    client.getExperiment('an_experiment', userInTestGroup, {
      userPersistedValues: {},
    });

    expect(storage.values).toEqual({ 'test-group-user-11:userID': {} });
  });

  it('deletes entries when ups is no longer set', () => {
    storage.values = JSON.parse(STORAGE_VALUES_TEST_GROUP_USER);

    client.getExperiment('an_experiment', userInTestGroup);

    expect(storage.values).toEqual({ 'test-group-user-11:userID': {} });
  });

  it('does not call the storage adapter if ups is not set', () => {
    client.getExperiment('an_experiment', userInTestGroup);

    // call load to see if we need to delete
    expect(spies.load).toHaveBeenCalled();

    // does not call
    expect(spies.delete).not.toHaveBeenCalled();
    expect(spies.save).not.toHaveBeenCalled();
    expect(spies.loadAsync).not.toHaveBeenCalled();
  });

  it('returns latest values for loadUserPersistedValues', () => {
    storage.values = JSON.parse(STORAGE_VALUES_TEST_GROUP_USER);

    const latest = adapter.loadUserPersistedValues(userInTestGroup, 'userID');
    expect(latest).toMatchObject({
      an_experiment: {
        group_name: 'Test',
        json_value: { a_string: 'Experiment Test Value' },
        rule_id: '49CGlTB7z97PEdqJapQplA',
        secondary_exposures: [],
        time: anyNumber(),
        value: true,
      },
    });
  });

  it('returns latest values for loadUserPersistedValuesAsync', async () => {
    storage.values = JSON.parse(STORAGE_VALUES_TEST_GROUP_USER);

    const latest = await adapter.loadUserPersistedValuesAsync(
      userInTestGroup,
      'userID',
    );

    expect(latest).toMatchObject({
      an_experiment: {
        group_name: 'Test',
        json_value: { a_string: 'Experiment Test Value' },
        rule_id: '49CGlTB7z97PEdqJapQplA',
        secondary_exposures: [],
        time: anyNumber(),
        value: true,
      },
    });
  });

  it('returns an empty object for loadUserPersistedValues', () => {
    const latest = adapter.loadUserPersistedValues(userInTestGroup, 'userID');
    expect(latest).toEqual({});
  });

  it('returns an empty object for loadUserPersistedValuesAsync', async () => {
    const latest = await adapter.loadUserPersistedValuesAsync(
      userInTestGroup,
      'userID',
    );

    expect(latest).toEqual({});
  });
});

class MockUserPersistentStorage implements UserPersistentStorage {
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
