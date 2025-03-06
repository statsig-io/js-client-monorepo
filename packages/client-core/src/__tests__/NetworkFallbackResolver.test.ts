import 'jest-fetch-mock';
import { MockLocalStorage, anyString } from 'statsig-test-helpers';

import { _DJB2 } from '../Hashing';
import { Endpoint } from '../NetworkConfig';
import {
  NetworkFallbackResolver,
  _isDomainFailure,
} from '../NetworkFallbackResolver';
import { UrlConfiguration } from '../UrlConfiguration';

const SDK_KEY = 'client-test-sdk-key';
const STORAGE_KEY = `statsig.network_fallback.${_DJB2(SDK_KEY)}`;
const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;

const DEFAULT_INIT_URL_CONFIG = new UrlConfiguration(
  Endpoint._initialize,
  null,
  null,
  null,
);

const DEFAULT_CHECKSUM = DEFAULT_INIT_URL_CONFIG.getChecksum();

Object.defineProperty(global, 'performance', {
  writable: true,
});

describe('NetworkFallbackResolver', () => {
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

  describe('expiry time', () => {
    it('wipes fallback info when expired', () => {
      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          urlConfigChecksum: DEFAULT_CHECKSUM,
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() - 10000,
        },
      });

      const result = resolver.getActiveFallbackUrl(
        SDK_KEY,
        DEFAULT_INIT_URL_CONFIG,
      );

      expect(result).toBeNull();
      expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
    });

    it('bumps expiry time when url is successfully used', () => {
      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          urlConfigChecksum: DEFAULT_CHECKSUM,
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() + 999,
        },
      });

      resolver.getActiveFallbackUrl(SDK_KEY, DEFAULT_INIT_URL_CONFIG);
      resolver.tryBumpExpiryTime(SDK_KEY, DEFAULT_INIT_URL_CONFIG);

      const cache = JSON.parse(mockStorage.data[STORAGE_KEY])['initialize'];
      expect(cache.url).toEqual(anyString());
      expect(cache.expiryTime).toBeGreaterThan(Date.now() + SIX_DAYS);
    });
  });

  describe('when url config changes', () => {
    it('wipes fallback info when custom url changed', () => {
      const urlConfig = new UrlConfiguration(
        Endpoint._initialize,
        'https://new.example.com',
        null,
        null,
      );

      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          urlConfigChecksum: urlConfig.getChecksum(),
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() - 10000,
        },
      });

      const result = resolver.getActiveFallbackUrl(SDK_KEY, urlConfig);

      expect(result).toBeNull();
      expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
    });

    it('wipes fallback info when fallback urls changed', () => {
      const changedConfig = new UrlConfiguration(
        Endpoint._initialize,
        null,
        null,
        ['fallback.example.com', 'fallback3.example.com'],
      );

      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          urlConfigChecksum: DEFAULT_CHECKSUM,
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() + 999,
        },
      });

      const result = resolver.getActiveFallbackUrl(SDK_KEY, changedConfig);

      expect(result).toBeNull();
      expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
    });

    it('does not throw when no original url info in cache ', () => {
      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        initialize: {
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() + 999,
        },
      });

      const changedConfig = new UrlConfiguration(
        Endpoint._initialize,
        null,
        null,
        ['fallback.example.com', 'fallback3.example.com'],
      );

      const result = resolver.getActiveFallbackUrl(SDK_KEY, changedConfig);

      expect(result).toBeNull();
      expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
    });
  });

  describe('domain failure checks', () => {
    it('handles uncaught exceptions', () => {
      expect(_isDomainFailure('Uncaught Exception', false)).toBe(true);
    });

    it('handles timeouts', () => {
      expect(_isDomainFailure(null, true)).toBe(true);
    });

    it('handles failed to fetch', () => {
      expect(_isDomainFailure('Failed to fetch', false)).toBe(true);
    });

    it('handles network errors', () => {
      expect(
        _isDomainFailure(
          'NetworkError when attempting to fetch resource',
          false,
        ),
      ).toBe(true);
    });

    it('rejects other errors', () => {
      expect(_isDomainFailure('Unknown Error', false)).toBe(false);
    });
  });
});
