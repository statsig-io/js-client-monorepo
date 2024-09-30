import fetchMock from 'jest-fetch-mock';
import { MockLocalStorage } from 'statsig-test-helpers';

import { StatsigGlobal, _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';
import {
  StatsigOptions as OnDeviceEvalStatsigOptions,
  StatsigOnDeviceEvalClient,
} from '@statsig/js-on-device-eval-client';

describe('Url Overriding', () => {
  const user = { userID: 'a-user' };

  let sendBeaconMock: jest.Mock;
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    storageMock = MockLocalStorage.enabledMockStorage();
    sendBeaconMock = jest.fn();

    Object.defineProperty(window, 'navigator', {
      value: {
        sendBeacon: sendBeaconMock,
      },
    });
  });

  beforeEach(() => {
    storageMock.clear();

    __STATSIG__ = {} as StatsigGlobal;
    fetchMock.mock.calls = [];
    sendBeaconMock.mock.calls = [];
  });

  describe('StatsigOnDeviceEvalClient', () => {
    const run = async (options: OnDeviceEvalStatsigOptions) => {
      _notifyVisibilityChanged('foreground');

      const client = new StatsigOnDeviceEvalClient('client-key', options);
      // /download_config_specs
      await client.initializeAsync();

      // /rgstr
      client.logEvent({ eventName: 'my-event' }, user);
      await client.flush();

      // /rgstr (sendBeacon)
      _notifyVisibilityChanged('background');
      client.logEvent({ eventName: 'my-event' }, user);
      await client.shutdown();
    };

    it('works without overrides', async () => {
      await run({});

      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://assetsconfigcdn.org/v1/download_config_specs?k=',
      );

      expect(fetchMock.mock.calls[1][0]).toContain(
        'https://prodregistryv2.org/v1/rgstr?k=',
      );

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        'https://prodregistryv2.org/v1/rgstr?k=',
      );
    });

    it('works for api overrides', async () => {
      const api = 'http://my-server';
      await run({ networkConfig: { api } });

      expect(fetchMock.mock.calls[0][0]).toContain(
        `${api}/download_config_specs?k=`,
      );

      expect(fetchMock.mock.calls[1][0]).toContain(`${api}/rgstr?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(`${api}/rgstr?k=`);
    });

    it('works for individual url overrides', async () => {
      const downloadConfigSpecsUrl = 'http://dcs-only/dcs';
      const logEventUrl = 'http://log-only/log_event';
      await run({
        networkConfig: {
          downloadConfigSpecsUrl,
          logEventUrl,
        },
      });

      expect(fetchMock.mock.calls[0][0]).toContain(
        `${downloadConfigSpecsUrl}?k=`,
      );

      expect(fetchMock.mock.calls[1][0]).toContain(`${logEventUrl}?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(`${logEventUrl}?k=`);
    });
  });

  describe('StatsigClient', () => {
    const run = async (options: StatsigOptions) => {
      _notifyVisibilityChanged('foreground');

      const client = new StatsigClient('client-key', user, options);
      // /initialize
      await client.initializeAsync();

      // /rgstr
      client.logEvent({ eventName: 'my-event' });
      await client.flush();

      // /rgstr (sendBeacon)
      _notifyVisibilityChanged('background');
      client.logEvent({ eventName: 'my-event' });
      await client.shutdown();
    };

    it('works without overrides', async () => {
      await run({});

      expect(fetchMock.mock.calls[0][0]).toContain(
        'https://featureassets.org/v1/initialize?k=',
      );

      expect(fetchMock.mock.calls[1][0]).toContain(
        'https://prodregistryv2.org/v1/rgstr?k=',
      );

      expect(sendBeaconMock.mock.calls[0][0]).toContain(
        'https://prodregistryv2.org/v1/rgstr?k=',
      );
    });

    it('works for api overrides', async () => {
      const api = 'http://my-server';
      await run({ networkConfig: { api } });

      expect(fetchMock.mock.calls[0][0]).toContain(`${api}/initialize?k=`);

      expect(fetchMock.mock.calls[1][0]).toContain(`${api}/rgstr?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(`${api}/rgstr?k=`);
    });

    it('works for individual url overrides', async () => {
      const initializeUrl = 'http://init-only/init';
      const logEventUrl = 'http://log-only/log_event';
      await run({
        networkConfig: { initializeUrl, logEventUrl },
      });

      expect(fetchMock.mock.calls[0][0]).toContain(`${initializeUrl}?k=`);

      expect(fetchMock.mock.calls[1][0]).toContain(`${logEventUrl}?k=`);

      expect(sendBeaconMock.mock.calls[0][0]).toContain(`${logEventUrl}?k=`);
    });
  });
});
