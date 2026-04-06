import 'jest-fetch-mock';
import { anyString } from 'statsig-test-helpers';

import { Log } from '../Log';
import { Endpoint } from '../NetworkConfig';
import { NetworkCore } from '../NetworkCore';
import { UrlConfiguration } from '../UrlConfiguration';

const urlActual = URL;
const urlSpy = jest.fn();
const sdkKey = 'a-key';

Object.defineProperty(global, 'performance', {
  writable: true,
});

describe('Network Core', () => {
  const data = { foo: 'bar' };
  const urlConfig = new UrlConfiguration(
    Endpoint._initialize,
    'http://localhost',
    null,
    null,
  );
  const emitter = jest.fn();
  const network = new NetworkCore(null, emitter);

  beforeAll(() => {
    (global as any).URL = urlSpy;
  });

  afterAll(() => {
    (global as any).URL = urlActual;
  });

  describe('POST Success', () => {
    let body: unknown;

    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponseOnce(JSON.stringify({ result: '12345' }));

      await network.post({ sdkKey, urlConfig, data });
      body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}');
    });

    it('makes request with data', () => {
      expect(body).toMatchObject(data);
    });

    it('includes statsig metadata', () => {
      expect(Object.keys(body as object)).toContain('statsigMetadata');
    });

    it('does not use URL', () => {
      // Due to issue with RN. Usage of URL is problematic.
      // See https://github.com/facebook/react-native/issues/24428
      expect(urlSpy).not.toHaveBeenCalled();
    });
  });

  describe('Synchronous Beacon Success -- must remain synchronous', () => {
    let bindSpy: jest.Mock;
    let body: unknown;

    beforeAll(async () => {
      const sendSpy = jest.fn();
      navigator.sendBeacon = sendSpy;

      bindSpy = jest.fn();
      bindSpy.mockImplementation(() => navigator.sendBeacon);
      navigator.sendBeacon.bind = bindSpy;

      network.beacon({ sdkKey, urlConfig, data });
      body = JSON.parse(sendSpy.mock.calls[0]?.[1] ?? '{}');
    });

    it('makes request with data', () => {
      expect(body).toMatchObject(data);
    });

    it('includes statsig metadata', () => {
      expect(Object.keys(body as object)).toContain('statsigMetadata');
    });

    it('binds the navigator to itself', () => {
      // ensures fix for "Illegal Invocation" error
      // see: https://github.com/vercel/next.js/issues/23856
      expect(bindSpy).toHaveBeenCalledWith(navigator);
    });
  });

  describe('Too Many Requests', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('Slow Down!', { status: 429 });
      emitter.mockClear();

      await network.post({ sdkKey, urlConfig, data: {}, retries: 2 });
    });

    it('does not make any retry requests', () => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse(JSON.stringify({ result: '12345' }));
      (network as any)._leakyBucket = {};
      emitter.mockClear();
    });

    afterEach(() => {
      (network as any)._leakyBucket = {};
      jest.useRealTimers();
    });

    it('blocks requests that exceeds the limit and reset after time window', async () => {
      const requests = Array(40)
        .fill(null)
        .map(() => network.post({ sdkKey, urlConfig, data: {} }));
      await Promise.allSettled(requests);
      expect(fetchMock).toHaveBeenCalledTimes(40);
    });

    it('blocks requests that exceeds the limit and reset after time window', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });

      const requests = Array(60)
        .fill(null)
        .map(() => network.post({ sdkKey, urlConfig, data: {} }));
      await Promise.allSettled(requests);
      expect(fetchMock).toHaveBeenCalledTimes(50);
      fetchMock.mockClear();

      jest.advanceTimersByTime(1000);

      const newRequests = Array(10)
        .fill(null)
        .map(() => network.post({ sdkKey, urlConfig, data: {} }));
      await Promise.allSettled(newRequests);
      expect(fetchMock).toHaveBeenCalledTimes(10);
    });

    it('maintains rate limit under constant load', async () => {
      const results: Array<Promise<any>> = [];
      const requestRate = 60;
      const durationInSeconds = 3;

      for (let second = 0; second < durationInSeconds; second++) {
        const secondResults: Array<Promise<any>> = [];
        for (let i = 0; i < requestRate; i++) {
          const result = network.post({ sdkKey, urlConfig, data: {} });
          secondResults.push(result);
        }
        results.push(...secondResults);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await Promise.all(results);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(140);
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Error', () => {
    const error = new Error('Lost Connection');

    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockReject(error);
      emitter.mockClear();

      await network.post({ sdkKey, urlConfig, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('emits an error', () => {
      expect(emitter).toHaveBeenCalledWith({
        name: 'error',
        error,
        tag: 'NetworkError',
        requestArgs: expect.objectContaining({
          method: 'POST',
          urlConfig,
        }),
      });
    });
  });

  describe('Failure', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });
      emitter.mockClear();

      await network.post({ sdkKey, urlConfig, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('emits an error', () => {
      const calls = emitter.mock.calls;
      expect(calls).toHaveLength(1);

      const call = calls[0][0];
      expect(call).toMatchObject({
        name: 'error',
        tag: 'NetworkError',
      });

      expect(call.error).toBeInstanceOf(Error);
      expect(call.error.name).toBe('NetworkError');
    });
  });

  describe('Failed Status Preservation', () => {
    it('returns the final retryable HTTP status when opted in', async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });
      emitter.mockClear();

      const result = await network.post({
        sdkKey,
        urlConfig,
        data: {},
        retries: 2,
        preserveFailedStatusCode: true,
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ body: null, code: 500 });
    });

    it('keeps returning null on failed responses by default', async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });
      emitter.mockClear();

      const result = await network.post({
        sdkKey,
        urlConfig,
        data: {},
        retries: 2,
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toBeNull();
    });
  });

  describe('Empty Keys', () => {
    let logSpy: jest.SpyInstance;

    beforeAll(async () => {
      logSpy = jest.spyOn(Log, 'warn');

      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 401 });

      await network.post({
        sdkKey: '',
        urlConfig,
        data: {},
        retries: 2,
      });
    });

    it('does not make any requests', () => {
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs a warning', () => {
      expect(logSpy).toHaveBeenCalledWith(anyString());
    });
  });

  describe('Failure Path Tracking', () => {
    beforeEach(() => {
      fetchMock.mockClear();
      emitter.mockClear();
      (network as any)._leakyBucket = {};
    });

    it('tracks invalid sdk key failures for post', async () => {
      const failureInfo: { path?: string } = {};

      await network.post(
        {
          sdkKey: '',
          urlConfig,
          data: {},
        },
        failureInfo,
      );

      expect(failureInfo.path).toBe('network_invalid_sdk_key');
    });

    it('tracks preventAllNetworkTraffic failures', async () => {
      const blockedNetwork = new NetworkCore(
        {
          networkConfig: {
            preventAllNetworkTraffic: true,
          },
        },
        emitter,
      );
      const failureInfo: { path?: string } = {};

      await blockedNetwork.post(
        {
          sdkKey,
          urlConfig,
          data: {},
        },
        failureInfo,
      );

      expect(failureInfo.path).toBe('network_prevent_all_network_traffic');
    });

    it('tracks rate limited failures', async () => {
      (network as any)._leakyBucket[Endpoint._initialize] = {
        count: 50,
        lastRequestTime: Date.now(),
      };
      const failureInfo: { path?: string } = {};

      await network.post(
        {
          sdkKey,
          urlConfig,
          data: {},
        },
        failureInfo,
      );

      expect(failureInfo.path).toBe('network_rate_limited');
    });

    it('tracks timeout failures without a response', async () => {
      fetchMock.mockImplementationOnce(
        () =>
          new Promise(() => {
            /* noop */
          }),
      );

      const timeoutNetwork = new NetworkCore(
        {
          networkConfig: {
            networkTimeoutMs: 1,
          },
        },
        emitter,
      );
      const failureInfo: { path?: string } = {};

      await timeoutNetwork.post(
        {
          sdkKey,
          urlConfig,
          data: {},
        },
        failureInfo,
      );

      expect(failureInfo.path).toBe('network_request_timed_out_no_response');
    });

    it('tracks non-timeout exceptions without a response', async () => {
      fetchMock.mockRejectOnce(new Error('Lost Connection'));
      const failureInfo: { path?: string } = {};

      await network.post(
        {
          sdkKey,
          urlConfig,
          data: {},
        },
        failureInfo,
      );

      expect(failureInfo.path).toBe('network_request_exception_no_response');
    });

    it('tracks invalid sdk key failures for beacon', () => {
      const failureInfo: { path?: string } = {};
      const result = network.beacon(
        {
          sdkKey: '',
          urlConfig,
          data,
        },
        failureInfo,
      );

      expect(result).toBe(false);
      expect(failureInfo.path).toBe('beacon_invalid_sdk_key');
    });

    it('tracks beacon false failures', () => {
      const sendBeacon = jest.fn(() => false);
      const bindSpy = jest.fn(() => sendBeacon);
      navigator.sendBeacon = sendBeacon as typeof navigator.sendBeacon;
      navigator.sendBeacon.bind = bindSpy as typeof navigator.sendBeacon.bind;
      const failureInfo: { path?: string } = {};

      const result = network.beacon(
        {
          sdkKey,
          urlConfig,
          data,
        },
        failureInfo,
      );

      expect(result).toBe(false);
      expect(failureInfo.path).toBe('beacon_send_false');
    });

    it('tracks beacon exception failures', () => {
      const sendBeacon = jest.fn(() => {
        throw new Error('Beacon failed');
      });
      const bindSpy = jest.fn(() => sendBeacon);
      navigator.sendBeacon = sendBeacon as typeof navigator.sendBeacon;
      navigator.sendBeacon.bind = bindSpy as typeof navigator.sendBeacon.bind;
      const failureInfo: { path?: string } = {};

      expect(() =>
        network.beacon(
          {
            sdkKey,
            urlConfig,
            data,
          },
          failureInfo,
        ),
      ).toThrow('Beacon failed');
      expect(failureInfo.path).toBe('beacon_send_exception');
    });
  });
});
