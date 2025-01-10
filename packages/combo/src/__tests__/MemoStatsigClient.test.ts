import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import {
  AnyStatsigType,
  ParameterStore,
  StatsigClient,
} from '@statsig/js-client';

describe('Memoization - StatsigClient', () => {
  let client: StatsigClient;
  let storeSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);
  });

  beforeEach(async () => {
    fetchMock.mock.calls = [];

    client = new StatsigClient('client-key', { userID: 'initial_user' });
    await client.initializeAsync();

    storeSpy = jest.spyOn((client as any)._store, '_getDetailedStoreResult');
  });

  function runAction(
    method: string,
    name: string,
    options?: any,
  ): AnyStatsigType {
    switch (method) {
      case 'getFeatureGate':
        return client.getFeatureGate(name, options);
      case 'getDynamicConfig':
        return client.getDynamicConfig(name, options);
      case 'getExperiment':
        return client.getExperiment(name, options);
      case 'getLayer': {
        const layer = client.getLayer(name, options);
        layer.get('a_string');
        return layer;
      }
      case 'getParameterStore':
        return client.getParameterStore(name, options);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  describe.each([
    ['getFeatureGate', 'a_gate'],
    ['getDynamicConfig', 'a_dynamic_config'],
    ['getExperiment', 'an_experiment'],
    ['getLayer', 'a_layer'],
    ['getParameterStore', 'a_param_store'],
  ])('Memoization - %s', (method, name) => {
    it('returns memoized values', () => {
      runAction(method, name);
      runAction(method, name);

      expect(storeSpy).toHaveBeenCalledTimes(1);
    });

    it('returns memoized values when options is undefined or empty', () => {
      runAction(method, name);
      runAction(method, name, {});

      expect(storeSpy).toHaveBeenCalledTimes(1);
    });

    it('returns memoized values when options are the same', () => {
      runAction(method, name, {
        disableExposureLog: false,
      });
      runAction(method, name, {
        disableExposureLog: false,
      });

      expect(storeSpy).toHaveBeenCalledTimes(1);
    });

    it('does not memoize when name changes', () => {
      runAction(method, name);
      runAction(method, 'another_name');

      expect(storeSpy).toHaveBeenCalledTimes(2);
    });

    it('breaks memoization when disableExposureLog changes', () => {
      runAction(method, name);
      runAction(method, name, {
        disableExposureLog: true,
      });

      expect(storeSpy).toHaveBeenCalledTimes(2);
    });

    it('breaks memoization when options changes', () => {
      runAction(method, name);
      runAction(method, name, {
        someRandomOptions: 'foo',
      });

      expect(storeSpy).toHaveBeenCalledTimes(2);
    });

    it('breaks memoization when user changes', async () => {
      runAction(method, name);
      client.updateUserSync({ userID: 'updated_user' });
      runAction(method, name);

      expect(storeSpy).toHaveBeenCalledTimes(2);
    });

    it('breaks memoization when user refreshed', async () => {
      runAction(method, name);
      client.updateUserSync({ userID: 'initial_user' });
      runAction(method, name);

      expect(storeSpy).toHaveBeenCalledTimes(2);
    });

    it('only increments nonExposureCount on the first call when memoized', async () => {
      for (let i = 0; i < 3; i++) {
        runAction(method, name, {
          disableExposureLog: true,
        });
      }

      await client.flush();

      const [url, args] = fetchMock.mock.calls.pop() ?? [];
      expect(url).toContain('/rgstr');

      const body = JSON.parse(String(args?.body ?? '')) as any;
      const last = body.events.pop();
      expect(last.eventName).toBe('statsig::non_exposed_checks');
      expect(last.metadata.checks).toEqual({
        [name]: 1,
      });
    });

    it('only logs exposures on the first call when memoized', async () => {
      for (let i = 0; i < 3; i++) {
        const result = runAction(method, name);

        if (method === 'getParameterStore') {
          (result as ParameterStore).get('a_string_param');
        }
      }

      await client.flush();

      const [url, args] = fetchMock.mock.calls.pop() ?? [];
      expect(url).toContain('/rgstr');

      const body = JSON.parse(String(args?.body ?? '')) as any;
      const exposures = body.events.filter((event: any) =>
        event.eventName.match(/statsig::.*_exposure/),
      );

      expect(exposures.length).toBe(1);

      const exposure = exposures[0];
      expect(exposure.eventName).toMatch(/statsig::.*_exposure/);
    });
  });

  it('does not memoize getExperiment when userPersistedValues is set', () => {
    client.getExperiment('an_experiment', { userPersistedValues: {} });
    client.getExperiment('an_experiment', { userPersistedValues: {} });

    expect(storeSpy).toHaveBeenCalledTimes(2);
  });
});
