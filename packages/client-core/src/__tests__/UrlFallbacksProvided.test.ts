import 'jest-fetch-mock';
import { MockLocalStorage } from 'statsig-test-helpers';

import { _DJB2 } from '../Hashing';
import { Endpoint } from '../NetworkConfig';
import { NetworkFallbackResolver } from '../NetworkFallbackResolver';
import { UrlConfiguration } from '../UrlConfiguration';

const SDK_KEY = 'client-test-sdk-key';
const STORAGE_KEY = `statsig.network_fallback.${_DJB2(SDK_KEY)}`;

Object.defineProperty(global, 'performance', {
  writable: true,
});

let dnsCalls = 0;

jest.mock('../DnsTxtQuery', () => ({
  _fetchTxtRecords: () => {
    dnsCalls++;
    return Promise.reject();
  },
}));

describe('Url Fallbacks Via StatsigOptions', () => {
  let mockStorage: MockLocalStorage;
  let resolver: NetworkFallbackResolver;

  beforeAll(() => {
    mockStorage = MockLocalStorage.enabledMockStorage();
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    resolver = new NetworkFallbackResolver({});
    mockStorage.clear();
    fetchMock.mockClear();
  });

  describe('tryFetchUpdatedFallbackInfo', () => {
    const resolveAgainstConfig = (urlConfig: UrlConfiguration) => {
      return resolver.tryFetchUpdatedFallbackInfo(
        SDK_KEY,
        urlConfig,
        'Uncaught Exception',
        false,
      );
    };

    beforeEach(() => {
      dnsCalls = 0;
    });

    it('does not make dns query when custom url is used', async () => {
      const urlConfig = new UrlConfiguration(
        Endpoint._initialize,
        'https://my-custom-proxy.com/v1/initialize',
        null,
        null,
      );

      await resolveAgainstConfig(urlConfig);

      expect(dnsCalls).toBe(0);
    });

    it('does not make dns query when custom api is used', async () => {
      const urlConfig = new UrlConfiguration(
        Endpoint._initialize,
        null,
        'https://my-custom-proxy.com/v1',
        null,
      );

      await resolveAgainstConfig(urlConfig);

      expect(dnsCalls).toBe(0);
    });

    it('does not make dns query when custom fallback urls are given', async () => {
      const urlConfig = new UrlConfiguration(Endpoint._initialize, null, null, [
        'https://my-custom-proxy.com/v1/initialize',
      ]);

      await resolveAgainstConfig(urlConfig);

      expect(dnsCalls).toBe(0);
    });

    it('returns the first available fallback url', async () => {
      const urlConfig = new UrlConfiguration(Endpoint._initialize, null, null, [
        'https://my-custom-proxy.com/v1/initialize',
      ]);

      await resolveAgainstConfig(urlConfig);

      const url = resolver.getActiveFallbackUrl(SDK_KEY, urlConfig);
      expect(url).toBe('https://my-custom-proxy.com/v1/initialize');
    });

    it('returns fallback URL when a custom URL is requested', () => {
      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          url: 'https://fallback.example.com/v1/initialize',
          previous: [],
          expiryTime: Date.now() + 3600000,
        },
      });

      const result = resolver.getActiveFallbackUrl(
        SDK_KEY,
        new UrlConfiguration(
          Endpoint._initialize,
          'https://my-custom-proxy.com/v1/initialize',
          null,
          null,
        ),
      );
      expect(result).toBe('https://fallback.example.com/v1/initialize');
    });
  });
});
