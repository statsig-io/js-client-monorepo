import { useContext, useMemo } from 'react';

import {
  Experiment,
  ExperimentEvaluationOptions,
  Log,
  StatsigUser,
} from '@statsig/client-core';

import { NoopOnDeviceEvalClient, isNoopClient } from './NoopOnDeviceEvalClient';
import StatsigContext from './StatsigContext';

export type UseExperimentOptions = ExperimentEvaluationOptions;

export default function (
  experimentName: string,
  user: StatsigUser,
  options?: UseExperimentOptions,
): Experiment {
  const { client, renderVersion } = useContext(StatsigContext);

  return useMemo(() => {
    if (isNoopClient(client)) {
      Log.warn(
        `useExperiment hook failed to find a valid StatsigOnDeviceEvalClient for experiment '${experimentName}'.`,
      );
      return NoopOnDeviceEvalClient.getExperiment(
        experimentName,
        user,
        options,
      );
    }

    return client.getExperiment(experimentName, user, options);
  }, [experimentName, client, renderVersion, options]);
}
