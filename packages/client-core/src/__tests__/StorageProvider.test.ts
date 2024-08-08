import { MockLocalStorage, nullthrows } from 'statsig-test-helpers';

import type { StorageProvider } from '../StorageProvider';

async function getNewStorage(): Promise<StorageProvider> {
  let result: any = null;

  await jest.isolateModulesAsync(async () => {
    result = await import('../StorageProvider');
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return nullthrows(result).Storage;
}

describe('StorageProvider', () => {
  let storage: MockLocalStorage;
  let Storage: StorageProvider;

  describe.each([
    [
      'getItem',
      () => {
        return Storage._getItem('my_thing');
      },
    ],
  ])('Security Errors: %s', (_title, action) => {
    let value: string | null;

    beforeEach(async () => {
      Storage = await getNewStorage();
      storage = MockLocalStorage.enabledMockStorage();

      storage.getItem = () => {
        const error = new Error('Nah uh uh');
        error.name = 'SecurityError';
        throw error;
      };

      value = action() as any;
    });

    it('switches to inMemory when security throws', () => {
      expect(Storage._getProviderName()).toBe('InMemory');
    });

    it('gets a null value', () => {
      expect(value).toBeNull();
    });

    it('continues to function afterwards', () => {
      Storage._setItem('a_key', 'foo');
      const foo = Storage._getItem('a_key');

      expect(foo).toBe('foo');
    });
  });
});
