import fetchMock from 'jest-fetch-mock';
import {
  InitResponse,
  MockLocalStorage,
  nullthrows,
  skipFrame,
} from 'statsig-test-helpers';

import { StatsigClient, StatsigOptions } from '@statsig/js-client';

describe('Cache and Environment', () => {
  const user = { userID: 'a-user' };
  let client: StatsigClient;
  let storage: MockLocalStorage;
  let options: StatsigOptions;

  beforeAll(() => {
    storage = MockLocalStorage.enabledMockStorage();
  });

  describe.each(['Without Environment', 'With Environment'])('%s', (title) => {
    beforeAll(async () => {
      fetchMock.enableMocks();
      fetchMock.mockResponse(
        JSON.stringify({ ...InitResponse, time: 2, generator: 'mock' }),
      );

      storage.clear();

      options = {};
      if (title === 'With Environment') {
        options.environment = { tier: 'development' };
      }

      client = new StatsigClient('client-sdk-key', user, options);

      client.initializeSync();

      await skipFrame();
    });

    it('should have the reason "NoValues" ', () => {
      expect(client.getFeatureGate('a_gate').details.reason).toBe('NoValues');
    });

    it('should update the cache in the background', () => {
      const [, value] = nullthrows(
        Object.entries(storage.data).find(([k]) =>
          k.startsWith('statsig.cached.evaluations.'),
        ),
      );

      const result = JSON.parse(value);
      expect(JSON.parse(result.data).generator).toBe('mock');
    });

    it('should use cache values on next boot', () => {
      const newClient = new StatsigClient('client-sdk-key', user, options);

      newClient.initializeSync();

      expect(newClient.getFeatureGate('a_gate').details.reason).toBe(
        'Cache:Recognized',
      );
    });
  });
});
