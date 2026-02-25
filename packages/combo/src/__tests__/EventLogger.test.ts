import 'jest-fetch-mock';
import { anyObject, anyStringContaining } from 'statsig-test-helpers';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

const timeout = async (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

function getLogEventCalls(): typeof fetchMock.mock.calls {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).includes('rgstr'),
  );
}

describe('Event Logger', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it('does not immediately flush logged events', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      { loggingIntervalMs: 999, loggingBufferMaxSize: 999 },
    );
    client.initializeSync();

    client.logEvent('one');
    await timeout(2);

    expect(getLogEventCalls()).toHaveLength(0);
  });

  it('flushes when backgrounded', async () => {
    const client = new StatsigClient('my-key', {});
    client.initializeSync();

    client.logEvent('one');

    _notifyVisibilityChanged('background');
    await timeout(1);

    expect(getLogEventCalls()[0]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);
  });

  it('flushes when pagehide', async () => {
    const client = new StatsigClient('my-key', {});
    client.initializeSync();

    client.logEvent('one');

    window.dispatchEvent(new Event('pagehide'));
    await timeout(500);

    expect(getLogEventCalls()[0]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);
  });

  it('does not double flush with unloading and pagehide', async () => {
    const client = new StatsigClient('my-key', {});
    client.initializeSync();

    client.logEvent('one');

    window.dispatchEvent(new Event('beforeunload'));
    window.dispatchEvent(new Event('pagehide'));
    await timeout(500);

    expect(getLogEventCalls().length).toEqual(1);
  });

  it('allows logging in server environments when loggingEnabled is "always"', async () => {
    jest.mock('@statsig/client-core', () => {
      const actual = jest.requireActual('@statsig/client-core');
      return {
        ...actual,
        _isServerEnv: () => true,
      };
    });

    const client = new StatsigClient(
      'my-key',
      {},
      { loggingEnabled: 'always' },
    );
    client.initializeSync();

    client.logEvent('electron-app-event');
    await timeout(500);

    expect(getLogEventCalls()[0]).toEqual([
      anyStringContaining('/v1/rgstr'),
      anyObject(),
    ]);
  });
});

describe('Event Logger Update Runtime Options', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  it('updates loggingEnabled', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      { loggingEnabled: 'disabled' },
    );
    client.initializeSync();
    client.logEvent('test-event111');
    await client.flush();
    expect(getLogEventCalls()).toHaveLength(0);

    client.updateRuntimeOptions({ loggingEnabled: 'always' });
    client.logEvent('test-event222');

    await client.flush();
    //loads from storage
    expect(getLogEventCalls()).toHaveLength(2);
  });

  it('loads pre consent events after enabling logging', async () => {
    const client = new StatsigClient(
      'my-key',
      {},
      { loggingEnabled: 'disabled' },
    );
    client.initializeSync();
    client.logEvent('test-event111');
    await client.flush();
    expect(getLogEventCalls()).toHaveLength(0);

    client.updateRuntimeOptions({ loggingEnabled: 'always' });
    client.logEvent('test-event222');

    await client.flush();
    await timeout(500);
    const logEventCalls = getLogEventCalls();
    expect(logEventCalls).toHaveLength(2);
    const body1 = JSON.parse(String(logEventCalls[0][1]?.body ?? '')) as any;
    const body2 = JSON.parse(String(logEventCalls[1][1]?.body ?? '')) as any;
    expect(body1.events[0].eventName).toEqual('test-event111');
    expect(body2.events[0].eventName).toEqual('test-event222');
  });
});
