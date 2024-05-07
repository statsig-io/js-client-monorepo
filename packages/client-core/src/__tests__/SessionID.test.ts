import {
  CreateTestPromise,
  MockLocalStorage,
  MockRemoteServerEvalClient,
  TestPromise,
} from 'statsig-test-helpers';

import '../$_StatsigGlobal';
import { PrecomputedEvaluationsInterface } from '../ClientInterfaces';
import { DJB2 } from '../Hashing';
import { SessionID } from '../SessionID';
import { Storage } from '../StorageProvider';

const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours

const UUID_V4_REGEX =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;

async function getSessionIDIgnoringInMemoryCache(
  sdkKey: string,
): Promise<string> {
  let result: string | null = null;
  await jest.isolateModulesAsync(async () => {
    const s = (await import('../SessionID')).SessionID;
    result = await s.get(sdkKey);
  });

  return result ?? 'error';
}
const SDK_KEY = 'client-sdk-key';
const STORAGE_KEY = `statsig.session_id.${DJB2(SDK_KEY)}`;

Object.defineProperty(global, 'performance', {
  writable: true,
});

describe('SessionID', () => {
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  it('generates random ids', async () => {
    const first = await SessionID.get('first');
    const second = await SessionID.get('second');

    expect(first).not.toBe(second);
  });

  describe('when storage is empty', () => {
    let sessionID: string;

    beforeAll(async () => {
      storageMock.clear();
      sessionID = await SessionID.get(SDK_KEY);
    });

    it('generates a new ID when none is set in storage', async () => {
      expect(sessionID).toMatch(UUID_V4_REGEX);
    });

    it('persists to storage', async () => {
      const found = (await storageMock.getItem(STORAGE_KEY)) ?? 'ERROR';
      expect(JSON.parse(found).sessionID).toBe(sessionID);
    });

    it('returns the same value when queried again', async () => {
      const again = await SessionID.get(SDK_KEY);
      expect(again).toBe(sessionID);
    });
  });

  describe('when storage has a session id', () => {
    const existingSessionID = '860e7083-d9ee-4d1a-bc71-e671ad522e0f';

    let sessionID: string;

    beforeAll(async () => {
      storageMock.clear();
      storageMock.data[STORAGE_KEY] = JSON.stringify({
        sessionID: existingSessionID,
        startTime: Date.now(),
        lastUpdate: Date.now(),
      });

      sessionID = await getSessionIDIgnoringInMemoryCache(SDK_KEY);
    });

    it('matches what is in storage', async () => {
      expect(sessionID).toEqual(existingSessionID);
    });

    it('still has the same value in storage', async () => {
      const found = storageMock.data[STORAGE_KEY];
      expect(JSON.parse(found).sessionID).toBe(existingSessionID);
    });

    it('returns the same value when queried again', async () => {
      const again = await getSessionIDIgnoringInMemoryCache(SDK_KEY);
      expect(again).toBe(existingSessionID);
    });
  });

  describe('when using different sdk keys', () => {
    let first: string;
    let second: string;

    beforeEach(async () => {
      storageMock.clear();
      first = await getSessionIDIgnoringInMemoryCache('client-key-first');
      second = await getSessionIDIgnoringInMemoryCache('client-key-second');
    });

    it('generates different results', async () => {
      expect(first).not.toMatch(second);
    });

    it('writes creates separate entries', () => {
      expect(Object.keys(storageMock.data)).toHaveLength(2);
    });
  });

  describe('when storage has an old session id', () => {
    const existingSessionID = '860e7083-d9ee-4d1a-bc71-e671ad522e0f';

    let sessionID: string;

    beforeAll(async () => {
      storageMock.clear();
      storageMock.data[STORAGE_KEY] = JSON.stringify({
        sessionID: existingSessionID,
        startTime: 0,
        lastUpdate: Date.now(),
      });

      sessionID = await SessionID.get(SDK_KEY);
    });

    it('does not match what is in storage', async () => {
      expect(sessionID).not.toEqual(existingSessionID);
    });

    it('has the new value in storage', async () => {
      expect(storageMock.data[STORAGE_KEY]).toContain(sessionID);
    });

    it('returns the new value when queried again', async () => {
      const again = await SessionID.get(SDK_KEY);
      expect(again).toBe(sessionID);
    });
  });

  describe('when storage has an idle session id', () => {
    const existingSessionID = '860e7083-d9ee-4d1a-bc71-e671ad522e0f';

    let sessionID: string;

    beforeAll(async () => {
      storageMock.clear();
      storageMock.data[STORAGE_KEY] = JSON.stringify({
        sessionID: existingSessionID,
        startTime: Date.now(),
        lastUpdate: 0,
      });

      sessionID = await SessionID.get(SDK_KEY);
    });

    it('does not match what is in storage', async () => {
      expect(sessionID).not.toEqual(existingSessionID);
    });

    it('has the new value in storage', async () => {
      expect(storageMock.data[STORAGE_KEY]).toContain(sessionID);
    });

    it('returns the new value when queried again', async () => {
      const again = await SessionID.get(SDK_KEY);
      expect(again).toBe(sessionID);
    });
  });

  describe('test age timeout resetting', () => {
    let client: jest.Mocked<PrecomputedEvaluationsInterface>;

    beforeEach(async () => {
      storageMock.clear();

      jest.useFakeTimers();
      storageMock.data[STORAGE_KEY] = JSON.stringify({
        sessionID: '1',
        startTime: Date.now() - (MAX_SESSION_AGE - 1),
        lastUpdate: Date.now(),
      });

      client = MockRemoteServerEvalClient.create();
      __STATSIG__ = { instance: () => client };
    });

    afterEach(() => {
      storageMock.clear();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('calls emit function after age timeout', async () => {
      await getSessionIDIgnoringInMemoryCache(SDK_KEY);
      jest.advanceTimersByTime(1);

      expect(client.$emt).toHaveBeenCalledTimes(1);
      expect(client.$emt).toHaveBeenCalledWith({ name: 'session_expired' });
    });
  });

  describe('when multiple calls to session id', () => {
    const data: Record<string, string> = {};
    let calls = 0;
    let firstReqPromise: TestPromise<string | null>;
    let secondReqPromise: TestPromise<string | null>;

    beforeAll(async () => {
      storageMock.clear();
      firstReqPromise = CreateTestPromise<string | null>();
      secondReqPromise = CreateTestPromise<string | null>();

      const inMemoryStore = {};

      Storage._setProvider({
        _getProviderName: () => 'JestStorage',
        _getAllKeys: () => Promise.resolve(Object.keys(inMemoryStore)),
        _getItem: async (_key: string) => {
          if (calls++ === 0) {
            return firstReqPromise;
          }
          return secondReqPromise;
        },
        _setItem: (key: string, value: string) => {
          data[key] = value;
          return Promise.resolve();
        },
        _removeItem: (key: string) => {
          delete data[key];
          return Promise.resolve();
        },
      });
    });

    it('gets the same session id', async () => {
      const sessionID = SessionID.get(SDK_KEY).catch(() => 'error');
      const sessionID2 = SessionID.get(SDK_KEY).catch(() => 'error');

      secondReqPromise.resolve(null);
      firstReqPromise.resolve(null);

      const val1 = await sessionID;
      const val2 = await sessionID2;

      expect(val1).toEqual(val2);
    });
  });
});
