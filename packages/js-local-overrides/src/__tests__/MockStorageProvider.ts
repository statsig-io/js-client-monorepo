import { StorageProvider } from '@statsig/client-core';

export class MockStorageProvider implements StorageProvider {
  public data: Record<string, string> = {};
  private _readyPromise: Promise<void>;
  private _resolveReady: (() => void) | null = null;

  constructor(private ready = true) {
    this._readyPromise = new Promise((resolve) => {
      if (this.ready) {
        resolve();
      } else {
        this._resolveReady = resolve;
      }
    });
  }

  getItem(key: string): string | null {
    return this.data[key] || null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  isReady(): boolean {
    return this.ready;
  }

  getProviderName(): string {
    return 'MockStorage';
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  getAllKeys(): readonly string[] {
    return Object.keys(this.data);
  }

  isReadyResolver(): Promise<void> {
    return this._readyPromise;
  }

  setReady(ready: boolean): void {
    this.ready = ready;
    if (ready && this._resolveReady) {
      this._resolveReady();
      this._resolveReady = null;
    }
  }

  reset(): void {
    this.data = {};
    this.ready = true;
    this._resolveReady = null;
    this._readyPromise = Promise.resolve();
  }
}
