const win = typeof window !== 'undefined' ? window : undefined;
const actualLocalStorage = win?.localStorage;

export class MockLocalStorage {
  data: Record<string, string> = {};

  static enabledMockStorage(): MockLocalStorage {
    const value = new MockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value,
    });
    return value;
  }

  static disableMockStorage(): void {
    Object.defineProperty(global, 'localStorage', {
      value: actualLocalStorage,
    });
  }

  // LocalStorage Functions

  clear(): void {
    this.data = {};
  }

  getItem(key: string): string | null {
    return this.data[key] ? this.data[key] : null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.data[key];
  }
}
