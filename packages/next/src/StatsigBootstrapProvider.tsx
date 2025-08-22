import { cookies } from 'next/headers';
import { JSX, ReactNode } from 'react';
import Statsig, {
  InitializationDetails,
  StatsigUser as StatsigNodeUser,
} from 'statsig-node';

import { getCookieName, getUUID } from '@statsig/client-core';
import { StatsigOptions, StatsigUser } from '@statsig/react-bindings';

import BootstrapClientSubProvider from './BootstrapClientSubProvider';

const statsigInitialization: Record<
  string,
  Promise<InitializationDetails> | undefined
> = {};

export default async function StatsigBootstrapProvider({
  children,
  user,
  clientKey,
  serverKey,
  useCookie = true,
  clientOptions,
}: {
  user: StatsigUser;
  children: ReactNode;
  clientKey: string;
  serverKey: string;
  useCookie?: boolean;
  clientOptions?: StatsigOptions | null;
}): Promise<JSX.Element> {
  if (!statsigInitialization[serverKey]) {
    statsigInitialization[serverKey] = Statsig.initialize(serverKey);
  }
  await statsigInitialization[serverKey];

  if (!user.customIDs?.stableID && useCookie) {
    if (cookies().get(getCookieName(clientKey))) {
      user.customIDs = {
        ...(user.customIDs || {}),
        stableID: cookies().get(getCookieName(clientKey))?.value,
      };
    } else {
      const stableID = getUUID();
      user.customIDs = {
        ...(user.customIDs || {}),
        stableID: stableID,
      };
    }
  }

  if (useCookie && !clientOptions?.enableCookies) {
    clientOptions = {
      ...clientOptions,
      enableCookies: true,
    };
  }

  const values = JSON.stringify(
    Statsig.getClientInitializeResponse(user as StatsigNodeUser, clientKey, {
      hash: 'djb2',
    }),
  );

  return (
    <BootstrapClientSubProvider
      user={user}
      values={values}
      clientKey={clientKey}
      clientOptions={clientOptions}
    >
      {children}
    </BootstrapClientSubProvider>
  );
}
