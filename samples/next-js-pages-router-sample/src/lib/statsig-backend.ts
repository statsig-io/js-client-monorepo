import { GetServerSidePropsContext } from 'next';
import Statsig, { StatsigUser } from 'statsig-node';

import { getUUID } from '@statsig/client-core';

export const isStatsigReady = Statsig.initialize(
  process.env['STATSIG_SERVER_KEY'] ?? 'No Statsig Server Key Provided',
  {
    environment: { tier: 'development' },
  },
);

export type StatsigServerProps = {
  user: StatsigUser;
  data: string;
  key: string;
  host: string | null;
};

export async function getStatsigServerProps(
  context: GetServerSidePropsContext,
): Promise<StatsigServerProps> {
  await isStatsigReady;

  const hostname =
    typeof window !== 'undefined'
      ? window.location.hostname
      : context.req?.headers.host;

  let host = null;
  if (hostname) {
    host = hostname?.includes('localhost')
      ? `http://${hostname}`
      : `https://${hostname}`;
  }

  let stableID = context.req.cookies['custom-statsig-stable-id'];
  if (!stableID) {
    stableID = getUUID();
    context.res.setHeader('Set-Cookie', 'custom-statsig-stable-id=' + stableID);
  }

  const key =
    process.env['NEXT_PUBLIC_STATSIG_CLIENT_KEY'] ??
    'No Statsig Client Key Provided';

  const user = { userID: 'a-user', customIDs: { stableID } };
  const data = await getStatsigValues(user);

  return { user, data, key, host };
}

export async function getStatsigValues(user: StatsigUser): Promise<string> {
  await isStatsigReady;

  const key =
    process.env['NEXT_PUBLIC_STATSIG_CLIENT_KEY'] ??
    'No Statsig Client Key Provided';

  const values = Statsig.getClientInitializeResponse(user, key, {
    hash: 'djb2', //🔥 'djb2' is required. By default this would be 'sha256'.
  });

  const data = JSON.stringify(values);
  return data;
}
