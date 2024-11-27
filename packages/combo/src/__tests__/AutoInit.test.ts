import fetchMock from 'jest-fetch-mock';

import { StatsigClient } from '@statsig/js-client';

import { AutoInit } from '../AutoInit';

describe('Auto Init Tests', () => {
  beforeAll(() => {
    fetchMock.enableMocks();

    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'user_agent_test',
        language: 'kw',
      },
    });
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://foo.com/',
      },
    });
    Object.defineProperty(document, 'currentScript', {
      value: {
        getAttribute: () => 'http://statsig.com/?sdkkey=client-foobar',
        dataset: {
          onStatsigInit: 'postInitCallback',
        },
      },
    });
  });

  beforeEach(() => {
    Object.defineProperty(window, '__STATSIG__', {
      value: {
        instances: {},
      },
    });
  });

  it('has valid values with no overrides', async () => {
    let actionCalled = false;
    AutoInit.attempt(({ client }) => {
      const user = client['_user'];
      expect(user.custom).toEqual({
        useragent: 'user_agent_test',
        page_url: 'http://foo.com/',
        language: 'kw',
      });
      actionCalled = true;
    });
    expect(actionCalled).toBe(true);
  });

  it('has overridden values when present', async () => {
    let actionCalled = false;
    Object.defineProperty(window, 'statsigUser', {
      value: {
        userID: 'testID',
        custom: {
          user_name: 'Daniel Loomb',
        },
        customIDs: {
          email: 'foo@bar.com',
        },
      },
      writable: true,
    });
    AutoInit.attempt(({ client }) => {
      const user = client['_user'];
      expect(user.custom).toEqual({
        useragent: 'user_agent_test',
        page_url: 'http://foo.com/',
        language: 'kw',
        user_name: 'Daniel Loomb',
      });
      expect(user.customIDs).toEqual({
        email: 'foo@bar.com',
      });
      actionCalled = true;
    });
    expect(actionCalled).toBe(true);
  });

  it('does not override truthy values', async () => {
    let actionCalled = false;
    Object.defineProperty(window, 'statsigUser', {
      value: {
        userID: 'testID',
        custom: {
          useragent: 'barfoo',
          language: 'en',
        },
      },
      writable: true,
    });
    AutoInit.attempt(({ client }) => {
      const user = client['_user'];
      expect(user.custom).toEqual({
        useragent: 'user_agent_test',
        page_url: 'http://foo.com/',
        language: 'kw',
      });
      actionCalled = true;
    });
    expect(actionCalled).toBe(true);
  });

  it('callsback postInitCallback when set', async () => {
    let callbackExecuted = false;
    let callbackClient: StatsigClient | null = null;
    Object.defineProperty(window, 'postInitCallback', {
      value: (c: StatsigClient) => {
        callbackExecuted = true;
        callbackClient = c;
      },
      writable: true,
    });
    let initClient = null;
    AutoInit.attempt(({ client }) => {
      expect(client).not.toBeNull();
      initClient = client;
    });

    await new Promise(process.nextTick);
    expect(callbackExecuted).toBe(true);
    expect(callbackClient).toBe(initClient);
  });
});
