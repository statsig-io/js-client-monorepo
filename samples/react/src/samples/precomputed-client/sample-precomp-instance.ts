import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';

import { STATSIG_CLIENT_KEY } from '../../Contants';

export const myStatsigClient = new PrecomputedEvaluationsClient(
  STATSIG_CLIENT_KEY,
  { userID: '' },
);
