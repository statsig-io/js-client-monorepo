import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';
import * as React from 'react';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import { useStatsigUser } from '../useStatsigUser';

describe('useStatsigUser', () => {
  let client: jest.Mocked<Partial<PrecomputedEvaluationsInterface>>;
  let renderOptions: Parameters<typeof render>[1];
  let updateUserSyncRefs: any[] = [];
  let updateUserAsyncRefs: any[] = [];
  let valuesUpdated: () => void = jest.fn();

  const MemoizedComponent = () => {
    const { updateUserSync, updateUserAsync } = useStatsigUser();

    const renderCountRef = React.useRef(0);
    renderCountRef.current += 1;

    React.useEffect(() => {
      updateUserSyncRefs.push(updateUserSync);
      updateUserAsyncRefs.push(updateUserAsync);
    });

    return <div />;
  };

  beforeEach(() => {
    client = {
      flush: jest.fn().mockReturnValue(Promise.resolve()),
      updateUserSync: jest.fn().mockReturnValue({}),
      updateUserAsync: jest.fn().mockReturnValue(Promise.resolve({})),
      getContext: jest.fn().mockReturnValue({ user: { userID: 'test-user' } }),
      $on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'values_updated') {
          valuesUpdated = jest.fn(callback);
        }
      }),
      off: jest.fn(),
      loadingStatus: 'Ready' as any,
    };
    // Wraps the rendered component in a StatsigProvider
    renderOptions = {
      wrapper: ({ children }) => (
        <StatsigProvider client={client as any}>{children}</StatsigProvider>
      ),
    };
    updateUserSyncRefs = [];
    updateUserAsyncRefs = [];

    // Resets all mock counts
    jest.clearAllMocks();
  });

  it('memoizes function references across renders', async () => {
    const { rerender } = render(<MemoizedComponent />, renderOptions);

    rerender(<MemoizedComponent />);

    expect(updateUserSyncRefs.length).toBeGreaterThan(1);
    expect(updateUserAsyncRefs.length).toBeGreaterThan(1);

    // Ensures every reference is the same
    expect(new Set(updateUserSyncRefs).size).toBe(1);
    expect(new Set(updateUserAsyncRefs).size).toBe(1);
  });

  it('memoizes function references when client values update', async () => {
    render(<MemoizedComponent />, renderOptions);

    await act(async () => {
      // This updates the renderVersion, which was causing the references to change
      valuesUpdated();
    });

    expect(updateUserSyncRefs.length).toBeGreaterThan(1);
    expect(updateUserAsyncRefs.length).toBeGreaterThan(1);

    // Ensures every reference is the same
    expect(new Set(updateUserSyncRefs).size).toBe(1);
    expect(new Set(updateUserAsyncRefs).size).toBe(1);
  });
});
