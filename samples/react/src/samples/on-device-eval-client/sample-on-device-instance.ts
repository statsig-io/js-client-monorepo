import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

import { STATSIG_CLIENT_KEY } from '../../Contants';

export const myUser = { userID: '' };

export const myStatsigClient = new StatsigOnDeviceEvalClient(
  STATSIG_CLIENT_KEY,
);
