import { StableID } from '../StableID';

const SDK_KEY = 'client-sdk-key';

let alreadyCalled = false;
jest.mock('../StorageProvider', () => ({
  _getObjectFromStorage: async () => {
    if (alreadyCalled) {
      throw 'This should not be called';
    }

    alreadyCalled = true;
    await new Promise((r) => setTimeout(r, 100));

    return JSON.stringify('a-stable-id');
  },
  setObjectInStorage: () => {
    throw 'This should not be called';
  },
}));

describe('StableID - Async Behavior', () => {
  it('generates random ids', async () => {
    const first = StableID.get(SDK_KEY);
    const second = await StableID.get(SDK_KEY);

    expect(await first).toBe(second);
  });
});
