import { Experiment, StatsigUser } from '@statsig/client-core';

import useDynamicConfig from './useDynamicConfig';

type GetExperimentOptions = {
  logExposure?: boolean;
  user: StatsigUser | null;
};

export default function (
  experimentName: string,
  options: GetExperimentOptions = { logExposure: true, user: null },
): Experiment {
  const config = useDynamicConfig(experimentName, options);
  return config;
}
