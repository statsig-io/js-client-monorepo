import { configureErrorBoundary, errorBoundary } from '../ErrorBoundary';
import { Log, LogLevel } from '../Log';

describe('Error Boundary', () => {
  const requests: { url: string; params: unknown }[] = [];

  (global as any).fetch = jest.fn((url: string, params: unknown) => {
    requests.push({ url, params });
  });

  beforeAll(() => {
    Log.level = LogLevel.None;

    configureErrorBoundary({
      sdkKey: 'client-key',
      metadata: {
        sdkType: 'test-type',
        sdkVersion: 'test-version',
      },
    });
  });

  it('catches errors', () => {
    expect(() => throwing()).not.toThrow();
  });

  it('logs errors to sdk_exception', () => {
    throwing();

    expect(requests[0]?.url).toBe('https://statsigapi.net/v1/sdk_exception');
  });
});

function throwing() {
  errorBoundary('test', () => {
    throw new Error('Test Error');
  });
}
