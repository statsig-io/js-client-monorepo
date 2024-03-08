import { StatsigUser } from '@statsig/client-core';

import useStatsigPrecomputedEvaluationsClient from './useStatsigPrecomputedEvaluationsClient';

export type UseStatsigUserResult = {
  user: StatsigUser;
  updateUserSync: (fn: (prevState: StatsigUser) => StatsigUser) => void;
  updateUserAsync: (
    fn: (prevState: StatsigUser) => StatsigUser,
  ) => Promise<void>;
};

export default function (): UseStatsigUserResult {
  const client = useStatsigPrecomputedEvaluationsClient();

  return {
    user: client.getCurrentUser(),
    updateUserSync: (fn: (prevState: StatsigUser) => StatsigUser) => {
      const user = fn(client.getCurrentUser());
      client.updateUserSync(user);
    },
    updateUserAsync: (fn: (prevState: StatsigUser) => StatsigUser) => {
      const user = fn(client.getCurrentUser());
      return client.updateUserAsync(user);
    },
  };
}
