import 'jest-fetch-mock';
import { MockLocalStorage, anyNumber, anyString } from 'statsig-test-helpers';

import { _DJB2 } from '../Hashing';
import { NetworkDefault } from '../NetworkConfig';
import {
  NetworkFallbackResolver,
  _isDefaultUrl,
  _isDomainFailure,
} from '../NetworkFallbackResolver';

const SDK_KEY = 'client-test-sdk-key';
const STORAGE_KEY = `statsig.network_fallback.${_DJB2(SDK_KEY)}`;
const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;

const INIT_URL = `${NetworkDefault.initializeApi}/initialize`;

Object.defineProperty(global, 'performance', {
  writable: true,
});

let mockedRecords: string[] | Error = [];
jest.mock('../DnsTxtQuery', () => ({
  _fetchTxtRecords: () => {
    if (mockedRecords instanceof Error) {
      throw mockedRecords;
    }
    return Promise.resolve(mockedRecords);
  },
}));

describe('Network Fallback Resolver', () => {
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
        i: {
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() - 10000,
        },
      });

      const result = resolver.getFallbackUrl(SDK_KEY, INIT_URL);

      expect(result).toBeNull();
      expect(mockStorage.data[STORAGE_KEY]).toBeUndefined();
    });

    it('bumps expiry time when url is successfully used', () => {
      mockStorage.data[STORAGE_KEY] = JSON.stringify({
        i: {
          url: 'fallback.example.com',
          previous: [],
          expiryTime: Date.now() + 999,
        },
      });

      resolver.getFallbackUrl(SDK_KEY, INIT_URL);
      resolver.tryBumpExpiryTime(SDK_KEY, INIT_URL);

      const cache = JSON.parse(mockStorage.data[STORAGE_KEY])['i'];
      expect(cache.url).toEqual(anyString());
      expect(cache.expiryTime).toBeGreaterThan(Date.now() + SIX_DAYS);
    });
  });

  describe('getFallbackUrl', () => {
    it('returns null when no fallback info is available', () => {
      const result = resolver.getFallbackUrl(
        SDK_KEY,
        NetworkDefault.initializeApi,
      );
      expect(result).toBeNull();
    });

    describe('when there is a fallback URL in storage', () => {
      beforeEach(() => {
        mockStorage.data[STORAGE_KEY] = JSON.stringify({
          i: {
            url: 'fallback.example.com',
            previous: [],
            expiryTime: Date.now() + 3600000,
          },
        });
      });

      it('returns null when non-default URL is requested', () => {
        const result = resolver.getFallbackUrl(
          SDK_KEY,
          'https://my-custom-proxy.com/v1/initialize',
        );
        expect(result).toBeNull();
      });

      it('returns fallback URL when found in cache', () => {
        const result = resolver.getFallbackUrl(SDK_KEY, INIT_URL);
        expect(result).toBe('https://fallback.example.com/v1/initialize');
      });
    });

    describe('when fallback info is updated from network', () => {
      beforeEach(async () => {
        mockedRecords = ['i=trailing-slash-fallback.com/'];
        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'err',
          true,
        );
      });

      it('returns a fallback URL', () => {
        const result = resolver.getFallbackUrl(SDK_KEY, INIT_URL);
        expect(result).toBe(
          'https://trailing-slash-fallback.com/v1/initialize',
        );
      });
    });
  });

  describe('tryFetchUpdatedFallbackInfo', () => {
    it('returns false when dns query throws', async () => {
      mockedRecords = new Error('dns query failed');
      const result = await resolver.tryFetchUpdatedFallbackInfo(
        SDK_KEY,
        INIT_URL,
        'err',
        true,
      );
      expect(result).toBe(false);
    });

    it('returns false when the dns query returns an invalid response', async () => {
      mockedRecords = ['not valid'];
      const result = await resolver.tryFetchUpdatedFallbackInfo(
        SDK_KEY,
        INIT_URL,
        'err',
        true,
      );
      expect(result).toBe(false);
    });

    describe('when dns query returns a valid response', () => {
      beforeEach(() => {
        mockedRecords = ['i=fallback.example.com/'];
      });

      it('returns false when error reason is invalid', async () => {
        const result = await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'Bad Request',
          false,
        );
        expect(result).toBe(false);
      });

      it('returns true when error reason is valid', async () => {
        const result = await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'Uncaught Exception',
          false,
        );
        expect(result).toBe(true);
      });

      it('writes fallback info to storage', async () => {
        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'err',
          true,
        );
        expect(JSON.parse(mockStorage.data[STORAGE_KEY])['i']).toMatchObject({
          url: 'fallback.example.com',
          previous: [],
          expiryTime: anyNumber(),
        });
      });
    });

    describe('multiple updates', () => {
      beforeEach(async () => {
        jest.useFakeTimers();

        mockedRecords = [
          'i=fallback.example.com/',
          'i=fallback-again.example.com',
        ];

        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'Uncaught Exception',
          false,
        );

        jest.advanceTimersByTime(14_400_000 /* COOLDOWN_TIME_MS */);

        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          INIT_URL,
          'Uncaught Exception',
          false,
        );
      });

      it('switches to newer urls when previous have been tried', async () => {
        expect(resolver.getFallbackUrl(SDK_KEY, INIT_URL)).toBe(
          'https://fallback-again.example.com/v1/initialize',
        );
      });

      it('writes previous urls to storage', () => {
        expect(JSON.parse(mockStorage.data[STORAGE_KEY])['i']).toEqual(
          expect.objectContaining({
            url: 'fallback-again.example.com',
            previous: ['fallback.example.com'],
          }),
        );
      });
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

  describe('isDefaultUrl', () => {
    it('returns true for default urls', () => {
      expect(_isDefaultUrl(NetworkDefault.initializeApi)).toBe(true);
      expect(_isDefaultUrl(NetworkDefault.eventsApi)).toBe(true);
      expect(_isDefaultUrl(NetworkDefault.specsApi)).toBe(true);
    });

    it('returns false for non-default urls', () => {
      expect(_isDefaultUrl('https://my-custom-proxy.com/v1/initialize')).toBe(
        false,
      );
    });
  });
});
