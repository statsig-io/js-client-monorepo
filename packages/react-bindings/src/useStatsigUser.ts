import { useCallback, useContext, useMemo } from 'react';

import { StatsigUser } from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import { useStatsigClient } from './useStatsigClient';

type UpdaterArg = StatsigUser | ((previous: StatsigUser) => StatsigUser);
type UpdaterFunc<T> = (updated: UpdaterArg) => T;
type SyncUpdateFunc = UpdaterFunc<void>;
type AsyncUpdateFunc = UpdaterFunc<Promise<void>>;

export type UseStatsigUserResult = {
  user: StatsigUser;
  updateUserSync: SyncUpdateFunc;
  updateUserAsync: AsyncUpdateFunc;
};

export function useStatsigUser(): UseStatsigUserResult {
  const { client } = useStatsigClient();
  const { renderVersion } = useContext(StatsigContext);

  const deps = [client, renderVersion];

  const memoUser = useMemo(() => {
    const context = client.getContext();
    return context.user;
  }, deps);

  return {
    user: memoUser,
    updateUserSync: useCallback((arg): void => {
      if (typeof arg === 'function') {
        arg = arg(memoUser);
      }

      client.updateUserSync(arg);
    }, deps),
    updateUserAsync: useCallback((arg) => {
      if (typeof arg === 'function') {
        arg = arg(memoUser);
      }

      return client.updateUserAsync(arg);
    }, deps),
  };
}
