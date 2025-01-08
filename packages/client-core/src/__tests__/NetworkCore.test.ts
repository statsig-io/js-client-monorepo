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

  describe('Beacon Success', () => {
    let bindSpy: jest.Mock;
    let body: unknown;

    beforeAll(async () => {
      const sendSpy = jest.fn();
      navigator.sendBeacon = sendSpy;

      bindSpy = jest.fn();
      bindSpy.mockImplementation(() => navigator.sendBeacon);
      navigator.sendBeacon.bind = bindSpy;

      await network.beacon({ sdkKey, urlConfig, data });
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
});
