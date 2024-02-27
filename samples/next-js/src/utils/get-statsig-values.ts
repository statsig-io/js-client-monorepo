import Statsig, { StatsigUser } from 'statsig-node';

const isStatsigReady = Statsig.initialize(
  'secret-IiDuNzovZ5z9x75BEjyZ4Y2evYa94CJ9zNtDViKBVdv',
);

export async function getStatsigValues(user: StatsigUser): Promise<string> {
  await isStatsigReady;

  const values = Statsig.getClientInitializeResponse(user, undefined, {
    hash: 'djb2',
  });

  return JSON.stringify(values);
}
