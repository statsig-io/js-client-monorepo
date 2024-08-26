import fetchMock from 'jest-fetch-mock';
import {
  InitResponse,
  MockLocalStorage,
  nullthrows,
  skipFrame,
} from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Bootstrap', () => {
  const user = { userID: 'a-user' };
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(
      JSON.stringify({ ...InitResponse, time: 2, generator: 'mock' }),
    );

    storage = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-sdk-key', user, {
      environment: { tier: 'development' },
    });

    client.dataAdapter.setData(JSON.stringify({ ...InitResponse, time: 1 }));

    client.initializeSync();

    await skipFrame();
  });

  it('should have the reason "Bootstrap" ', () => {
    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Bootstrap:Recognized',
    );
  });

  it('should update the cache in the background', () => {
    const [, value] = nullthrows(
      Object.entries(storage.data).find(([k]) =>
        k.startsWith('statsig.cached.evaluations.'),
      ),
    );

    const result = JSON.parse(value);
    expect(JSON.parse(result.data).generator).toBe('mock');
  });

  it('should use the background value when updated next', () => {
    client.updateUserSync(user);

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Network:Recognized',
    );
  });
});

describe('Bootstrap with no background refresh', () => {
  const user = { userID: 'a-user' };
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.mockClear();

    storage = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-sdk-key', user, {
      environment: { tier: 'development' },
    });

    client.dataAdapter.setData(JSON.stringify({ ...InitResponse, time: 1 }));

    client.initializeSync({ disableBackgroundCacheRefresh: true });

    await skipFrame();
  });

  it('should have the reason "Bootstrap" ', () => {
    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Bootstrap:Recognized',
    );
  });

  it('should not update the cache in the background', () => {
    const entry = Object.entries(storage.data).find(([k]) =>
      k.startsWith('statsig.cached.evaluations.'),
    );

    expect(entry).toBeUndefined();
  });

  it('should use the same value when updated next', () => {
    client.updateUserSync(user, { disableBackgroundCacheRefresh: true });

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Bootstrap:Recognized',
    );
  });

  it('should not hit network', () => {
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
