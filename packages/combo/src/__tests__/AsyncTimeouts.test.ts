import 'jest-fetch-mock';
import {
  CreateTestPromise,
  MockLocalStorage,
  TestPromise,
  anyString,
  getDcsResponseWithConfigValue,
  getInitializeResponseWithConfigValue,
} from 'statsig-test-helpers';

import { StatsigGlobal, _getStorageKey } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

const INIT_RESPONSE = () =>
  new Response(getInitializeResponseWithConfigValue({ a_string: 'a_value' }), {
    headers: {},
  });

const DCS_RESPONSE = () =>
  new Response(getDcsResponseWithConfigValue({ a_string: 'a_value' }), {
    headers: {},
  });

describe('Async Timeouts', () => {
  const onDeviceCacheKey = _getStorageKey('client-key');

  let resolver: TestPromise<Response>;
  let storage: MockLocalStorage;

  const resetResolver = () => {
    resolver = CreateTestPromise<Response>();
    fetchMock.mockImplementation(() => resolver);
  };

  beforeAll(() => {
    fetchMock.enableMocks();
    storage = MockLocalStorage.enabledMockStorage();
  });

  describe('StatsigOnDeviceEvalClient.initializeAsync Timeouts', () => {
    let client: StatsigOnDeviceEvalClient;

    beforeAll(async () => {
      storage.clear();
      __STATSIG__ = {} as StatsigGlobal;
      resetResolver();

      client = new StatsigOnDeviceEvalClient('client-key');
      await client.initializeAsync({ timeoutMs: 1 });
    });

    it('gets eval reason of NoValues', () => {
      expect(
        client.getDynamicConfig('a_dynamic_config', {}).details.reason,
      ).toBe('NoValues');
    });

    it('does not write anything to cache', () => {
      expect(
        storage.data['statsig.cached.specs.' + onDeviceCacheKey],
      ).toBeUndefined();
    });

    describe('then the network comes back', () => {
      beforeAll(async () => {
        resolver.resolve(DCS_RESPONSE());
      });

      it('does not update the current values, still returns NoValues', () => {
        expect(
          client.getDynamicConfig('a_dynamic_config', {}).details.reason,
        ).toBe('NoValues');
      });

      it('writes the values to cache for the next update', () => {
        expect(
          storage.data['statsig.cached.specs.' + onDeviceCacheKey],
        ).toEqual(anyString());
      });

      describe('then we update and timeout again', () => {
        beforeAll(async () => {
          resetResolver();

          await client.updateAsync({ timeoutMs: 1 });
        });

        it('gets eval reason of Network', () => {
          expect(
            client.getDynamicConfig('a_dynamic_config', {}).details.reason,
          ).toBe('Network:Recognized');
        });
      });
    });
  });

  describe('StatsigOnDeviceEvalClient.initializeAsync Default Timeouts', () => {
    let client: StatsigOnDeviceEvalClient;
    let timeToInit: number;

    beforeAll(async () => {
      storage.clear();
      jest.useFakeTimers({ doNotFake: ['performance'] });
      __STATSIG__ = {} as StatsigGlobal;
      resetResolver();

      client = new StatsigOnDeviceEvalClient('client-key');

      const start = Date.now();
      const promise = client.initializeAsync();
      jest.advanceTimersByTime(3000);
      await promise;
      timeToInit = Date.now() - start;
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('applies default timeout', () => {
      expect(timeToInit).toBeLessThan(3500);
    });

    it('gets eval reason of NoValues', () => {
      expect(
        client.getDynamicConfig('a_dynamic_config', {}).details.reason,
      ).toBe('NoValues');
    });

    it('does not write anything to cache', () => {
      expect(
        storage.data['statsig.cached.specs.' + onDeviceCacheKey],
      ).toBeUndefined();
    });

    describe('then the network comes back', () => {
      beforeAll(async () => {
        resolver.resolve(DCS_RESPONSE());
      });

      it('does not update the current values, still returns NoValues', () => {
        expect(
          client.getDynamicConfig('a_dynamic_config', {}).details.reason,
        ).toBe('NoValues');
      });

      it('writes the values to cache for the next update', () => {
        expect(
          storage.data['statsig.cached.specs.' + onDeviceCacheKey],
        ).toEqual(anyString());
      });
    });
  });

  describe('StatsigClient.updateUserAsync Timeouts', () => {
    let client: StatsigClient;

    beforeAll(async () => {
      storage.clear();
      __STATSIG__ = {} as StatsigGlobal;
      resetResolver();

      client = new StatsigClient(
        'client-key',
        {},
        { customUserCacheKeyFunc: () => 'my-custom-cache' },
      );
      await client.updateUserAsync({ userID: 'a-user' }, { timeoutMs: 1 });
    });

    it('gets eval reason of NoValues', () => {
      expect(client.getDynamicConfig('a_dynamic_config').details.reason).toBe(
        'NoValues',
      );
    });

    it('does not write anything to cache', () => {
      expect(
        storage.data['statsig.cached.evaluations.my-custom-cache'],
      ).toBeUndefined();
    });

    describe('then the network comes back', () => {
      beforeAll(async () => {
        resolver.resolve(INIT_RESPONSE());
      });

      it('does not update the current values, still returns NoValues', () => {
        expect(client.getDynamicConfig('a_dynamic_config').details.reason).toBe(
          'NoValues',
        );
      });

      it('writes the values to cache for the next update', () => {
        expect(
          storage.data['statsig.cached.evaluations.my-custom-cache'],
        ).toEqual(anyString());
      });
    });
  });

  describe('StatsigClient.updateUserAsync Default Timeouts', () => {
    let client: StatsigClient;
    let timeToInit: number;

    beforeAll(async () => {
      storage.clear();
      jest.useFakeTimers({ doNotFake: ['performance'] });
      __STATSIG__ = {} as StatsigGlobal;
      resetResolver();

      client = new StatsigClient(
        'client-key',
        {},
        { customUserCacheKeyFunc: () => 'my-custom-cache' },
      );

      const start = Date.now();
      const promise = client.updateUserAsync({ userID: 'a-user' });
      jest.advanceTimersByTime(3000);
      await promise;

      timeToInit = Date.now() - start;
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('applies default timeout', () => {
      expect(timeToInit).toBeLessThan(3500);
    });

    it('gets eval reason of NoValues', () => {
      expect(client.getDynamicConfig('a_dynamic_config').details.reason).toBe(
        'NoValues',
      );
    });

    it('does not write anything to cache', () => {
      expect(
        storage.data['statsig.cached.evaluations.my-custom-cache'],
      ).toBeUndefined();
    });

    describe('then the network comes back', () => {
      beforeAll(async () => {
        resolver.resolve(INIT_RESPONSE());
      });

      it('does not update the current values, still returns NoValues', () => {
        expect(client.getDynamicConfig('a_dynamic_config').details.reason).toBe(
          'NoValues',
        );
      });

      it('writes the values to cache for the next update', () => {
        expect(
          storage.data['statsig.cached.evaluations.my-custom-cache'],
        ).toEqual(anyString());
      });
    });
  });
});
