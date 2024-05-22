import 'jest-fetch-mock';
import { CompressionStream } from 'node:stream/web';
import { TextEncoder } from 'node:util';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

describe('Log Event Compression', () => {
  let sendBeaconMock: jest.Mock;
  let client: StatsigClient;

  beforeAll(() => {
    fetchMock.enableMocks();
    sendBeaconMock = jest.fn();

    Object.defineProperty(window, 'navigator', {
      value: {
        sendBeacon: sendBeaconMock,
      },
    });

    (window as any).CompressionStream = CompressionStream;
    (window as any).TextEncoder = TextEncoder;

    client = new StatsigClient('my-key', {});
  });

  beforeEach(() => {
    (__STATSIG__ as any) = {};
    _notifyVisibilityChanged('foreground');
    fetchMock.mock.calls = [];
  });

  it('compresses post requests to /rgstr', async () => {
    client.logEvent('some_event');
    await client.flush();

    const [, r] = fetchMock.mock.calls[0];
    expect(r?.body?.constructor.name).toBe('ArrayBuffer');
  });

  it('does not compress when no-compress is set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    __STATSIG__!['no-compress'] = '1';
    client.logEvent('some_event');
    await client.flush();

    const [, r] = fetchMock.mock.calls[0];
    expect(r?.body?.constructor.name).toBe('String');
  });

  it('compresses beacons to /rgstr', async () => {
    _notifyVisibilityChanged('background');
    client.logEvent('some_event');
    await client.flush();

    const [, r] = sendBeaconMock.mock.calls[0];
    expect(r?.constructor.name).toBe('ArrayBuffer');
  });
});
