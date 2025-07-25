import { GetServerSidePropsContext } from 'next';

import { getUUID } from '@statsig/client-core';
import { Statsig, StatsigUser } from '@statsig/statsig-node-core';

export type LogEventObject = {
  eventName: string;
  user: StatsigUser;
  value?: string | number | null;
  metadata?: Record<string, unknown> | null;
};

const statsig = new Statsig(
  process.env['STATSIG_SERVER_KEY'] ?? 'No Statsig Server Key Provided',
);

export const isStatsigReady = statsig.initialize();

export type StatsigServerProps = {
  jsonUser: object;
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

  const jsonUser = { userID: 'a-user', customIDs: { stableID } };
  const user = new StatsigUser(jsonUser);
  const data = await getStatsigValues(user);

  return { jsonUser, data, key, host };
}

export async function getStatsigValues(user: StatsigUser): Promise<string> {
  await isStatsigReady;

  const values = statsig.getClientInitializeResponse(user, {
    hashAlgorithm: 'djb2',
  }) as string;

  return values;
}

export async function logEvents(events: LogEventObject[]): Promise<void> {
  await isStatsigReady;

  events.forEach((event) => {
    statsig.logEvent(
      event.user,
      event.eventName,
      event.value,
      _nullableStringMap(event.metadata),
    );
  });
}

process.on('SIGTERM', () => {
  statsig
    .shutdown()
    .then(() => {
      // Do nothing
    })
    .catch((_error) => {
      // Do nothing
    });
});

function _nullableStringMap(
  input: Record<string, unknown> | null | undefined,
): Record<string, string> | null {
  if (!input) {
    return null;
  }

  const result: Record<string, string> = {};
  if (input) {
    Object.entries(input).forEach(([key, value]) => {
      if (typeof value != 'string') {
        try {
          result[key] = JSON.stringify(value);
        } catch (_) {
          result[key] = String(value);
        }
      } else {
        result[key] = value;
      }
    });
  }

  return result;
}
