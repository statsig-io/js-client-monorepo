import { useContext, useMemo } from 'react';
import StatsigContext from './StatsigContext';
import { StatsigUser } from '@statsig/core';

export type GateResult = {
  value: boolean;
};

type CheckGateOptions = {
  localEvalUser?: StatsigUser;
};

export default function (
  gateName: string,
  options?: CheckGateOptions,
): GateResult {
  const { localEvalClient, remoteEvalClient, version } =
    useContext(StatsigContext);

  const value = useMemo(() => {
    if (options?.localEvalUser != null) {
      return localEvalClient.checkGate(options.localEvalUser, gateName);
    }

    return remoteEvalClient.checkGate(gateName);
  }, [localEvalClient, remoteEvalClient, version]);

  return {
    value,
  };
}
