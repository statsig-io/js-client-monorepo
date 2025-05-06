import 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import { AnyStatsigClientEvent, Log } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

describe('Client Event Emitting', () => {
  const user = { userID: 'a-user' };

  let client: StatsigClient;
  let wildcardEvents: AnyStatsigClientEvent[];
  let gateEvalEvents: AnyStatsigClientEvent[];

  beforeEach(() => {
    wildcardEvents = [];
    gateEvalEvents = [];

    client = new StatsigClient('client-key', user);
    client.dataAdapter.setData(InitResponseString);
    client.on('*', (event) => {
      wildcardEvents.push(event);
    });
    client.on('gate_evaluation', (event) => gateEvalEvents.push(event));

    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it('continues emitting when an error occurs while iterating listeners', () => {
    const badCallback = () => {
      throw new Error("Error Out of Statsig's Control");
    };

    let calls = 0;
    const goodCallback = () => {
      calls++;
    };

    (console as any).error = () => {
      // noop
    };
    const logSpy = jest.spyOn(Log, 'error');

    client.on('*', badCallback);
    client.on('gate_evaluation', badCallback);

    client.on('*', goodCallback);
    client.on('gate_evaluation', goodCallback);

    client.checkGate('a_gate');

    // still manages to fire events to the original listeners
    expect(wildcardEvents).toHaveLength(1);
    expect(gateEvalEvents).toHaveLength(1);

    // still manages to file events to the good callback
    expect(calls).toBe(2);

    expect(logSpy).toHaveBeenCalled();
  });

  it('allows edits to the events before they are flushed', async () => {
    client.on('pre_logs_flushed', (events) => {
      events.events.forEach((e: any, i) => {
        e.metadata = {
          ...e.metadata,
          edited: i,
        };
      });
    });

    client.logEvent('event1');
    client.logEvent('event2');
    await client.flush();
    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body?.toString() ?? '{}',
    );
    expect(body.events[0].metadata.edited).toBe(0);
    expect(body.events[1].metadata.edited).toBe(1);
  });

  it('log event listener', () => {
    let logEventName = '';
    client.on('log_event_called', (event) => {
      logEventName = event.event.eventName;
    });
    client.logEvent('event1');
    expect(logEventName).toBe('event1');
  });
});
