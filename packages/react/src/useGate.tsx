import { useContext, useMemo } from 'react';
import StatsigContext from './StatsigContext';

export type GateResult = {
  isLoading: boolean;
  value: boolean;
};

export default function (gateName: string): GateResult {
  const { client, version } = useContext(StatsigContext);

  const value = useMemo(() => {
    return client.checkGate(gateName);
  }, [client, version]);

  return {
    isLoading: true,
    value,
  };
}
