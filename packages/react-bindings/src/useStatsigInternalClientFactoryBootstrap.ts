import { useMemo, useRef } from 'react';

import { StatsigUser, _getInstance } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

type FactoryArgs = {
  sdkKey: string;
  initialUser: StatsigUser;
  initialValues: string;
  statsigOptions: StatsigOptions | null;
  useLegacyClient?: boolean;
};

export function useStatsigInternalClientFactoryBootstrap<
  T extends StatsigClient,
>(factory: (args: FactoryArgs) => T, args: FactoryArgs): T {
  const clientRef = useRef<T | null>(_getInstance(args.sdkKey) as T | null);

  return useMemo(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const inst = factory(args);
    clientRef.current = inst;

    if (args.useLegacyClient) {
      inst.dataAdapter.setDataLegacy(args.initialValues, args.initialUser);
    } else {
      inst.dataAdapter.setData(args.initialValues);
    }

    inst.initializeSync();

    return inst;
  }, []);
}
