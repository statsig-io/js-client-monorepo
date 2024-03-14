import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY } from '../../Contants';

export const myStatsigClient = new StatsigClient(STATSIG_CLIENT_KEY, {
  userID: '',
});
