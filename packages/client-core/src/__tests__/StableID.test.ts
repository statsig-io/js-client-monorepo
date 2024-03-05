import { DJB2 } from '../Hashing';
import { StableID } from '../StableID';
import { MockLocalStorage } from './MockLocalStorage';

const UUID_V4_REGEX =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;

async function getStableIDFromIsolatedModule(sdkKey: string): Promise<string> {
  let result: string | null = null;
  await jest.isolateModulesAsync(async () => {
    const s = (await import('../StableID')).StableID;
    result = await s.get(sdkKey);
  });

  return result ?? 'error';
}
const SDK_KEY = 'client-sdk-key';
const STORAGE_KEY = `STATSIG_STABLE_ID:${DJB2(SDK_KEY)}`;

describe('StableID', () => {
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  describe('when storage is empty', () => {
    let stableID: string;

    beforeAll(async () => {
      storageMock.clear();
      stableID = await getStableIDFromIsolatedModule(SDK_KEY);
    });

    it('generates a new ID when none is set in storage', async () => {
      expect(stableID).toMatch(UUID_V4_REGEX);
    });

    it('persists to storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
      expect(JSON.parse(found)).toBe(stableID);
    });

    it('returns the same value when queried again', async () => {
      const again = await StableID.get(SDK_KEY);
      expect(again).toBe(stableID);
    });
  });

  describe('when storage has a stable id', () => {
    const existingStableID = '860e7083-d9ee-4d1a-bc71-e671ad522e0f';

    let stableID: string;

    beforeAll(async () => {
      storageMock.clear();
      storageMock.data[STORAGE_KEY] = JSON.stringify(existingStableID);
      stableID = await getStableIDFromIsolatedModule(SDK_KEY);
    });

    it('matches what is in storage', async () => {
      expect(stableID).toEqual(existingStableID);
    });

    it('still has the same value in storage', () => {
      const found = storageMock.getItem(STORAGE_KEY) ?? 'ERROR';
      expect(JSON.parse(found)).toBe(existingStableID);
    });

    it('returns the same value when queried again', async () => {
      const again = await getStableIDFromIsolatedModule(SDK_KEY);
      expect(again).toBe(existingStableID);
    });
  });

  it('generates random ids', async () => {
    const first = await getStableIDFromIsolatedModule(SDK_KEY);
    storageMock.clear();
    const second = await getStableIDFromIsolatedModule(SDK_KEY);

    expect(first).not.toBe(second);
  });

  describe('when using different sdk keys', () => {
    let first: string;
    let second: string;

    beforeEach(async () => {
      storageMock.clear();
      first = await getStableIDFromIsolatedModule('client-key-first');
      second = await getStableIDFromIsolatedModule('client-key-second');
    });

    it('generates different results', async () => {
      expect(first).not.toMatch(second);
    });

    it('writes creates separate entries', () => {
      expect(Object.keys(storageMock.data)).toHaveLength(2);
    });
  });
});
