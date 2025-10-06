import 'jest-fetch-mock';
import { InitResponseString, anyInstanceOf } from 'statsig-test-helpers';

import { Log, LogLevel } from '../Log';
import { Endpoint } from '../NetworkConfig';
import { NetworkCore } from '../NetworkCore';
import { UrlConfiguration } from '../UrlConfiguration';

const SDK_KEY = 'client-sdk-key';

describe('NetworkTimeout', () => {
  beforeEach(() => {
    Log.level = LogLevel.None;
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  describe('Promise.race timeout', () => {
    let result: unknown;
    let resolverSpy: jest.SpyInstance;

    beforeAll(async () => {
      fetchMock.mockImplementationOnce(
        (_url, _options) =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Network request failed'));
            }, 100);
          }),
      );

      const network = new NetworkCore({
        networkConfig: { networkTimeoutMs: 1 },
      });
      resolverSpy = jest.spyOn(
        (network as any)._fallbackResolver,
        'tryFetchUpdatedFallbackInfo',
      );

      result = await network.post({
        urlConfig: new UrlConfiguration(Endpoint._initialize, null, null, null),
        sdkKey: SDK_KEY,
        data: {},
      });
    });

    it('returns null when the request times out with Promise.race', () => {
      expect(result).toBeNull();
    });

    it('attempts to update the fallback url with Promise.race timeout', () => {
      expect(resolverSpy).toHaveBeenCalledWith(
        SDK_KEY,
        anyInstanceOf(UrlConfiguration),
        expect.any(String),
        true,
      );
    });
  });

  describe('Successful network request in Promise.race timeout', () => {
    let result: unknown;
    let resolverSpy: jest.SpyInstance;

    beforeAll(async () => {
      fetchMock.enableMocks();
      fetchMock.mockResponse(InitResponseString);

      const network = new NetworkCore({
        networkConfig: { networkTimeoutMs: 1000 }, // Longer timeout for successful request
      });
      resolverSpy = jest.spyOn(
        (network as any)._fallbackResolver,
        'tryFetchUpdatedFallbackInfo',
      );

      result = await network.post({
        urlConfig: new UrlConfiguration(Endpoint._initialize, null, null, null),
        sdkKey: SDK_KEY,
        data: {},
      });
    });

    it('returns the response data when request succeeds', () => {
      expect(result).not.toBeNull();
      expect(result).toEqual({
        body: InitResponseString,
        code: 200,
      });
    });

    it('does not call fallback resolver for successful requests', () => {
      expect(resolverSpy).not.toHaveBeenCalled();
    });
  });
});
