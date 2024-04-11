import { DJB2 } from '../Hashing';
import { SessionID } from '../SessionID';
import { MockLocalStorage } from './MockLocalStorage';

const UUID_V4_REGEX =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;

type TestPromise<T> = Promise<T> & {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: T | Error) => void;
};

function CreateTestPromise<T>(): TestPromise<T> {
  let resolver: any;
  let rejector: any;

  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  }) as unknown as TestPromise<T>;

  promise.resolve = resolver;
  promise.reject = rejector;

  return promise as unknown as TestPromise<T>;
}

async function getSessionIDFromIsolatedModule(sdkKey: string): Promise<string> {
  let result: string | null = null;
  await jest.isolateModulesAsync(async () => {
    const s = (await import('../SessionID')).SessionID;
    s._setEmitFunction(() => {
      return;
    }, sdkKey);
    result = await s.get(sdkKey);
  });

  return result ?? 'error';
}
const SDK_KEY = 'client-sdk-key';
const STORAGE_KEY = `statsig.session_id.${DJB2(SDK_KEY)}`;

describe('SessionID', () => {
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  describe('when storage is empty', () => {
    let sessionID: string;

    beforeAll(async () => {
      storageMock.clear();
      SessionID._setEmitFunction(() => {
        return;
      }, SDK_KEY);
      sessionID = await getSessionIDFromIsolatedModule(SDK_KEY);
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
        startTime: Date.now() - 1000 * 60 * 60,
        lastUpdate: Date.now() - 1000 * 60,
      });
      sessionID = await getSessionIDFromIsolatedModule(SDK_KEY);
    });

    it('matches what is in storage', async () => {
      expect(sessionID).toEqual(existingSessionID);
    });

    it('still has the same value in storage', async () => {
      const found = (await storageMock.getItem(STORAGE_KEY)) ?? 'ERROR';
      expect(JSON.parse(found).sessionID).toBe(existingSessionID);
    });

    it('returns the same value when queried again', async () => {
      const again = await getSessionIDFromIsolatedModule(SDK_KEY);
      expect(again).toBe(existingSessionID);
    });
  });

  it('generates random ids', async () => {
    const first = await getSessionIDFromIsolatedModule(SDK_KEY);
    storageMock.clear();
    const second = await getSessionIDFromIsolatedModule(SDK_KEY);

    expect(first).not.toBe(second);
  });

  describe('when using different sdk keys', () => {
    let first: string;
    let second: string;

    beforeEach(async () => {
      storageMock.clear();
      first = await getSessionIDFromIsolatedModule('client-key-first');
      second = await getSessionIDFromIsolatedModule('client-key-second');
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
      sessionID = await getSessionIDFromIsolatedModule(SDK_KEY);
    });

    it('does not match what is in storage', async () => {
      expect(sessionID).not.toEqual(existingSessionID);
    });

    it('has the new value in storage', async () => {
      const found = (await storageMock.getItem(STORAGE_KEY)) ?? 'ERROR';
      expect(JSON.parse(found).sessionID).toBe(sessionID);
    });

    it('returns the new value when queried again', async () => {
      const again = await getSessionIDFromIsolatedModule(SDK_KEY);
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
        startTime: Date.now() - 1000 * 60 * 60,
        lastUpdate: Date.now() - 1000 * 60 * 60,
      });
      sessionID = await getSessionIDFromIsolatedModule(SDK_KEY);
    });

    it('does not match what is in storage', async () => {
      expect(sessionID).not.toEqual(existingSessionID);
    });

    it('has the new value in storage', async () => {
      const found = (await storageMock.getItem(STORAGE_KEY)) ?? 'ERROR';
      expect(JSON.parse(found).sessionID).toBe(sessionID);
    });

    it('returns the new value when queried again', async () => {
      const again = await getSessionIDFromIsolatedModule(SDK_KEY);
      expect(again).toBe(sessionID);
    });
  });

  describe('test timeout with different keys', () => {
    let firstCalled = false;
    let secondCalled = false;
    let thridCalled = false;
    const firstSDKKey = 'client-key-first';
    const secondSDKKey = 'client-key-second';
    const thirdSDKKey = 'client-key-third';

    beforeAll(async () => {
      storageMock.clear();
      Object.defineProperty(global, 'performance', {
        writable: true,
      });

      jest.useFakeTimers();
      SessionID._setEmitFunction(() => {
        firstCalled = true;
      }, firstSDKKey);
      SessionID._setEmitFunction(() => {
        secondCalled = true;
      }, secondSDKKey);
      SessionID._setEmitFunction(() => {
        thridCalled = true;
      }, thirdSDKKey);
    });

    it('calls correct emit function for first key', async () => {
      await SessionID.get(firstSDKKey);
      jest.advanceTimersByTime(30 * 60 * 1000);
      expect(firstCalled).toBe(true);
      expect(secondCalled).toBe(false);
      firstCalled = false;
    });

    it('calls correct emit function for second key', async () => {
      await SessionID.get(secondSDKKey);
      jest.advanceTimersByTime(30 * 60 * 1000);
      expect(secondCalled).toBe(true);
      secondCalled = false;
    });

    it('does not call emit if enough time has not passed', async () => {
      await SessionID.get(firstSDKKey);
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(firstCalled).toBe(false);
      expect(secondCalled).toBe(false);
      jest.advanceTimersByTime(20 * 60 * 1000);
      expect(firstCalled).toBe(true);
      firstCalled = false;
    });

    it('timer resets after each call', async () => {
      await SessionID.get(thirdSDKKey);
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(thridCalled).toBe(false);
      await SessionID.get(thirdSDKKey);
      jest.advanceTimersByTime(20 * 60 * 1000);
      expect(thridCalled).toBe(false);
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(thridCalled).toBe(true);
      thridCalled = false;
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
      storageMock.getItem = () => {
        if (calls++ === 0) {
          return firstReqPromise;
        }
        return secondReqPromise;
      };
      storageMock.setItem = (key, value) => {
        data[key] = value;
      };
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
