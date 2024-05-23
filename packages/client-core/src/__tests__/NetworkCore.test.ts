import 'jest-fetch-mock';
import { anyString } from 'statsig-test-helpers';

import { Log, LogLevel } from '../Log';
import { NetworkCore } from '../NetworkCore';

Log.level = LogLevel.None;

const urlActual = URL;
const urlSpy = jest.fn();

describe('Network Core', () => {
  const sdkKey = 'a-key';
  const data = { foo: 'bar' };
  const url = 'http://localhost';
  const network = new NetworkCore(null);

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

      await network.post({ sdkKey, url, data });
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

      await network.beacon({ sdkKey, url, data });
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

  describe('Error', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockReject(new Error('Lost Connection'));

      await network.post({ sdkKey, url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Failure', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });

      await network.post({ sdkKey, url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Empty Keys', () => {
    let logSpy: jest.SpyInstance;

    beforeAll(async () => {
      logSpy = jest.spyOn(Log, 'warn');

      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 401 });

      await network.post({ sdkKey: '', url, data: {}, retries: 2 });
    });

    it('does not make any requests', () => {
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs a warning', () => {
      expect(logSpy).toHaveBeenCalledWith(anyString());
    });
  });
});
