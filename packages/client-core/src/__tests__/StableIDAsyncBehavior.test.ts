import { StableID } from '../StableID';

export const UUID_V4_REGEX =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/;

const SDK_KEY = 'client-sdk-key';

let alreadyCalled = false;
jest.mock('../StorageProvider', () => ({
  getObjectFromStorage: async () => {
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
