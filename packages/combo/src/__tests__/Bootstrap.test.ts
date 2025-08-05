import fetchMock from 'jest-fetch-mock';
import {
  InitResponse,
  InitResponseStableID,
  MockLocalStorage,
  nullthrows,
} from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

beforeAll(() => {
  fetchMock.enableMocks();
});

describe('Bootstrap with explicit background refresh', () => {
  const user = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    fetchMock.mock.calls = [];
    fetchMock.mockResponse(
      JSON.stringify({ ...InitResponseStableID, time: 2, generator: 'mock' }),
    );

    storage = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-sdk-key', user);

    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );

    client.initializeSync({ disableBackgroundCacheRefresh: false });
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
    fetchMock.mock.calls = [];
    fetchMock.mockResponse(
      JSON.stringify({ ...InitResponseStableID, time: 2, generator: 'mock' }),
    );

    storage = MockLocalStorage.enabledMockStorage();

    client = new StatsigClient('client-sdk-key', user);

    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );

    client.initializeSync();
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
    // flush gets called when updating the user
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Special cases for Bootstrap', () => {
  it('logs correctly for stableID mismatch', async () => {
    const client = new StatsigClient('client-sdk-key', {
      userID: 'a-user',
    });
    client.dataAdapter.setData(JSON.stringify({ ...InitResponse, time: 1 }));
    client.initializeSync();

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'BootstrapStableIDMismatch:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toEqual([
      'StableIDMismatch',
    ]);
  });

  it('logs correctly for partial user match', async () => {
    const client = new StatsigClient('client-sdk-key', {
      userID: 'a-user',
      email: 'user@statsig.com',
      customIDs: {
        stableID: 'a-stable-id',
      },
    });
    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );
    client.initializeSync();

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'BootstrapPartialUserMatch:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toEqual([
      'PartialUserMatch',
    ]);
  });

  it('does not log user mismatch if contain private attributes', async () => {
    const client = new StatsigClient('client-sdk-key', {
      userID: 'a-user',
      customIDs: {
        stableID: 'a-stable-id',
      },
      privateAttributes: {
        privateField: 'private-value',
      },
    });
    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );
    client.initializeSync();

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Bootstrap:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toBeUndefined();
  });

  it('does not log user mismatch if contain analytics only metadata', async () => {
    const client = new StatsigClient('client-sdk-key', {
      userID: 'a-user',
      customIDs: {
        stableID: 'a-stable-id',
      },
      analyticsOnlyMetadata: {
        analyticsField: 'analytics-value',
      },
    });
    client.dataAdapter.setData(
      JSON.stringify({ ...InitResponseStableID, time: 1 }),
    );
    client.initializeSync();

    expect(client.getFeatureGate('a_gate').details.reason).toBe(
      'Bootstrap:Recognized',
    );

    expect(client.getFeatureGate('a_gate').details.warnings).toBeUndefined();
  });
});
