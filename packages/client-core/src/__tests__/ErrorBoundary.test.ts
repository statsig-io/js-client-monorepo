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

  it('uses custom sdk_exception url when configured', () => {
    eb = new ErrorBoundary('client-key', {
      networkConfig: {
        sdkExceptionUrl: 'https://proxy.example.com/sdk_exception',
      },
    });

    throwing();

    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://proxy.example.com/sdk_exception',
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

  it('logs event request failure messages to sdk_exception', () => {
    eb.logEventRequestFailure(
      3,
      'non-retryable error',
      'Manual',
      -1,
      1,
      'network_request_exception_no_response',
      'TypeError: Failed to fetch',
    );

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
    );

    expect(body.failurePath).toBe('network_request_exception_no_response');
    expect(body.failureErrorMessage).toBe('TypeError: Failed to fetch');
  });

  it('logs event request failure diagnostics to sdk_exception', () => {
    eb.logEventRequestFailure(
      3,
      'max retry attempts exceeded',
      'Manual',
      -1,
      5,
      'network_request_exception_no_response',
      'TypeError: Failed to fetch',
      'cross_origin_custom_headers_preflight_risk',
      {
        elapsedMsBucket: '<250',
        bodySizeBucket: '<16384',
        crossOrigin: 'true',
        hasCustomUrl: 'true',
      },
    );

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
    );

    expect(body.failureDiagnosticBucket).toBe(
      'cross_origin_custom_headers_preflight_risk',
    );
    expect(body.failureDiagnostic_elapsedMsBucket).toBe('<250');
    expect(body.failureDiagnostic_bodySizeBucket).toBe('<16384');
    expect(body.failureDiagnostic_crossOrigin).toBe('true');
    expect(body.failureDiagnostic_hasCustomUrl).toBe('true');
  });

  it('omits empty event request failure messages', () => {
    eb.logEventRequestFailure(
      3,
      'non-retryable error',
      'Manual',
      -1,
      1,
      'network_request_exception_no_response',
      '',
    );

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
    );

    expect(body.failurePath).toBe('network_request_exception_no_response');
    expect(body).not.toHaveProperty('failureErrorMessage');
  });
});
