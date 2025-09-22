import fetchMock from 'jest-fetch-mock';
import { MockLocalStorage } from 'statsig-test-helpers';

import StatsigClient from '../StatsigClient';

class TrackingMockLocalStorage extends MockLocalStorage {
  private _accessLog: string[] = [];

  override getItem(key: string): string | null {
    this._accessLog.push(`getItem:${key}`);
    return super.getItem(key);
  }

  override setItem(key: string, value: string): void {
    this._accessLog.push(`setItem:${key}`);
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    this._accessLog.push(`removeItem:${key}`);
    super.removeItem(key);
  }

  override clear(): void {
    this._accessLog.push('clear');
    super.clear();
  }

  getAccessLog(): string[] {
    return [...this._accessLog];
  }

  clearAccessLog(): void {
    this._accessLog = [];
  }
}

describe('StatsigClient Storage Access', () => {
  let storageMock: TrackingMockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');
  });

  afterAll(() => {
    jest.clearAllMocks();
    MockLocalStorage.disableMockStorage();
  });

  beforeEach(() => {
    storageMock = new TrackingMockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: storageMock,
    });
    storageMock.clearAccessLog();
  });

  it('does not access storage during constructor without stableID override', () => {
    const user = { userID: 'test-user' };

    const client = new StatsigClient('client-key', user);

    expect(storageMock.getAccessLog()).toEqual([]);
    expect(client).toBeDefined();
  });

  it('sets stableID override when storage is ready', () => {
    const user = {
      userID: 'test-user',
      customIDs: {
        stableID: 'custom-stable-id',
      },
    };

    const client = new StatsigClient('client-key', user);

    const hasStableIDStorage = storageMock
      .getAccessLog()
      .some((log) => log.includes('setItem:') && log.includes('stable_id'));

    expect(hasStableIDStorage).toBe(true);
    expect(client).toBeDefined();
  });

  describe('StableID.setOverride scenarios', () => {
    it('calls StableID.setOverride when isReadyResolver is null', async () => {
      const user = {
        userID: 'test-user',
        customIDs: {
          stableID: 'custom-stable-id',
        },
      };

      const client = new StatsigClient('client-key', user);
      client.storageProvider.isReadyResolver = () => null;
      (client as any)._configureUser(user, {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      const accessLog = storageMock.getAccessLog();
      const hasStableIDStorage = accessLog.some(
        (log) => log.includes('setItem:') && log.includes('stable_id'),
      );

      expect(hasStableIDStorage).toBe(true);
    });

    it('calls StableID.setOverride when isReadyResolver returns null', async () => {
      const user = {
        userID: 'test-user',
        customIDs: {
          stableID: 'custom-stable-id',
        },
      };

      const client = new StatsigClient('client-key', user);

      client.storageProvider.isReadyResolver = () => null;
      (client as any)._configureUser(user, {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      const accessLog = storageMock.getAccessLog();
      const hasStableIDStorage = accessLog.some(
        (log) => log.includes('setItem:') && log.includes('stable_id'),
      );

      expect(hasStableIDStorage).toBe(true);
    });

    it('calls StableID.setOverride when promise resolves', async () => {
      const user = {
        userID: 'test-user',
        customIDs: {
          stableID: 'custom-stable-id',
        },
      };

      const client = new StatsigClient('client-key', user);

      client.storageProvider.isReadyResolver = () => Promise.resolve();
      (client as any)._configureUser(user, {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      const accessLog = storageMock.getAccessLog();
      const hasStableIDStorage = accessLog.some(
        (log) => log.includes('setItem:') && log.includes('stable_id'),
      );

      expect(hasStableIDStorage).toBe(true);
    });

    it('calls StableID.setOverride when promise rejects', async () => {
      const user = {
        userID: 'test-user',
        customIDs: {
          stableID: 'custom-stable-id',
        },
      };

      const client = new StatsigClient('client-key', user);

      client.storageProvider.isReadyResolver = () =>
        Promise.reject(new Error('Storage error'));
      (client as any)._configureUser(user, {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      const accessLog = storageMock.getAccessLog();
      const hasStableIDStorage = accessLog.some(
        (log) => log.includes('setItem:') && log.includes('stable_id'),
      );

      expect(hasStableIDStorage).toBe(true);
    });
  });

  it('allows storage access during initialization', () => {
    const user = { userID: 'test-user' };
    const client = new StatsigClient('client-key', user);

    storageMock.clearAccessLog();

    client.initializeSync();

    expect(storageMock.getAccessLog().length).toBeGreaterThan(0);
  });
});
