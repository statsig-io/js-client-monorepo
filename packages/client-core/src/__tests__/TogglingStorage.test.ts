import { MockLocalStorage } from 'statsig-test-helpers';

import { DataAdapterCore } from '../DataAdapterCore';
import { StatsigClientBase } from '../StatsigClientBase';
import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  SpecsDataAdapter,
} from '../StatsigDataAdapter';
import { StatsigUser } from '../StatsigUser';

class TestClient extends StatsigClientBase<SpecsDataAdapter> {
  protected _primeReadyRipcord(): void {
    //
  }
}

class TestDataAdapter extends DataAdapterCore implements SpecsDataAdapter {
  constructor() {
    super('', '');
  }

  getDataAsync(
    current: DataAdapterResult | null,
    options?: DataAdapterAsyncOptions | undefined,
  ): Promise<DataAdapterResult | null> {
    return this._getDataAsyncImpl(current, undefined, options);
  }

  prefetchData(options?: DataAdapterAsyncOptions | undefined): Promise<void> {
    return this._prefetchDataImpl(undefined, options);
  }

  protected override _fetchFromNetwork(
    _current: string | null,
    _user?: StatsigUser | undefined,
  ): Promise<string | null> {
    return Promise.resolve(JSON.stringify({ has_updates: true }));
  }

  protected override _getCacheKey(): string {
    return 'test';
  }
}

describe('Toggle Storage', () => {
  let adapter: TestDataAdapter;
  let client: TestClient;
  let storageMock: MockLocalStorage;

  beforeAll(() => {
    storageMock = MockLocalStorage.enabledMockStorage();
    adapter = new TestDataAdapter();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  describe('when disabled', () => {
    const options = {
      disableStorage: true,
    };

    beforeEach(() => {
      storageMock.clear();
      client = new TestClient('client-key', adapter, jest.fn() as any, options);
    });

    it('does not write to local storage', async () => {
      await client.dataAdapter.getDataAsync(null);
      expect(storageMock.data).toEqual({});
    });

    it('writes to local storage once enabled', async () => {
      client.updateRuntimeOptions({ disableStorage: false });

      await client.dataAdapter.getDataAsync(null);
      expect(Object.keys(storageMock.data).length).toBeGreaterThan(0);
    });
  });

  describe('when enabled', () => {
    beforeEach(() => {
      storageMock.clear();
      client = new TestClient('client-key', adapter, jest.fn() as any, null);
    });

    it('writes to local storage', async () => {
      await client.dataAdapter.getDataAsync(null);
      expect(Object.keys(storageMock.data).length).toBeGreaterThan(0);
    });

    it('does not write to local storage', async () => {
      client.updateRuntimeOptions({ disableStorage: true });

      await client.dataAdapter.getDataAsync(null);
      expect(storageMock.data).toEqual({});
    });
  });
});
