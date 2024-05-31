import Statsig, { LogEventObject, StatsigUser } from 'statsig-node';

const isStatsigReady = Statsig.initialize(
  'secret-IiDuNzovZ5z9x75BEjyZ4Y2evYa94CJ9zNtDViKBVdv',
);

export async function getStatsigValues(
  user: StatsigUser,
  options: { forceSessionReplay?: boolean } = {},
): Promise<string> {
  await isStatsigReady;

  const values = Statsig.getClientInitializeResponse(user, undefined, {
    hash: 'djb2',
  }) as Record<string, unknown> | null;

  if (options.forceSessionReplay === true && values) {
    values['can_record_session'] = true;
    values['session_recording_rate'] = 1;
  }

  return JSON.stringify(values);
}

export async function logEvents(events: LogEventObject[]): Promise<void> {
  await isStatsigReady;

  events.forEach((event) => Statsig.logEventObject(event));
}
