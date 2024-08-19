import { render } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import React from 'react';
import {
  CreateTestPromise,
  InitResponse,
  TestPromise,
} from 'statsig-test-helpers';

import {
  Diagnostics,
  StatsigEvent,
  _notifyVisibilityChanged,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';
import { runStatsigSessionReplay } from '@statsig/session-replay';

function SecretField() {
  return <div className="do-not-record">Secret Value</div>;
}

describe('Session Recording RRWeb Config', () => {
  let logsFlushed: TestPromise<void>;

  const setup = async (blockClass?: string): Promise<StatsigEvent> => {
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
    clearDiagnostics();

    fetchMock.mockResponse(
      JSON.stringify({
        ...InitResponse,
        can_record_session: true,
        session_recording_rate: 1,
      }),
    );

    const client = new StatsigClient('client-key', {});
    await client.initializeAsync();

    logsFlushed = CreateTestPromise<void>();
    fetchMock.mockImplementation(() => {
      logsFlushed.resolve();
      return Promise.resolve(new Response());
    });

    runStatsigSessionReplay(client, {
      rrwebConfig: { blockClass },
    });

    render(
      <StatsigProvider client={client}>
        <SecretField />
      </StatsigProvider>,
    );

    // trigger flush
    _notifyVisibilityChanged('background');
    _notifyVisibilityChanged('foreground');

    await logsFlushed;

    const [, r] = fetchMock.mock.calls[1];
    return JSON.parse(String(r?.body)).events[0];
  };

  test('hiding senstive info via ignoreClass', async () => {
    const event = await setup('do-not-record');
    expect(event.metadata?.rrweb_events).not.toContain('Secret Value');
  });

  test('showing all content when nothing configured', async () => {
    const event = await setup();
    expect(event.metadata?.rrweb_events).toContain('Secret Value');
  });
});

function clearDiagnostics() {
  Diagnostics._markInitNetworkReqEnd = jest.fn();
  Diagnostics._markInitOverallEnd = jest.fn();
  Diagnostics._markInitProcessEnd = jest.fn();
  Diagnostics._markInitNetworkReqStart = jest.fn();
  Diagnostics._markInitOverallStart = jest.fn();
  Diagnostics._markInitProcessStart = jest.fn();
}
