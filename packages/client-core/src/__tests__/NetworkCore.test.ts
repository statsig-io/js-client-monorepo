import 'jest-fetch-mock';

import { Log, LogLevel } from '../Log';
import { NetworkCore } from '../NetworkCore';

Log.level = LogLevel.None;

const urlActual = URL;
const urlSpy = jest.fn();

describe('Network Core', () => {
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

      await network.post({ sdkKey: '', url, data });
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
    let body: unknown;

    beforeAll(async () => {
      const spy = jest.fn();
      navigator.sendBeacon = spy;

      await network.beacon({ sdkKey: '', url, data });
      body = JSON.parse(spy.mock.calls[0]?.[1] ?? '{}');
    });

    it('makes request with data', () => {
      expect(body).toMatchObject(data);
    });

    it('includes statsig metadata', () => {
      expect(Object.keys(body as object)).toContain('statsigMetadata');
    });
  });

  describe('Error', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockReject(new Error('Lost Connection'));

      await network.post({ sdkKey: '', url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Failure', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      fetchMock.mockResponse('', { status: 500 });

      await network.post({ sdkKey: '', url, data: {}, retries: 2 });
    });

    it('make 1 initial and then 2 retries', () => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
