import 'jest-fetch-mock';
import { anyString } from 'statsig-test-helpers';

import { Log } from '../Log';
import { Endpoint } from '../NetworkConfig';
import { NetworkCore } from '../NetworkCore';
import { UrlConfiguration } from '../UrlConfiguration';

const urlActual = URL;
const urlSpy = jest.fn();

describe('Network Core', () => {
  const sdkKey = 'a-key';
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
