import { useContext, useMemo } from 'react';

import { StatsigUser } from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import { useStatsigClient } from './useStatsigClient';

export type UseStatsigUserResult = {
  user: StatsigUser;
  updateUserSync: (fn: (prevState: StatsigUser) => StatsigUser) => void;
  updateUserAsync: (
    fn: (prevState: StatsigUser) => StatsigUser,
  ) => Promise<void>;
};

export function useStatsigUser(): UseStatsigUserResult {
  const client = useStatsigClient();
  const { renderVersion } = useContext(StatsigContext);

  const memoUser = useMemo(() => {
    const context = client.getContext();
    return context.user;
  }, [client, renderVersion]);

  return {
    user: memoUser,
    updateUserSync: (fn: (prevState: StatsigUser) => StatsigUser) => {
      const user = fn(memoUser);
      client.updateUserSync(user);
    },
    updateUserAsync: (fn: (prevState: StatsigUser) => StatsigUser) => {
      const user = fn(memoUser);
      return client.updateUserAsync(user);
    },
  };
}
