import fetchMock from 'jest-fetch-mock';
import { anyNumber, anyObject } from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

describe('Non Exposed Checks', () => {
  describe.each([
    [
      'StatsigClient',
      async () => {
        const client = new StatsigClient('', { userID: 'a-user' });
        client.initializeSync();

        // 2 checks
        client.checkGate('a_gate', { disableExposureLog: true });
        client.checkGate('a_gate', { disableExposureLog: true });
        await client.flush();

        // reset then 1 check
        client.checkGate('a_gate', { disableExposureLog: true });
        await client.flush();

        // 1 check with exposure
        client.checkGate('a_gate');
        await client.shutdown();
      },
    ],
    [
      'StatsigOnDeviceEvalClient',
      async () => {
        const user = { userID: 'a-user' };
        const client = new StatsigOnDeviceEvalClient('');
        client.initializeSync();

        // 2 checks
        client.checkGate('a_gate', user, { disableExposureLog: true });
        client.checkGate('a_gate', user, { disableExposureLog: true });
        await client.flush();

        // reset then 1 check
        client.checkGate('a_gate', user, { disableExposureLog: true });
        await client.flush();

        // 1 check with exposure
        client.checkGate('a_gate', user);
        await client.shutdown();
      },
    ],
  ])('%s', (_title, action) => {
    beforeAll(async () => {
      fetchMock.enableMocks();
      await action();
    });

    it('increments counters and logs the event', () => {
      const request = fetchMock.mock.calls[1];
      const body = JSON.parse(String(request[1]?.body ?? '')) as any;
      expect(body.events).toHaveLength(1);

      const event = body.events[0];
      expect(event.eventName).toBe('statsig::non_exposed_checks');
      expect(event.metadata).toEqual({ checks: { a_gate: 2 } });
      expect(event.statsigMetadata).toEqual(anyObject());
      expect(event.time).toEqual(anyNumber());
    });

    it('resets counters and logs the event', () => {
      const request = fetchMock.mock.calls[2];
      const body = JSON.parse(String(request[1]?.body ?? '')) as any;
      expect(body.events).toHaveLength(1);

      const event = body.events[0];
      expect(event.eventName).toBe('statsig::non_exposed_checks');
      expect(event.metadata).toEqual({ checks: { a_gate: 1 } });
      expect(event.statsigMetadata).toEqual(anyObject());
      expect(event.time).toEqual(anyNumber());
    });

    it('is not logged when exposures are enbaled', () => {
      const request = fetchMock.mock.calls[3];
      const body = JSON.parse(String(request[1]?.body ?? '')) as any;
      expect(body.events).toHaveLength(1);

      const event = body.events[0];
      expect(event.eventName).toBe('statsig::gate_exposure');
    });
  });
});
