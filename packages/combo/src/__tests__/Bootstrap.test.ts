import fetchMock from 'jest-fetch-mock';
import {
  InitResponse,
  InitResponseStableID,
  MockLocalStorage,
  nullthrows,
  skipFrame,
} from 'statsig-test-helpers';

import { StatsigClient, StatsigUser } from '@statsig/js-client';

describe('Bootstrap', () => {
  const user = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(
      JSON.stringify({ ...InitResponseStableID, time: 2, generator: 'mock' }),
    );

    storage = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-sdk-key', user);

    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );

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
  const user = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.mockClear();

    storage = MockLocalStorage.enabledMockStorage();
    client = initializeBootstrapClient(InitResponseStableID, user, true);
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

describe('Bad Bootstrap', () => {
  it('logs correctly for stableID mismatch', async () => {
    const client = initializeBootstrapClient(InitResponse, {
      userID: 'a-user',
    });

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'BootstrapStableIDMismatch:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toEqual([
      'StableIDMismatch',
    ]);
  });

  it('logs correctly for partial user match', async () => {
    const client = initializeBootstrapClient(InitResponseStableID, {
      userID: 'a-user',
      email: 'user@statsig.com',
      customIDs: {
        stableID: 'a-stable-id',
      },
    });

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'BootstrapPartialUserMatch:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toEqual([
      'PartialUserMatch',
    ]);
  });
});

function initializeBootstrapClient(
  response: any,
  user: StatsigUser,
  disableBackgroundCacheRefresh = false,
) {
  fetchMock.mockResponse(JSON.stringify(response));
  const client = new StatsigClient('client-sdk-key', user);
  client.dataAdapter.setData(JSON.stringify({ ...response, time: 1 }));
  client.initializeSync({ disableBackgroundCacheRefresh });
  return client;
}
