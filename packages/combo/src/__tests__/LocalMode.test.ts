import 'jest-fetch-mock';
import { anyObject, anyStringContaining } from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Local Mode', () => {
  let client: StatsigClient;

  const setup = async (enabled: boolean) => {
    client = new StatsigClient(
      'client-local-mode-test',
      {},
      { networkConfig: { preventAllNetworkTraffic: enabled } },
    );

    await client.initializeAsync();
    client.logEvent('my_event');
    await client.shutdown();
  };

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.mock.calls = [];
  });

  describe('when preventAllNetworkTraffic is true', () => {
    beforeEach(() => setup(true));

    it('does not hit network', () => {
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('does not log to sdk_exception', () => {
      (client as any).dataAdapter = 1;
      client.updateUserSync({});
      expect(fetchMock).not.toHaveBeenCalledWith(
        anyStringContaining('/v1/sdk_exception'),
        anyObject(),
      );
    });
  });

  describe('when preventAllNetworkTraffic is false', () => {
    beforeEach(() => setup(false));

    it('hits network', () => {
      expect(fetchMock).not.toHaveBeenCalledTimes(0);
    });

    it('logs to sdk_exception', () => {
      (client as any).dataAdapter = 1;
      client.updateUserSync({});
      (client as any).dataAdapter = 1;
      client.updateUserSync({});
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/sdk_exception'),
        anyObject(),
      );
    });
  });
});
