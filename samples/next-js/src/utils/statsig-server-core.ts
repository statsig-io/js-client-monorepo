import { Statsig, StatsigUser } from '@statsig/statsig-node-core';

export type LogEventObject = {
  eventName: string;
  user: StatsigUser;
  value?: string | number | null;
  metadata?: Record<string, unknown> | null;
};

const specs: string | null = null;
const statsig = new Statsig(
  'secret-IiDuNzovZ5z9x75BEjyZ4Y2evYa94CJ9zNtDViKBVdv',
);

// Initialize statsig with options
const initialize = statsig.initialize();

export async function getStatsigValues(user: StatsigUser): Promise<string> {
  await initialize;
  const values = statsig.getClientInitializeResponse(user, {
    hashAlgorithm: 'djb2',
  }) as string;
  return values;
}

export async function getSpecs(): Promise<string | null> {
  await initialize;
  return specs;
}

export async function logEvents(events: LogEventObject[]): Promise<void> {
  await initialize;
  events.forEach((event) => {
    statsig.logEvent(
      event.user,
      event.eventName,
      event.value,
      _nullableStringMap(event.metadata),
    );
  });
}

// Make sure to properly shutdown when the server stops
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
