import 'jest-fetch-mock';
import {
  anyObject,
  anyString,
  anyStringContaining,
} from 'statsig-test-helpers';

import { _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

describe('Network Override', () => {
  let client: StatsigClient;
  let customNetworkFunc: jest.Mock;

  const setup = async (enabled: boolean) => {
    customNetworkFunc = jest.fn().mockImplementation(() => {
      return Promise.resolve({});
    });

    navigator.sendBeacon = jest.fn();

    client = new StatsigClient(
      'client-net-override-test',
      {},
      {
        networkConfig: {
          networkOverrideFunc: enabled ? customNetworkFunc : undefined,
        },
      },
    );

    _notifyVisibilityChanged('background');

    // /v1/initialize
    await client.initializeAsync();

    // /v1/rgstr or /v1/log_event_beacon
    client.logEvent('my_event');

    // /v1/sdk_exception
    (client as any).dataAdapter.getDataSync = 1;
    await client.updateUserAsync({});

    await client.shutdown();
  };

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  describe('when networkOverrideFunc is not set', () => {
    beforeEach(() => setup(false));

    it('does not hit the custom function', () => {
      expect(customNetworkFunc).not.toHaveBeenCalled();
    });

    it('sends /initialize requests to fetch api', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );
    });

    it('sends /sdk_exception requests to fetch api', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/sdk_exception'),
        anyObject(),
      );
    });

    it('sends /log_event_beacon requests to navigator beacon', () => {
      expect(navigator.sendBeacon).toHaveBeenCalledWith(
        anyStringContaining('/v1/log_event_beacon'),
        anyString(),
      );
    });
  });

  describe('when networkOverrideFunc is set', () => {
    beforeEach(() => setup(true));

    it('sends /initialize requests to the custom func', () => {
      expect(customNetworkFunc).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );
    });

    it('sends /sdk_exception requests to the custom func', () => {
      expect(customNetworkFunc).toHaveBeenCalledWith(
        anyStringContaining('/v1/sdk_exception'),
        anyObject(),
      );
    });

    it('sends /rgstr requests to the custom func', () => {
      expect(customNetworkFunc).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );
    });

    it('does not hit navigator beacon', () => {
      expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });

    it('does not hit the fetch api', () => {
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
