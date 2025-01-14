import {
  InitResponseStableIDString,
  InitResponseString,
} from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Statsig Update Details', () => {
  let client: StatsigClient;
  const user = {
    userID: 'a-user',
    customIDs: {
      stableID: 'a-stable-id',
    },
  };

  afterEach(async () => {
    await client.shutdown();
  });

  it('InitializeSync Successfully with Bootstrap', async () => {
    client = new StatsigClient('client-key', user);
    client.dataAdapter.setData(InitResponseStableIDString);
    const updateDetails = client.initializeSync({
      disableBackgroundCacheRefresh: true,
    });

    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: true,
        source: 'Bootstrap',
        error: null,
      }),
    );
  });

  it('InitializeSync Succeeds with Bootstrap Mismatch', async () => {
    client = new StatsigClient('client-key', { userID: 'a-user' });
    client.dataAdapter.setData(InitResponseString);
    const updateDetails = client.initializeSync({
      disableBackgroundCacheRefresh: true,
    });

    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: true,
        source: 'Bootstrap',
        error: null,
        warnings: expect.any(Array),
      }),
    );
  });

  it('InitializeSync Fails with No Values in Data Adapter', async () => {
    client = new StatsigClient('client-key', { userID: 'a-user' });
    const updateDetails = client.initializeSync({
      disableBackgroundCacheRefresh: true,
    });

    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: true,
        source: 'NoValues',
        warnings: expect.any(Array),
      }),
    );
  });

  it('InitializeAsync Success', async () => {
    client = new StatsigClient('client-key', user);
    const updateDetails = await client.initializeAsync();

    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: false,
        source: 'NoValues',
        error: expect.any(Error),
      }),
    );
    expect(updateDetails.duration).toBeGreaterThan(0);
  });

  it('InitializeAsync Fails with Timeout', async () => {
    client = new StatsigClient('client-key', user);
    const updateDetails = await client.updateUserAsync(
      { userID: 'a-user' },
      { timeoutMs: 1 },
    );
    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: false,
        source: 'NoValues',
        error: expect.any(Error),
      }),
    );
    expect(updateDetails.duration).toBeLessThanOrEqual(1);
  });

  it('InitializeAsync Fails with bad SDK Key', async () => {
    client = new StatsigClient('client-key', user);
    const updateDetails = await client.initializeAsync();

    expect(updateDetails).toEqual(
      expect.objectContaining({
        success: false,
        source: 'NoValues',
        error: expect.any(Error),
      }),
    );
  });
});
