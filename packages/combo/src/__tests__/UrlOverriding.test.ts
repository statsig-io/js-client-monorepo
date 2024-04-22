import fetchMock from 'jest-fetch-mock';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';
import {
  StatsigOptions as OnDeviceEvalStatsigOptions,
  StatsigOnDeviceEvalClient,
} from '@statsig/js-on-device-eval-client';

describe('Url Overriding', () => {
  const user = { userID: 'a-user' };

  let sendBeaconMock: jest.Mock;

  beforeAll(() => {
    fetchMock.enableMocks();
    sendBeaconMock = jest.fn();

    Object.defineProperty(window, 'navigator', {
      value: {
        sendBeacon: sendBeaconMock,
      },
    });
  });

  beforeEach(() => {
    fetchMock.mock.calls = [];
    sendBeaconMock.mock.calls = [];
  });

  describe('StatsigOnDeviceEvalClient', () => {
    const run = async (options: OnDeviceEvalStatsigOptions) => {
      _notifyVisibilityChanged('foreground');

      const client = new StatsigOnDeviceEvalClient('', options);
      // /download_config_specs
      await client.initializeAsync();

      // /rgstr
      client.logEvent({ eventName: 'my-event' }, user);
      await client.flush();

      // /log_event_beacon
      _notifyVisibilityChanged('background');
      client.logEvent({ eventName: 'my-event' }, user);
      await client.shutdown();
    };

    it('works without overrides', async () => {
      await run({});

      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://api.statsigcdn.com/v1/download_config_specs?k=',
      );

      expect(fetchMock.mock.calls[1][0]).toContain(
        'https://events.statsigapi.net/v1/rgstr?k=',
      );

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        'https://events.statsigapi.net/v1/log_event_beacon?k=',
      );
    });

    it('works for api overrides', async () => {
      const api = 'http://my-server';
      await run({ networkConfig: { api } });

      expect(fetchMock.mock.calls[0][0]).toContain(
        `${api}/download_config_specs?k=`,
      );

      expect(fetchMock.mock.calls[1][0]).toContain(`${api}/rgstr?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        `${api}/log_event_beacon?k=`,
      );
    });

    it('works for individual url overrides', async () => {
      const downloadConfigSpecsUrl = 'http://dcs-only/dcs';
      const logEventUrl = 'http://log-only/log_event';
      const logEventBeaconUrl = 'http://log-beacon-only/le_beacon';
      await run({
        networkConfig: {
          downloadConfigSpecsUrl,
          logEventBeaconUrl,
          logEventUrl,
        },
      });

      expect(fetchMock.mock.calls[0][0]).toContain(
        `${downloadConfigSpecsUrl}?k=`,
      );

      expect(fetchMock.mock.calls[1][0]).toContain(`${logEventUrl}?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        `${logEventBeaconUrl}?k=`,
      );
    });
  });

  describe('StatsigClient', () => {
    const run = async (options: StatsigOptions) => {
      _notifyVisibilityChanged('foreground');

      const client = new StatsigClient('', user, options);
      // /initialize
      await client.initializeAsync();

      // /rgstr
      client.logEvent({ eventName: 'my-event' });
      await client.flush();

      // /log_event_beacon
      _notifyVisibilityChanged('background');
      client.logEvent({ eventName: 'my-event' });
      await client.shutdown();
    };

    it('works without overrides', async () => {
      await run({});

      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://api.statsig.com/v1/initialize?k=',
      );

      expect(fetchMock.mock.calls[1][0]).toContain(
        'https://events.statsigapi.net/v1/rgstr?k=',
      );

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        'https://events.statsigapi.net/v1/log_event_beacon?k=',
      );
    });

    it('works for api overrides', async () => {
      const api = 'http://my-server';
      await run({ networkConfig: { api } });

      expect(fetchMock.mock.calls[0][0]).toContain(`${api}/initialize?k=`);

      expect(fetchMock.mock.calls[1][0]).toContain(`${api}/rgstr?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        `${api}/log_event_beacon?k=`,
      );
    });

    it('works for individual url overrides', async () => {
      const initializeUrl = 'http://init-only/init';
      const logEventUrl = 'http://log-only/log_event';
      const logEventBeaconUrl = 'http://log-beacon-only/le_beacon';
      await run({
        networkConfig: { initializeUrl, logEventBeaconUrl, logEventUrl },
      });

      expect(fetchMock.mock.calls[0][0]).toContain(`${initializeUrl}?k=`);

      expect(fetchMock.mock.calls[1][0]).toContain(`${logEventUrl}?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        `${logEventBeaconUrl}?k=`,
      );
    });
  });
});
