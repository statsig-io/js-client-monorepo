import fetchMock from 'jest-fetch-mock';
import {
  CreateTestPromise,
  MockLocalStorage,
  TestPromise,
  getInitializeResponseWithConfigValue,
  skipFrame,
} from 'statsig-test-helpers';

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

  afterAll(() => {
    jest.clearAllMocks();
    MockLocalStorage.disableMockStorage();
  });

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    firstReqPromise = CreateTestPromise<Response>();
    secondReqPromise = CreateTestPromise<Response>();

    fetchMock.enableMocks();
    fetchMock.mockResponseOnce('{}');

    client = new StatsigClient('client-key', {
      userID: 'initial',
    });

    await client.initializeAsync();

    let times = 0;
    fetchMock.mockImplementation(async (_url, _payload) => {
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
  });

  describe('when the second request finishes first', () => {
    beforeAll(async () => {
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
      expect(keys).toContain('statsig.cached.evaluations.2153812029');
      expect(keys).toContain('statsig.cached.evaluations.1807619807');
    });
  });

  describe('when the first request finishes first', () => {
    beforeAll(async () => {
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
      expect(keys).toContain('statsig.cached.evaluations.2153812029');
      expect(keys).toContain('statsig.cached.evaluations.1807619807');
    });
  });
});
