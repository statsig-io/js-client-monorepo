import * as React from 'react';

import { StatsigUser } from '@statsig/react-bindings';
import {
  Statsig,
  StatsigUser as StatsigUserCore,
} from '@statsig/statsig-node-core';

import BootstrapClientSubProvider from './BootstrapClientSubProvider';

let isStatsigReady = false;

function filterUndefined<T>(
  obj: Record<string, T | undefined> | undefined,
): Record<string, T> {
  if (!obj) return {};
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export default async function StatsigBootstrapProvider({
  children,
  user,
  clientKey,
  serverKey,
}: {
  user: StatsigUser;
  children: React.ReactNode;
  clientKey: string;
  serverKey: string;
}): Promise<React.JSX.Element> {
  if (!isStatsigReady) {
    isStatsigReady = true;
    const statsig = Statsig.newShared(serverKey);
    await statsig.initialize();
  }

  const sharedStatsig = Statsig.shared();
  const userCore = new StatsigUserCore({
    userID: user.userID,
    customIDs: filterUndefined(user.customIDs),
    email: user.email,
    userAgent: user.userAgent,
    custom: filterUndefined(user.custom),
    country: user.country,
    locale: user.locale,
    appVersion: user.appVersion,
    ip: user.ip,
    privateAttributes: filterUndefined(user.privateAttributes ?? undefined),
  });
  const values = sharedStatsig.getClientInitializeResponse(userCore, {
    hashAlgorithm: 'djb2',
    clientSdkKey: clientKey,
  });

  return (
    <BootstrapClientSubProvider
      user={user}
      values={values}
      clientKey={clientKey}
    >
      {children}
    </BootstrapClientSubProvider>
  );
}
