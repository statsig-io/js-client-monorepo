import fetchMock from 'jest-fetch-mock';
import {
  CreateTestPromise,
  MockLocalStorage,
  TestPromise,
  getInitializeResponseWithConfigValue,
} from 'statsig-test-helpers';

import StatsigClient from '../StatsigClient';

const FIRST_RESPONSE = () =>
  new Response(getInitializeResponseWithConfigValue({ isFirst: true }), {
    headers: {},
  });

describe('Config List', () => {
  let client: StatsigClient;
  let storageMock: MockLocalStorage;
  let firstReqPromise: TestPromise<Response>;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  beforeEach(async () => {
    storageMock.clear();
    fetchMock.enableMocks();

    firstReqPromise = CreateTestPromise<Response>();

    fetchMock.mockImplementation(async (url) => {
      if (url && typeof url === 'string' && url.includes('/rgstr')) {
        return new Response('{}');
      }
      if (url instanceof Request && url.url.includes('/rgstr')) {
        return new Response('{}');
      }
      return firstReqPromise;
    });

    client = new StatsigClient('client-key', { userID: 'test-user' });

    firstReqPromise.resolve(FIRST_RESPONSE());
    await client.initializeAsync();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it('returns config names from getConfigList', () => {
    const configList = client.getConfigList('');
    expect(configList).toContain('3495537376'); // DJB2('a_dynamic_config'). Probably safe to rely on bc other tests do.
    expect(configList.length).toBeGreaterThan(3);
  });
});
