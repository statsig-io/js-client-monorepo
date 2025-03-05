import fetchMock from 'jest-fetch-mock';

import { ErrorBoundary } from '../ErrorBoundary';
import { Log, LogLevel } from '../Log';
import { MockOverrideAdapter } from './MockOverrideAdapter';

describe('Error Boundary', () => {
  let eb: ErrorBoundary;

  function throwing() {
    (eb as any)._capture('test', () => {
      throw new Error('Test Error');
    });
  }

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.mockClear();
    eb = new ErrorBoundary('client-key', {
      networkConfig: {
        logEventUrl: 'foo.com',
      },
      disableCompression: true,
      overrideAdapter: new MockOverrideAdapter(),
      storageProvider: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        isReady: jest.fn(),
        isReadyResolver: jest.fn(),
        getProviderName: jest.fn(),
        getAllKeys: jest.fn(),
      },
    });

    Log.level = LogLevel.None;
  });

  it('catches errors', () => {
    expect(() => throwing()).not.toThrow();
  });

  it('logs errors to sdk_exception', () => {
    throwing();

    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://statsigapi.net/v1/sdk_exception',
    );
  });

  it('logs statsig option to sdk_exception', () => {
    throwing();

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
    );

    expect(body.statsigOptions).toEqual({
      networkConfig: { logEventUrl: 'foo.com' },
      disableCompression: true,
      overrideAdapter: 'set',
      storageProvider: 'set',
    });
  });
});
