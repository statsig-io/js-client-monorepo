import fetchMock from 'jest-fetch-mock';
import {
  CreateTestPromise,
  MockLocalStorage,
  TestPromise,
  getInitializeResponseWithConfigValue,
  skipFrame,
} from 'statsig-test-helpers';

import { DataAdapterResult } from '@statsig/client-core';

import StatsigClient from '../StatsigClient';

const FIRST_RESPONSE = () =>
  new Response(getInitializeResponseWithConfigValue({ isFirst: true }), {
    headers: {},
  });

const SECOND_RESPONSE = () =>
  new Response(getInitializeResponseWithConfigValue({ isSecond: true }), {
    headers: {},
  });

describe('Racing Updates', () => {
  let firstReqPromise: TestPromise<Response>;
  let secondReqPromise: TestPromise<Response>;
  let client: StatsigClient;
  let storageMock: MockLocalStorage;
  let emittedValues: (DataAdapterResult | null)[];

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  const setup = async () => {
    storageMock.clear();

    firstReqPromise = CreateTestPromise<Response>();
    secondReqPromise = CreateTestPromise<Response>();

    fetchMock.enableMocks();
    fetchMock.mockResponseOnce('{}');

    client = new StatsigClient(
      'client-key',
      {
        userID: 'initial',
      },
      { customUserCacheKeyFunc: (_, user) => String(user.userID) },
    );

    await client.initializeAsync();

    let times = 0;
    fetchMock.mockImplementation(async (url, _payload) => {
      if (url && typeof url === 'string' && url.includes('/rgstr')) {
        return new Response('{}');
      }
      if (url instanceof Request && url.url.includes('/rgstr')) {
        return new Response('{}');
      }
      if (times++ === 0) {
        return firstReqPromise;
      }
      return secondReqPromise;
    });

    client.updateUserAsync({ userID: 'first-update' }).catch((e) => {
      throw e;
    });

    client.updateUserAsync({ userID: 'second-update' }).catch((e) => {
      throw e;
    });

    emittedValues = [];
    client.$on('values_updated', ({ values }) => emittedValues.push(values));
  };

  describe('when the second request finishes first', () => {
    beforeAll(async () => {
      await setup();

      secondReqPromise.resolve(SECOND_RESPONSE());
      firstReqPromise.resolve(FIRST_RESPONSE());

      await skipFrame();
    });

    it('correctly returns the second value', () => {
      const config = client.getDynamicConfig('a_dynamic_config');
      expect(config.value).toEqual({ isSecond: true });
    });

    it('writes both values to cache', () => {
      const keys = Object.keys(storageMock.data);
      expect(keys).toContain('statsig.cached.evaluations.first-update');
      expect(keys).toContain('statsig.cached.evaluations.second-update');
    });

    it('emits the correct value to values_update', () => {
      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]?.data).toContain('{"isSecond":true}');
    });
  });

  describe('when the first request finishes first', () => {
    beforeAll(async () => {
      await setup();

      firstReqPromise.resolve(FIRST_RESPONSE());
      secondReqPromise.resolve(SECOND_RESPONSE());

      await skipFrame();
    });

    it('correctly returns the second value', () => {
      const config = client.getDynamicConfig('a_dynamic_config');
      expect(config.value).toEqual({ isSecond: true });
    });

    it('writes both values to cache', () => {
      const keys = Object.keys(storageMock.data);
      expect(keys).toContain('statsig.cached.evaluations.first-update');
      expect(keys).toContain('statsig.cached.evaluations.second-update');
    });

    it('emits the correct value to values_update', () => {
      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]?.data).toContain('{"isSecond":true}');
    });
  });
});
