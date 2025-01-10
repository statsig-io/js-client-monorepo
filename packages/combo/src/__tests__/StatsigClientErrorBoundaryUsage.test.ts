import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import { AnyStatsigType, StatsigClient } from '@statsig/js-client';

describe('StatsigClientErrorBoundaryUsage', () => {
  let client: StatsigClient;
  let ebSpy: jest.SpyInstance;

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);
  });

  beforeEach(async () => {
    fetchMock.mock.calls = [];

    client = new StatsigClient('client-key', { userID: 'initial_user' });
    await client.initializeAsync();

    (client as any)._store._getDetailedStoreResult = () => {
      const error = new Error('Test Error');
      error.name = 'Test Error';
      throw error;
    };

    ebSpy = jest.spyOn(client.getContext().errorBoundary as any, '_onError');
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
      case 'getLayer':
        return client.getLayer(name, options);
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
    it('catches the error', () => {
      expect(() => runAction(method, name)).not.toThrow();

      expect(ebSpy).toHaveBeenCalledTimes(1);
    });

    it('only logs the first error', async () => {
      for (let i = 0; i < 3; i++) {
        runAction(method, name);
      }

      const calls = fetchMock.mock.calls.filter((call) =>
        call[0]?.toString().includes('sdk_exception'),
      );

      expect(calls).toHaveLength(1);
    });
  });
});
