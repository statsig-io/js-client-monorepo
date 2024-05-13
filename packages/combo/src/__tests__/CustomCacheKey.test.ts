import fetchMock from 'jest-fetch-mock';
import { InitResponse, MockLocalStorage } from 'statsig-test-helpers';

import { DJB2 } from '@statsig/client-core';
import { StatsigClient, StatsigUser } from '@statsig/js-client';

describe('Custom Cache Key', () => {
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify({ ...InitResponse, time: 123456 }));

    storage = MockLocalStorage.enabledMockStorage();
  });

  describe('with custom cache key', () => {
    beforeEach(async () => {
      delete storage.data['statsig.cached.evaluations.my_key'];

      const opts = {
        customUserCacheKeyFunc: (_key: string, _user: StatsigUser) => 'my_key',
      };

      client = new StatsigClient('client-sdk-key', {}, opts);
      await client.initializeAsync();
    });

    it('does not use the custom function for stable_id or session_id', () => {
      const hash = DJB2(`k:client-sdk-key`);

      expect(storage.data['statsig.stable_id.' + hash]).toBeDefined();
      expect(storage.data['statsig.session_id.' + hash]).toBeDefined();
    });

    it('uses the custom cache key function for evaluations', () => {
      expect(storage.data['statsig.cached.evaluations.my_key']).toBeDefined();
    });
  });

  describe('without custom cache key', () => {
    beforeEach(async () => {
      delete storage.data['statsig.cached.evaluations.my_key'];

      client = new StatsigClient('client-sdk-key', {}, {});
      await client.initializeAsync();
    });

    it('does not use the custom function for stable_id or session_id', () => {
      const hash = DJB2(`k:client-sdk-key`);

      expect(storage.data['statsig.stable_id.' + hash]).toBeDefined();
      expect(storage.data['statsig.session_id.' + hash]).toBeDefined();
    });

    it('uses the custom cache key function for evaluations', () => {
      expect(storage.data['statsig.cached.evaluations.my_key']).toBeUndefined();
    });
  });
});
