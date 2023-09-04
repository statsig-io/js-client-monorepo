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
  const { localEvalClient, remoteEvalClient } = useContext(StatsigContext);

  const localEvalResult = useMemo(() => {
    if (!localEvalClient || options?.localEvalUser == null) {
      return null;
    }

    return localEvalClient.checkGate(options.localEvalUser, gateName);
  }, [options?.localEvalUser, localEvalClient?.loadingStatus]);

  const remoteEvalResult = useMemo(() => {
    if (!remoteEvalClient) {
      return null;
    }

    return remoteEvalClient?.checkGate(gateName);
  }, [localEvalClient, remoteEvalClient?.loadingStatus]);

  return {
    value: localEvalResult ?? remoteEvalResult ?? false,
  };
}
