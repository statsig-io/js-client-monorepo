import { useContext, useMemo } from 'react';

import {
  Experiment,
  ExperimentEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvalClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

export type UseExperimentOptions = ExperimentEvaluationOptions & {
  user: StatsigUser | null;
};

export default function (
  experimentName: string,
  options?: UseExperimentOptions,
): Experiment {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isPrecomputedEvalClient(client)) {
      return client.getExperiment(experimentName, options);
    }

    if (options?.user != null) {
      return client.getExperiment(experimentName, options.user, options);
    }

    Log.warn(
      `useExperiment hook failed to find a valid Statsig client for experiment '${experimentName}'.`,
    );
    return NoopEvaluationsClient.getExperiment(experimentName, options);
  }, [experimentName, client, renderVersion, options]);
}
