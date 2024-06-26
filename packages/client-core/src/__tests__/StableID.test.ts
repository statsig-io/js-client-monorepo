import { MockLocalStorage, anyUUID } from 'statsig-test-helpers';

import { _getStorageKey } from '../CacheKey';
import { StableID } from '../StableID';

async function getStableIDIgnoringInMemoryCache(
  sdkKey: string,
): Promise<string> {
  let result: string | null = null;
  await jest.isolateModulesAsync(async () => {
    const s = (await import('../StableID')).StableID;
    result = await s.get(sdkKey);
  });

  return result ?? 'error';
}

const SDK_KEY = 'client-sdk-key';
const STORAGE_KEY = `statsig.stable_id.${_getStorageKey(SDK_KEY)}`;

describe('StableID', () => {
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
  });

  describe('when storage is empty', () => {
    let stableID: string;

    beforeAll(async () => {
      storageMock.clear();
      stableID = await getStableIDIgnoringInMemoryCache(SDK_KEY);
    });

    it('generates a new ID when none is set in storage', async () => {
      expect(stableID).toEqual(anyUUID());
    });

    it('persists to storage', async () => {
      expect(storageMock.data[STORAGE_KEY]).toContain(stableID);
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
      stableID = await getStableIDIgnoringInMemoryCache(SDK_KEY);
    });

    it('matches what is in storage', async () => {
      expect(stableID).toEqual(existingStableID);
    });

    it('still has the same value in storage', async () => {
      expect(storageMock.data[STORAGE_KEY]).toContain(existingStableID);
    });

    it('returns the same value when queried again', async () => {
      const again = await getStableIDIgnoringInMemoryCache(SDK_KEY);
      expect(again).toBe(existingStableID);
    });
  });

  it('generates random ids', async () => {
    const first = await getStableIDIgnoringInMemoryCache(SDK_KEY);
    storageMock.clear();
    const second = await getStableIDIgnoringInMemoryCache(SDK_KEY);

    expect(first).not.toBe(second);
  });

  describe('when using different sdk keys', () => {
    let first: string;
    let second: string;

    beforeEach(async () => {
      storageMock.clear();
      first = await getStableIDIgnoringInMemoryCache('client-key-first');
      second = await getStableIDIgnoringInMemoryCache('client-key-second');
    });

    it('generates different results', async () => {
      expect(first).not.toMatch(second);
    });

    it('writes creates separate entries', () => {
      expect(Object.keys(storageMock.data)).toHaveLength(2);
    });
  });
});
