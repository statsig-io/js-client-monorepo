import fetchMock from 'jest-fetch-mock';

import { SDKFlags, StatsigClient } from '@statsig/js-client';

beforeAll(() => {
  fetchMock.enableMocks();
});

describe('SDK Flags', () => {
  it('should set and get flags correctly', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        has_updates: true,
        time: 1,
        sdk_flags: {
          'flag-key': true,
        },
        generator: 'mock',
      }),
    );
    const user = {
      userID: 'a-user',
    };
    const client = new StatsigClient('client-sdk-key', user);
    await client.initializeAsync();

    const flag = SDKFlags.get('client-sdk-key', 'flag-key');
    expect(flag).toBe(true);

    const wrongSDKKeyFlag = SDKFlags.get('wrong-sdk-key', 'flag-key');
    expect(wrongSDKKeyFlag).toBe(false);
  });

  it('should reset flags correctly', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        has_updates: true,
        time: 1,
        sdk_flags: {
          'flag-key': true,
        },
        generator: 'mock',
      }),
    );
    const user = {
      userID: 'a-user',
    };
    const client = new StatsigClient('client-sdk-key', user);
    await client.initializeAsync();

    fetchMock.mockResponse(
      JSON.stringify({
        has_updates: true,
        time: 2,
        generator: 'mock',
      }),
    );
    await client.updateUserAsync({ userID: 'a-user' });
    const flag = SDKFlags.get('client-sdk-key', 'flag-key');
    expect(flag).toBe(false);
  });
});
