import 'jest-fetch-mock';
import {
  InitResponseStableID,
  MockLocalStorage,
  anyObject,
  anyStringContaining,
} from 'statsig-test-helpers';

import { StableID } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

describe('Stable ID Disabled Tests', () => {
  let storage: MockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    storage = MockLocalStorage.enabledMockStorage();
  });

  afterEach(() => {
    fetchMock.mockClear();
    storage.clear();
  });

  describe('When disableStableID is set to true', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      const client = new StatsigClient(
        'client-key',
        {
          userID: 'test-user',
          customIDs: {},
        },
        {
          disableStableID: true,
          disableStatsigEncoding: true,
        },
      );

      await client.initializeAsync();
      client.logEvent('my_event');

      await client.shutdown();
    });

    it('includes null stableID on /rgstr requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );

      const [, r] = fetchMock.mock.calls[1];
      const body = JSON.parse(String(r?.body));
      expect(body).toMatchObject({
        statsigMetadata: { stableID: null },
      });
    });

    it('returns null when calling StableID.get()', () => {
      expect(StableID.get('client-key')).toBeNull();
    });
  });

  describe('When bootstrapping with a user without stableID and disableStableID is set', () => {
    let client: StatsigClient;

    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      const bootstrapValues = JSON.stringify({
        dynamic_configs: {},
        evaluated_keys: { userID: 'a-user' },
        feature_gates: {
          '1745069421': {
            id_type: 'userID',
            name: '1745069421',
            rule_id: 'default',
            secondary_exposures: [],
            value: false,
          },
        },
        has_updates: true,
        hash_used: 'djb2',
        layer_configs: {},
        param_stores: {},
        sdkInfo: {
          sdkType: 'statsig-server-core-node',
          sdkVersion: '0.0.6-beta.2',
        },
        sdkParams: {},
        time: 1743809566095,
        user: {
          statsigEnvironment: { tier: 'production' },
          userID: 'a-user',
        },
      });

      client = new StatsigClient(
        'client-key',
        {
          userID: 'a-user',
        },
        {
          environment: {
            tier: 'production',
          },
          disableStableID: true,
          disableStatsigEncoding: true,
        },
      );

      client.dataAdapter.setData(bootstrapValues);

      client.initializeSync();
    });

    afterAll(async () => {
      await client.shutdown();
    });

    it('has EvaluationReason of Network:Recognized, not BootstrapStableIDMismatch', () => {
      const gate = client.getFeatureGate('my_first_gate');
      expect(gate.details.reason).toBe('Bootstrap:Recognized');
      expect(gate.details.reason).not.toBe(
        'BootstrapStableIDMismatch:Recognized',
      );
    });
  });

  describe('When bootstrapping with stableID and disableStableID is set', () => {
    let client: StatsigClient;

    beforeAll(() => {
      fetchMock.mockClear();
      storage.clear();

      client = new StatsigClient(
        'client-key',
        {
          userID: 'a-user',
        },
        {
          disableStableID: true,
          disableStatsigEncoding: true,
        },
      );

      client.dataAdapter.setDataLegacy(
        JSON.stringify({ ...InitResponseStableID, time: 1743809566095 }),
        { userID: 'a-user' },
      );

      client.initializeSync();
    });

    afterAll(async () => {
      await client.shutdown();
    });

    it('does not treat stableID as a bootstrap mismatch', () => {
      const gate = client.getFeatureGate('610600137');
      expect(gate.details.reason).toBe('Bootstrap:Recognized');
      expect(gate.details.reason).not.toBe(
        'BootstrapPartialUserMatch:Recognized',
      );
    });
  });
});
