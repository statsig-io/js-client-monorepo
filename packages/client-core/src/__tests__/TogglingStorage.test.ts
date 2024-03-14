import { DataAdapterCore } from '../DataAdapterCore';
import { StatsigClientBase } from '../StatsigClientBase';
import { StatsigOptionsCommon } from '../StatsigOptionsCommon';
import { StatsigUser } from '../StatsigUser';
import { MockLocalStorage } from './MockLocalStorage';

class TestClient extends StatsigClientBase {}

class TestDataAdapter extends DataAdapterCore<{ has_updates: boolean }> {
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
      await client.getDataAdapter().getDataAsync(null);
      expect(storageMock.data).toEqual({});
    });

    it('writes to local storage once enabled', async () => {
      client.updateRuntimeOptions({ disableStorage: false });

      await client.getDataAdapter().getDataAsync(null);
      expect(Object.keys(storageMock.data).length).toBeGreaterThan(0);
    });
  });

  describe('when enabled', () => {
    beforeEach(() => {
      storageMock.clear();
      client = new TestClient('', adapter, jest.fn() as any, null);
    });

    it('writes to local storage', async () => {
      await client.getDataAdapter().getDataAsync(null);
      expect(Object.keys(storageMock.data).length).toBeGreaterThan(0);
    });

    it('does not write to local storage', async () => {
      client.updateRuntimeOptions({ disableStorage: true });

      await client.getDataAdapter().getDataAsync(null);
      expect(storageMock.data).toEqual({});
    });
  });
});
