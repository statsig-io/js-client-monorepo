import { useCallback, useContext, useMemo } from 'react';

import {
  PrecomputedEvaluationsInterface,
  StatsigUpdateDetails,
  StatsigUser,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import { useStatsigClient } from './useStatsigClient';

type UpdaterArg = StatsigUser | ((previous: StatsigUser) => StatsigUser);
type UpdaterFunc<T> = (updated: UpdaterArg) => T;
type SyncUpdateFunc = UpdaterFunc<StatsigUpdateDetails>;
type AsyncUpdateFunc = UpdaterFunc<Promise<StatsigUpdateDetails>>;

export type UseStatsigUserResult = {
  user: StatsigUser;
  updateUserSync: SyncUpdateFunc;
  updateUserAsync: AsyncUpdateFunc;
};

function getClientUser(client: PrecomputedEvaluationsInterface) {
  const context = client.getContext();
  return context.user;
}

export function useStatsigUser(): UseStatsigUserResult {
  const { client } = useStatsigClient();
  const { renderVersion } = useContext(StatsigContext);

  const memoUser = useMemo(() => {
    return getClientUser(client);
  }, [client, renderVersion]);

  return {
    user: memoUser,
    updateUserSync: useCallback(
      (arg) => {
        if (typeof arg === 'function') {
          arg = arg(getClientUser(client));
        }

        return client.updateUserSync(arg);
      },
      [client],
    ),
    updateUserAsync: useCallback(
      (arg) => {
        if (typeof arg === 'function') {
          arg = arg(getClientUser(client));
        }

        return client.updateUserAsync(arg);
      },
      [client],
    ),
  };
}
