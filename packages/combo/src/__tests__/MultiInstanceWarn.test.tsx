import { render } from '@testing-library/react';

import { Log, StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings';

function TestComponent() {
  const { client } = useClientAsyncInit('client-key', {});

  return (
    <StatsigProvider client={client}>
      <div>...</div>
    </StatsigProvider>
  );
}

describe('Multi Instance Warning', () => {
  const warnSpy = jest.spyOn(Log, 'warn');

  beforeEach(() => {
    warnSpy.mockClear();
    __STATSIG__ = {} as any;
  });

  it('logs when two StatsigClients are created with the same key', () => {
    new StatsigClient('client-key', {});
    new StatsigClient('client-key', {});
    expect(warnSpy).toHaveBeenCalled();
  });

  it('does not log when two StatsigClients are created with different keys', () => {
    new StatsigClient('client-key-one', {});
    new StatsigClient('client-key-two', {});
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not log when useClientAsyncInit is rendered twice', () => {
    const { rerender } = render(<TestComponent />);
    rerender(<TestComponent />);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
