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

  beforeEach(async () => {
    Storage = await getNewStorage();
    storage = MockLocalStorage.enabledMockStorage();

    storage.getItem = () => {
      const error = new Error('Nah uh uh');
      error.name = 'SecurityError';
      throw error;
    };

    // LocalStorage just does Object.keys on the top level object
    (storage as any)['statsig.bar'] = 'aa';
    (storage as any)['statsig.foo'] = 'bb';

    storage.setItem = () => {
      const error = new Error('Too much');
      error.name = 'QuotaExceededError';
      throw error;
    };
  });

  describe('Security Errors', () => {
    let value: string | null;

    beforeEach(async () => {
      value = Storage.getItem('my_thing');
    });

    it('switches to inMemory when security throws', () => {
      expect(Storage.getProviderName()).toBe('InMemory');
    });

    it('gets a null value', () => {
      expect(value).toBeNull();
    });

    it('continues to function afterwards', () => {
      Storage.setItem('a_key', 'foo');
      const foo = Storage.getItem('a_key');

      expect(foo).toBe('foo');
    });
  });

  describe('Quota Exceeded Errors', () => {
    let error: Error | null;

    beforeEach(async () => {
      try {
        Storage.setItem('my_thing', 'foo');
      } catch (e) {
        error = e as Error;
      }
    });

    it('throws the error with statsig key info', () => {
      const message = error?.message ?? '';
      expect(message).toContain('Statsig Keys: 2');
    });

    it('throw the error with the correct name', () => {
      expect(error?.name).toBe('QuotaExceededError');
    });
  });
});
