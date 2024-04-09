import { DJB2 } from '../Hashing';
import { SessionID } from '../SessionID';
import { MockLocalStorage } from './MockLocalStorage';

const UUID_V4_REGEX =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;

async function getSessionIDFromIsolatedModule(sdkKey: string): Promise<string> {
  let result: string | null = null;
  await jest.isolateModulesAsync(async () => {
    const s = (await import('../SessionID')).SessionID;
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
      sessionID = await getSessionIDFromIsolatedModule(SDK_KEY);
    });

    it('generates a new ID when none is set in storage', async () => {
      expect(sessionID).toMatch(UUID_V4_REGEX);
    });

    it('persists to storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
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

    it('still has the same value in storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
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

    it('has the new value in storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
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

    it('has the new value in storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
      expect(JSON.parse(found).sessionID).toBe(sessionID);
    });

    it('returns the new value when queried again', async () => {
      const again = await getSessionIDFromIsolatedModule(SDK_KEY);
      expect(again).toBe(sessionID);
    });
  });
});
