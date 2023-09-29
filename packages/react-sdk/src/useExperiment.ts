import { Experiment, StatsigUser } from '@sigstat/core';

import useDynamicConfig from './useDynamicConfig';

export type ExperimentResult = {
  experiment: Experiment;
};

type GetExperimentOptions = {
  logExposure: boolean;
  user: StatsigUser | null;
};

export default function (
  experimentName: string,
  options: GetExperimentOptions = { logExposure: true, user: null },
): ExperimentResult {
  const { config } = useDynamicConfig(experimentName, options);
  return { experiment: config };
}
