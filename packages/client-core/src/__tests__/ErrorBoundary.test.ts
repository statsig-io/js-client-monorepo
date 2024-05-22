import fetchMock from 'jest-fetch-mock';

import { ErrorBoundary } from '../ErrorBoundary';
import { Log, LogLevel } from '../Log';

describe('Error Boundary', () => {
  let eb: ErrorBoundary;

  function throwing() {
    (eb as any)._capture('test', () => {
      throw new Error('Test Error');
    });
  }

  beforeAll(() => {
    fetchMock.enableMocks();
    eb = new ErrorBoundary('client-key', null);

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
});
