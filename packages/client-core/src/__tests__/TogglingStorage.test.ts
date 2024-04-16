import { MockLocalStorage } from 'statsig-test-helpers';

import { DataAdapterCore } from '../DataAdapterCore';
import { StatsigClientBase } from '../StatsigClientBase';
import { SpecsDataAdapter } from '../StatsigDataAdapter';
import { StatsigOptionsCommon } from '../StatsigOptionsCommon';
import { StatsigUser } from '../StatsigUser';

class TestClient extends StatsigClientBase<SpecsDataAdapter> {}

class TestDataAdapter extends DataAdapterCore {
  protected override _fetchFromNetwork(
    _current: string | null,
    _user?: StatsigUser | undefined,
  ): Promise<string | null> {
    return Promise.resolve(JSON.stringify({ has_updates: true }));
  }

  constructor() {
    super('', '');
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
    const options: StatsigOptionsCommon = {
      disableStorage: true,
    };

    beforeEach(() => {
      storageMock.clear();
      client = new TestClient('', adapter, jest.fn() as any, options);
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
      client = new TestClient('', adapter, jest.fn() as any, null);
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
