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
});
