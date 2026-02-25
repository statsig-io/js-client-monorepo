import 'jest-fetch-mock';
import { MockLocalStorage } from 'statsig-test-helpers';

import { Log, LogLevel, _DJB2 } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

function getLogEventCalls(): typeof fetchMock.mock.calls {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).includes('rgstr'),
  );
}

const USER = { userID: 'a-user' };
const FAILED_SHUTDOWN_KEY = `statsig.failed_shutdown_events.${_DJB2(
  'client-key',
)}`;

describe('Event Logger Retries', () => {
  let storageMock: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.enableMocks();
    storageMock = MockLocalStorage.enabledMockStorage();

    Log.level = LogLevel.None;
  });

  beforeEach(() => {
    storageMock.clear();
    fetchMock.mock.calls = [];
  });

  describe('retry reason "Startup"', () => {
    it('retries and removes failed logs on success', async () => {
      const oldClient = new StatsigClient('client-key', USER);
      await oldClient.initializeAsync();

      oldClient.logEvent('one');
      fetchMock.mockResponse('', { status: 502 });
      await oldClient.shutdown();

      fetchMock.mock.calls = [];
      fetchMock.mockResponse('{"success": "true"}', { status: 200 });

      const newClient = new StatsigClient('client-key', USER);
      await newClient.initializeAsync();
      await newClient.flush();

      const retryCalls = getLogEventCalls().filter((call) => {
        const body = JSON.parse(String(call[1]?.body ?? '{}')) as {
          events?: { eventName?: string }[];
        };
        return body.events?.some((e) => e.eventName === 'one');
      });
      expect(retryCalls).toHaveLength(1);
      expect(storageMock.getItem(FAILED_SHUTDOWN_KEY)).toBeNull();

      await newClient.shutdown();
    });
  });
});
