import { useContext, useMemo } from 'react';

import {
  Experiment,
  ExperimentEvaluationOptions,
  Log,
} from '@statsig/client-core';

import { NoopEvaluationsClient, isNoopClient } from './NoopEvaluationsClient';
import StatsigContext from './StatsigContext';

export type UseExperimentOptions = ExperimentEvaluationOptions;

export default function (
  experimentName: string,
  options?: UseExperimentOptions,
): Experiment {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useExperiment hook failed to find a valid Statsig client for experiment '${experimentName}'.`,
      );
      return NoopEvaluationsClient.getExperiment(experimentName, options);
    }

    return client.getExperiment(experimentName, options);
  }, [experimentName, client, renderVersion, options]);
}
