const actualLocalStorage = window.localStorage;

// todo: move to test-helpers (break circular dep)
export class MockLocalStorage {
  data: Record<string, string> = {};

  static enabledMockStorage(): MockLocalStorage {
    const value = new MockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value,
    });
    return value;
  }

  static disableMockStorage(): void {
    Object.defineProperty(window, 'localStorage', {
      value: actualLocalStorage,
    });
  }

  // LocalStorage Functions

  clear(): void {
    this.data = {};
  }

  async getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.data[key] ? this.data[key] : null);
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.data[key];
  }
}
