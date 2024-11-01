import 'jest-fetch-mock';
import { anyString } from 'statsig-test-helpers';

import { Log, LogLevel } from '../Log';
import { NetworkCore } from '../NetworkCore';

const SDK_KEY = 'client-sdk-key';

describe('NetworkTimeout', () => {
  let result: unknown;
  let resolverSpy: jest.SpyInstance;

  beforeAll(async () => {
    Log.level = LogLevel.None;

    fetchMock.enableMocks();
    fetchMock.mockImplementationOnce(
      (_url, options) =>
        new Promise((_, reject) => {
          const abortSignal = options?.signal;
          abortSignal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          // The request will hang until aborted
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
      url: 'https://statsig.com',
      sdkKey: SDK_KEY,
      data: {},
    });
  });

  it('returns null when the request times out', () => {
    expect(result).toBeNull();
  });

  it('attempts to update the fallback url', () => {
    expect(resolverSpy).toHaveBeenCalledWith(
      SDK_KEY,
      anyString(),
      'Timeout of 1ms expired.',
      true,
    );
  });
});
