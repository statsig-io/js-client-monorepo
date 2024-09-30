import 'jest-fetch-mock';
import { MockLocalStorage } from 'statsig-test-helpers';

import { Log, LogLevel, _notifyVisibilityChanged } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

const timeout = async (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};

function getLogEventCalls(): typeof fetchMock.mock.calls {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).includes('rgstr'),
  );
}

const USER = { userID: 'a-user' };
const FAILED_LOGS_KEY = 'statsig.failed_logs.1101277533';

describe('Event Logger Retries', () => {
  let storageMock: MockLocalStorage;
  let client: StatsigClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    storageMock = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-key', USER);
    await client.initializeAsync();

    Log.level = LogLevel.None;
  });

  beforeEach(async () => {
    storageMock.clear();

    client.logEvent('one');

    fetchMock.mockResponse('', { status: 555 });
    await client.flush();

    fetchMock.mock.calls = [];
  });

  it('writes failed logs to storage', () => {
    expect(storageMock.getItem(FAILED_LOGS_KEY)).not.toBeNull();
  });

  describe('retry reason "GainedFocus"', () => {
    const reforeground = async () => {
      _notifyVisibilityChanged('background');
      _notifyVisibilityChanged('foreground');

      await timeout(1);
    };

    it('retries and removes failed logs on success', async () => {
      fetchMock.mockResponse('{"success": "true"}', { status: 200 });

      await reforeground();

      expect(getLogEventCalls()).toHaveLength(1);
      expect(storageMock.getItem(FAILED_LOGS_KEY)).toBeNull();
    });

    it('retries and retains failed logs on failure', async () => {
      fetchMock.mockResponse('', { status: 555 });

      await reforeground();

      expect(getLogEventCalls()).toHaveLength(1);
      expect(storageMock.getItem(FAILED_LOGS_KEY)).not.toBeNull();
    });
  });

  describe('retry reason "Startup"', () => {
    it('retries and removes failed logs on success', async () => {
      fetchMock.mockResponse('{"success": "true"}', { status: 200 });

      const newClient = (client = new StatsigClient('client-key', USER));
      await newClient.initializeAsync();

      expect(getLogEventCalls()).toHaveLength(1);
      expect(storageMock.getItem(FAILED_LOGS_KEY)).toBeNull();
    });
  });
});
