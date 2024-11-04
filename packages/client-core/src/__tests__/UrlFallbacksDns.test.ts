import 'jest-fetch-mock';
import { MockLocalStorage, anyNumber } from 'statsig-test-helpers';

import { _DJB2 } from '../Hashing';
import { Endpoint } from '../NetworkConfig';
import { NetworkFallbackResolver } from '../NetworkFallbackResolver';
import { UrlConfiguration } from '../UrlConfiguration';

const SDK_KEY = 'client-test-sdk-key';
const STORAGE_KEY = `statsig.network_fallback.${_DJB2(SDK_KEY)}`;

const DEFAULT_INIT_URL_CONFIG = new UrlConfiguration(
  Endpoint._initialize,
  null,
  null,
  null,
);

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

describe('Url Fallbacks Via DNS Lookup', () => {
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

  describe('getActiveFallbackUrl', () => {
    it('returns null when no fallback info is available', () => {
      const result = resolver.getActiveFallbackUrl(
        SDK_KEY,
        DEFAULT_INIT_URL_CONFIG,
      );
      expect(result).toBeNull();
    });

    describe('when there is a fallback URL in storage', () => {
      beforeEach(() => {
        mockStorage.data[STORAGE_KEY] = JSON.stringify({
          initialize: {
            url: 'https://fallback.example.com/v1/initialize',
            previous: [],
            expiryTime: Date.now() + 3600000,
          },
        });
      });

      it('returns fallback URL when found in cache', () => {
        const result = resolver.getActiveFallbackUrl(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
        );
        expect(result).toBe('https://fallback.example.com/v1/initialize');
      });
    });

    describe('when fallback info is updated from network', () => {
      beforeEach(async () => {
        mockedRecords = ['i=trailing-slash-fallback.com/'];
        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
          'err',
          true,
        );
      });

      it('returns a fallback URL', () => {
        const result = resolver.getActiveFallbackUrl(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
        );
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
        DEFAULT_INIT_URL_CONFIG,
        'err',
        true,
      );
      expect(result).toBe(false);
    });

    it('returns false when the dns query returns an invalid response', async () => {
      mockedRecords = ['not valid'];
      const result = await resolver.tryFetchUpdatedFallbackInfo(
        SDK_KEY,
        DEFAULT_INIT_URL_CONFIG,
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
          DEFAULT_INIT_URL_CONFIG,
          'Bad Request',
          false,
        );
        expect(result).toBe(false);
      });

      it('returns true when error reason is valid', async () => {
        const result = await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
          'Uncaught Exception',
          false,
        );
        expect(result).toBe(true);
      });

      it('writes fallback info to storage', async () => {
        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
          'err',
          true,
        );

        expect(
          JSON.parse(mockStorage.data[STORAGE_KEY])['initialize'],
        ).toMatchObject({
          url: 'https://fallback.example.com/v1/initialize',
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
          DEFAULT_INIT_URL_CONFIG,
          'Uncaught Exception',
          false,
        );

        jest.advanceTimersByTime(14_400_000 /* COOLDOWN_TIME_MS */);

        await resolver.tryFetchUpdatedFallbackInfo(
          SDK_KEY,
          DEFAULT_INIT_URL_CONFIG,
          'Uncaught Exception',
          false,
        );
      });

      it('switches to newer urls when previous have been tried', async () => {
        expect(
          resolver.getActiveFallbackUrl(SDK_KEY, DEFAULT_INIT_URL_CONFIG),
        ).toBe('https://fallback-again.example.com/v1/initialize');
      });

      it('writes previous urls to storage', () => {
        expect(JSON.parse(mockStorage.data[STORAGE_KEY])['initialize']).toEqual(
          expect.objectContaining({
            url: 'https://fallback-again.example.com/v1/initialize',
            previous: ['https://fallback.example.com/v1/initialize'],
          }),
        );
      });
    });
  });
});
