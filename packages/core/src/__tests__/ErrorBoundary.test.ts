import { configureErrorBoundary, errorBoundary } from '../ErrorBoundary';

function throwing() {
  errorBoundary('test', () => {
    throw new Error('Test Error');
  });
}

describe('Error Boundary', () => {
  const requests: { url: string; params: unknown }[] = [];

  (global as any).fetch = jest.fn((url: string, params: unknown) => {
    requests.push({ url, params });
  });

  beforeAll(() => {
    configureErrorBoundary({
      sdkKey: 'client-key',
      isSilent: true,
      metadata: {
        sdkType: 'test-type',
        sdkVersion: 'test-version',
      },
    });
  });

  it('catches errors', () => {
    expect(() => throwing()).not.toThrow();
  });

  it('logs the error', () => {
    throwing();

    expect(requests[0]?.url).toBe('https://statsigapi.net/v1/sdk_exception');
  });
});
