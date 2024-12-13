import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import React from 'react';
import {
  InitResponse,
  anyObject,
  anyStringContaining,
} from 'statsig-test-helpers';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';
import { runStatsigSessionReplay } from '@statsig/session-replay';

function Content() {
  const [clicked, setClicked] = React.useState(false);

  return (
    <div>
      <button id="a-button" onClick={() => setClicked(true)}>
        Click Me
      </button>
      {clicked && <div id="clicked">Clicked</div>}
    </div>
  );
}

function getAllLoggedSessionRecordingEvents() {
  return fetchMock.mock.calls.flatMap((call) => {
    if (!call[0]?.toString().includes('/v1/rgstr')) {
      return [];
    }

    const body = JSON.parse(String(call[1]?.body ?? '')) as any;
    return body.events.filter(
      (event) => event.eventName === 'statsig::session_recording',
    );
  });
}

describe('Session Recording - Event Index', () => {
  let client: StatsigClient;

  const triggerRrWebFlush = async () => {
    _notifyVisibilityChanged('background');
    _notifyVisibilityChanged('foreground');
    await new Promise((resolve) => setTimeout(resolve, 1));
  };

  const restartRecording = () => {
    client.$emt({ name: 'session_expired' });
    client.$emt({ name: 'values_updated', status: 'Loading', values: null });
  };

  beforeEach(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(
      JSON.stringify({
        ...InitResponse,
        can_record_session: true,
        session_recording_rate: 1,
      }),
    );
    fetchMock.mockClear();

    client = new StatsigClient('client-key', { userID: 'a-user' });
    await client.initializeAsync();
  });

  it('includes event index in rrweb events', async () => {
    render(
      <StatsigProvider client={client}>
        <Content />
      </StatsigProvider>,
    );

    fireEvent.click(screen.getByText('Click Me'));
    await screen.findByText('Clicked');

    expect(fetchMock).not.toHaveBeenCalledWith(
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    );

    runStatsigSessionReplay(client);
    await triggerRrWebFlush();
    await client.flush();

    const events = getAllLoggedSessionRecordingEvents();
    const rrwebEvents = events.flatMap((event) =>
      JSON.parse(event.metadata.rrweb_events),
    );

    expect(events).toHaveLength(1);
    expect(rrwebEvents[0].eventIndex).toBe(0);
    expect(rrwebEvents[1].eventIndex).toBe(1);
  });

  it('resets event index on restart', async () => {
    render(
      <StatsigProvider client={client}>
        <Content />
      </StatsigProvider>,
    );

    fireEvent.click(screen.getByText('Click Me'));
    await screen.findByText('Clicked');

    expect(fetchMock).not.toHaveBeenCalledWith(
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    );

    runStatsigSessionReplay(client);
    await triggerRrWebFlush();
    await client.flush();

    await act(async () => {
      restartRecording();

      await triggerRrWebFlush();
      await client.flush();
    });

    const events = getAllLoggedSessionRecordingEvents();
    const rrwebEvents = events.flatMap((event) =>
      JSON.parse(event.metadata.rrweb_events),
    );
    expect(events).toHaveLength(2);
    expect(rrwebEvents[2].eventIndex).toBe(0);
    expect(rrwebEvents[3].eventIndex).toBe(1);
  });
});
